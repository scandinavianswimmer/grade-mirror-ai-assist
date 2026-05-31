// POST /grade-submission  { submissionId }
// Auth: JWT (identity derived from token; submission ownership enforced by RLS).
// Loads the submission + its assignment rubric, runs the grading engine, persists the verified
// grade + annotations, logs the LLM session. Returns the GradingResult or an explicit error.
import { handlePreflight } from "../_shared/cors.ts";
import { withErrors, ok, AppError } from "../_shared/http.ts";
import { getUserFromJWT, timingSafeEqual } from "../_shared/auth.ts";
import { userClient, adminClient } from "../_shared/db.ts";
import { gradeSubmission, type AgentStep } from "../_shared/grading/engine.ts";
import { synthesizeRubric, toRubricInput } from "../_shared/grading/rubric-synth.ts";
import { maskNamesPreservingOffsets } from "../_shared/deid.ts";
import { enforceGradingQuota } from "../_shared/quota.ts";
import type { RubricInput } from "../_shared/grading-schema.ts";

Deno.serve((req) => {
  const pre = handlePreflight(req);
  if (pre) return pre;

  return withErrors(req, async () => {
    if (req.method !== "POST") throw new AppError(405, "method", "POST only");
    const body = await req.json().catch(() => ({}));
    const submissionId = body.submissionId;
    if (!submissionId) throw new AppError(400, "input", "submissionId is required");

    // Auth: normally the teacher's JWT (RLS-scoped). The Cloud Run grading worker (Phase 4) instead
    // presents x-internal-secret + userId for service-to-service grading on the teacher's behalf;
    // ownership is then verified explicitly against the loaded submission below.
    const internalSecret = Deno.env.get("INTERNAL_GRADE_SECRET");
    const providedInternal = req.headers.get("x-internal-secret") ?? "";
    const isInternal = Boolean(internalSecret) && timingSafeEqual(providedInternal, internalSecret);
    let userId: string;
    let db;
    if (isInternal) {
      if (typeof body.userId !== "string") throw new AppError(400, "input", "userId required for internal call");
      userId = body.userId;
      db = adminClient(); // bypasses RLS — ownership verified explicitly below; all writes set user_id
    } else {
      ({ userId } = await getUserFromJWT(req));
      db = userClient(req); // RLS: only the owner can read this submission
    }
    const jobId = crypto.randomUUID(); // groups this grading run's agent_events steps (AGENT-02)

    // Select user_id only for the internal worker path (the v1 schema may lack it); the normal JWT
    // path relies on RLS for ownership, so it stays on the original v1-safe column set.
    const submissionCols = "id, assignment_id, extracted_text, extraction_confidence, status, student_name" + (isInternal ? ", user_id" : "");
    const { data: submission, error: subErr } = await db
      .from("submissions")
      .select(submissionCols)
      .eq("id", submissionId)
      .single();
    if (subErr || !submission) throw new AppError(404, "submission", "Submission not found");
    if (isInternal && (submission as { user_id?: string }).user_id !== userId) {
      throw new AppError(403, "forbidden", "Submission does not belong to the provided userId");
    }

    if (!submission.extracted_text || (submission.extraction_confidence ?? 0) < 0.2) {
      await db.from("submissions").update({ status: "needs_review" }).eq("id", submissionId);
      throw new AppError(422, "needs_review", "Submission text missing/low-confidence; needs manual review");
    }

    // Rate-limit Layer A: per-teacher quota, atomic + race-safe, BEFORE any paid model call.
    // Skipped for the internal worker path (auth.uid() is null there; quota was reserved at enqueue).
    if (!isInternal) {
      await enforceGradingQuota(db, 1);
    }

    // Assignment + class context: the relevance gate needs the task; calibration needs the level.
    // Essential prompt: `instructions` is present on both v1 and v2 schemas (the relevance gate +
    // rubric synthesis depend on it). Other columns are loaded best-effort below so a missing v2
    // column on the not-yet-migrated cloud schema can't break grading.
    const { data: asg } = await db
      .from("assignments")
      .select("instructions")
      .eq("id", submission.assignment_id)
      .maybeSingle();
    let assignmentPrompt = (asg?.instructions ?? "").trim();

    // Title + class context for calibration — best-effort (may be absent on older schemas).
    let classContext: string | undefined;
    const { data: asgMeta } = await db
      .from("assignments")
      .select("title, course_name, class_id")
      .eq("id", submission.assignment_id)
      .maybeSingle();
    if (asgMeta?.title) assignmentPrompt = [asgMeta.title, assignmentPrompt].filter(Boolean).join("\n\n").trim();
    if (asgMeta?.class_id) {
      const { data: cls } = await db
        .from("classes")
        .select("name, details")
        .eq("id", asgMeta.class_id)
        .maybeSingle();
      if (cls) {
        const details = typeof cls.details === "object" && cls.details ? JSON.stringify(cls.details) : "";
        classContext = [cls.name, asgMeta.course_name, details].filter(Boolean).join(" · ").slice(0, 600);
      }
    }

    // Teacher style profile (Phase 9 / LEARN-03): injected into the grader so feedback matches the
    // teacher's voice + standards. Absent for new teachers (cold start) — grading proceeds rubric-only.
    let styleProfile: string | undefined;
    {
      const { data: prof } = await db
        .from("teacher_style_profiles")
        .select("style_summary")
        .eq("user_id", userId)
        .maybeSingle();
      if (prof?.style_summary) styleProfile = prof.style_summary as string;
    }

    // Load the structured rubric. If none exists, synthesize a strict one from the assignment +
    // class level and persist it (GRADE-02) — never grade against model-invented generic criteria.
    // Load the canonical rubric for this assignment. Tolerate duplicates (don't use maybeSingle,
    // which throws on >1 row): pick the earliest so every submission grades against the same one.
    const { data: rubricRows } = await db
      .from("rubrics")
      .select("id, total_points")
      .eq("assignment_id", submission.assignment_id)
      .order("created_at", { ascending: true })
      .limit(1);
    const rubricRow = rubricRows?.[0] ?? null;

    const rubricStarted = Date.now();
    let rubricSynthesized = false;
    let rubric: RubricInput | null = null;
    if (rubricRow) {
      const { data: crit } = await db
        .from("rubric_criteria")
        .select("name, weight, max_score, level_descriptors")
        .eq("rubric_id", rubricRow.id)
        .order("sort_order");
      if (crit && crit.length > 0) {
        rubric = {
          totalPoints: Number(rubricRow.total_points) || 100,
          criteria: crit.map((c) => ({
            name: c.name,
            weight: Number(c.weight),
            maxScore: Number(c.max_score),
            levelDescriptors: (c.level_descriptors ?? {}) as Record<string, string>,
          })),
        };
      }
    }

    if (!rubric) {
      await db.from("submissions").update({ status: "grading" }).eq("id", submissionId);
      try {
        const synth = await synthesizeRubric(assignmentPrompt, classContext);
        rubric = toRubricInput(synth);
        rubricSynthesized = true;
        // Persist so the teacher can review/edit and grading is reproducible (best-effort).
        // The live (v1-derived) rubrics table requires NOT NULL title + rubric_json; the v2 schema
        // has neither. Insert with them and fall back to the minimal payload if the columns are
        // absent — mirrors the rubric_snapshot fallback below. (Without this the insert silently
        // failed every grade, so each submission re-synthesized a slightly different rubric.)
        const rubricInsert: Record<string, unknown> = {
          user_id: userId,
          assignment_id: submission.assignment_id,
          total_points: synth.totalPoints,
          title: "aiTA synthesized rubric",
          rubric_json: synth,
        };
        let { data: newRubric, error: rubErr } = await db
          .from("rubrics").insert(rubricInsert).select("id").single();
        if (rubErr && /rubric_json|title|column|schema cache/i.test(rubErr.message)) {
          delete rubricInsert.title;
          delete rubricInsert.rubric_json;
          ({ data: newRubric, error: rubErr } = await db
            .from("rubrics").insert(rubricInsert).select("id").single());
        }
        if (rubErr) {
          console.error(`[grade-submission] rubric persist failed (grading with synthesized rubric anyway): ${rubErr.message}`);
        } else if (newRubric) {
          const { error: critErr } = await db.from("rubric_criteria").insert(
            synth.criteria.map((c, i) => ({
              user_id: userId,
              rubric_id: newRubric.id,
              name: c.name,
              weight: c.weight,
              max_score: c.maxScore,
              level_descriptors: { "Full marks": c.fullMarks, "No marks": c.noMarks },
              sort_order: i,
            })),
          );
          if (critErr) console.error(`[grade-submission] rubric_criteria persist failed: ${critErr.message}`);
        }
      } catch (e) {
        // RELY-01: a synthesis failure (e.g. model error) must not crash grading — fall back to the
        // assignment instructions as a free-text rubric so grading still proceeds.
        console.error(`[grade-submission] rubric synthesis failed, using free-text fallback: ${e instanceof Error ? e.message : String(e)}`);
        rubric = {
          totalPoints: 100,
          criteria: [],
          freeText: assignmentPrompt || "Grade the submission holistically for quality and relevance to the assignment.",
        };
        rubricSynthesized = false;
      }
    }

    if (!rubric) throw new AppError(500, "rubric_missing", "No rubric available to grade against");

    // Rubric agent step (AGENT-01): synthesized or loaded the structured rubric this run grades against.
    const rubricStep: AgentStep = {
      agent: "rubric",
      status: "ok",
      latencyMs: Date.now() - rubricStarted,
      detail: { source: rubricSynthesized ? "synthesized" : "existing", criteria: rubric.criteria.length, totalPoints: rubric.totalPoints },
    };

    await db.from("submissions").update({ status: "grading" }).eq("id", submissionId);

    // FERPA de-identification (H1): strip the student's own name from the essay BEFORE it is sent to
    // the third-party LLM, when the teacher has anonymization enabled (default ON). Length-preserving
    // so annotation offsets still anchor onto the original text shown in the UI. The teacher still
    // sees the real name locally; only the text leaving for Gemini is redacted.
    let essayForGrading = submission.extracted_text as string;
    {
      const studentName = ((submission as { student_name?: string }).student_name ?? "").trim();
      if (studentName.length >= 2) {
        const { data: ps } = await db
          .from("privacy_settings")
          .select("anonymize_student_names")
          .eq("user_id", userId)
          .maybeSingle();
        const anonymize = ps?.anonymize_student_names ?? true; // default-on if no row
        if (anonymize) {
          essayForGrading = maskNamesPreservingOffsets(submission.extracted_text, [studentName]) ?? submission.extracted_text;
        }
      }
    }

    let outcome;
    try {
      outcome = await gradeSubmission({
        essay: essayForGrading,
        rubric,
        assignmentPrompt,
        classContext,
        styleProfile,
      });
    } catch (err) {
      await db.from("submissions").update({ status: "grade_error" }).eq("id", submissionId);
      throw err; // explicit error to the client — never a fabricated grade
    }
    const { result, usage, disposition } = outcome;
    const trace: AgentStep[] = [rubricStep, ...outcome.trace];

    // Persist grade under the owner's RLS context. The grade is the critical write — fail loud (OPS-02).
    const gradeRow: Record<string, unknown> = {
      user_id: userId,
      submission_id: submissionId,
      schema_version: result.schemaVersion,
      overall_score: result.overall.score,
      overall_max: result.overall.maxScore,
      letter: result.overall.letter ?? null,
      confidence: result.overall.confidence,
      criteria: result.criteria,
      summary_feedback: result.summaryFeedback,
      flags: result.flags,
      model_id: result.modelId,
      rubric_snapshot: rubric, // snapshot the rubric used so later edits don't rewrite history (M69)
    };
    let gradeRes = await db.from("submission_grades").insert(gradeRow).select("id").single();
    if (gradeRes.error && /rubric_snapshot/.test(gradeRes.error.message)) {
      // v1 schema (pre-migration) lacks rubric_snapshot — retry without it; migrations add it back.
      console.error("[grade-submission] rubric_snapshot column missing; persisting grade without snapshot");
      delete gradeRow.rubric_snapshot;
      gradeRes = await db.from("submission_grades").insert(gradeRow).select("id").single();
    }
    const grade = gradeRes.data;
    if (gradeRes.error || !grade) {
      await db.from("submissions").update({ status: "grade_error" }).eq("id", submissionId);
      throw new AppError(500, "grade_persist", `Failed to save grade: ${gradeRes.error?.message ?? "unknown"}`);
    }

    // Re-grade hygiene: a (re)grade replaces the prior AI pass, so clear this submission's existing
    // annotations before inserting the fresh set — otherwise notes pile up across re-grades (duplicates).
    // Best-effort + non-fatal (the grade is already saved); delete edits first since the v1 cloud schema
    // may lack ON DELETE CASCADE on annotation_edits.annotation_id, which would otherwise block the delete.
    const { data: priorAnns } = await db.from("annotations").select("id").eq("submission_id", submissionId);
    if (priorAnns && priorAnns.length) {
      const priorIds = priorAnns.map((a) => a.id);
      const { error: edDelErr } = await db.from("annotation_edits").delete().in("annotation_id", priorIds);
      if (edDelErr) console.error(`[grade-submission] annotation_edits cleanup failed: ${edDelErr.message}`);
      const { error: annDelErr } = await db.from("annotations").delete().eq("submission_id", submissionId);
      if (annDelErr) console.error(`[grade-submission] annotation cleanup failed: ${annDelErr.message}`);
    }

    if (result.annotations.length) {
      const { error: annErr } = await db.from("annotations").insert(
        result.annotations.map((a) => ({
          user_id: userId,
          submission_id: submissionId,
          start_index: a.matched ? a.startIndex : null,
          end_index: a.matched ? a.endIndex : null,
          quote: a.quote,
          comment: a.comment,
          ai_comment: a.comment, // preserve the original AI wording for the edit audit trail (M50)
          type: a.type,
          matched: a.matched,
        })),
      );
      // Surface (don't swallow) annotation-insert failures. Until migrations 0003-0011 are applied the
      // `annotations.ai_comment` column is missing — log so it's visible, but keep the grade itself.
      if (annErr) console.error(`[grade-submission] annotation insert failed: ${annErr.message}`);
    }

    // Disposition: off-topic / low-confidence grades are surfaced for review, not presented as settled.
    const finalStatus = disposition === "needs_review" ? "needs_review" : "graded";
    await db.from("submissions").update({ status: finalStatus }).eq("id", submissionId);

    // Audit + LLM session via service role (server-only tables).
    const admin = adminClient();
    await admin.from("llm_sessions").insert({
      user_id: userId,
      kind: "grade",
      model_id: result.modelId,
      input_tokens: usage.inputTokens,
      output_tokens: usage.outputTokens,
      cache_read_tokens: usage.cacheReadTokens,
      ok: true,
    });
    await admin.from("access_audit_log").insert({
      actor_id: userId,
      action: "grade_submission",
      resource: `submission:${submissionId}`,
    });

    // Persist the agent-workflow trace (AGENT-02) for the pipeline view + observability. Until
    // migration 0013 is applied the agent_events table is absent — log, don't fail the grade.
    const { error: traceErr } = await admin.from("agent_events").insert(
      trace.map((s) => ({
        user_id: userId,
        submission_id: submissionId,
        job_id: jobId,
        agent: s.agent,
        status: s.status,
        model_id: s.modelId ?? null,
        latency_ms: s.latencyMs,
        input_tokens: s.inputTokens ?? null,
        output_tokens: s.outputTokens ?? null,
        detail: s.detail,
      })),
    );
    if (traceErr) console.error(`[grade-submission] agent_events insert failed: ${traceErr.message}`);

    return ok(req, { gradeId: grade?.id ?? null, result, jobId, trace });
  });
});
