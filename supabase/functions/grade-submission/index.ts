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
import { resolveAssignmentContext, MISSING_CONTEXT_REASON } from "../_shared/grading/assignment-context.ts";
import { maskNamesPreservingOffsets } from "../_shared/deid.ts";
import { enforceGradingQuota } from "../_shared/quota.ts";
import {
  decideFinalization,
  AUTO_FINALIZE_DEFAULT_ENABLED,
  AUTO_FINALIZE_DEFAULT_THRESHOLD,
} from "../_shared/grading/auto-finalize.ts";
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
    // `instructions` is present on both v1 and v2 schemas. CRITICALLY, the assignment-creation UI writes
    // the teacher's PROMPT to `description` and their RUBRIC to `rubric_text` (v1/Lovable columns) — so
    // the grader MUST read those too, or an app-created assignment is graded against its title alone,
    // with the teacher's real prompt + rubric silently dropped (Sleuth F-001/F-002). The resolution +
    // trust decision happens after the canonical-rubric load below (it needs hasCanonicalRubric).
    const { data: asg } = await db
      .from("assignments")
      .select("instructions, title, course_name, class_id")
      .eq("id", submission.assignment_id)
      .maybeSingle();
    // Best-effort: the v1/app columns the grader must honor. A 400 on the v2 schema yields null (the
    // supabase client surfaces REST errors in the result, never throws), so this can't break grading.
    const { data: asgV1 } = await db
      .from("assignments")
      .select("description, rubric_text")
      .eq("id", submission.assignment_id)
      .maybeSingle();
    const asgFreeText = asgV1 as { description?: string | null; rubric_text?: string | null } | null;

    // Class context for calibration — best-effort (may be absent on older schemas).
    let classContext: string | undefined;
    if (asg?.class_id) {
      const { data: cls } = await db
        .from("classes")
        .select("name, details")
        .eq("id", asg.class_id)
        .maybeSingle();
      if (cls) {
        const details = typeof cls.details === "object" && cls.details ? JSON.stringify(cls.details) : "";
        classContext = [cls.name, asg.course_name, details].filter(Boolean).join(" · ").slice(0, 600);
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

    // Phase 15 Wave 2 (PROOF-02): top-K binary-signal few-shot exemplars from the teacher's own
    // accept/edit/dismiss edits, injected alongside the prose summary. Ordered newest-first so the
    // selection (and thus the cacheable prefix) is stable between batch rebuilds. Best-effort: the
    // table is absent until migration 0018 is applied on the cloud schema, so a load failure simply
    // falls back to the prose profile / cold start (no rubric-criterion filter — annotations don't
    // carry a criterion link, so recency is the selector; documented as Claude's discretion in 15-PLAN).
    const STYLE_EXEMPLAR_K = 6;
    let styleExemplars:
      | { kind: "positive" | "correction" | "negative"; annotationType?: string; aiText?: string; finalText?: string }[]
      | undefined;
    {
      const { data: exs } = await db
        .from("teacher_feedback_exemplars")
        .select("kind, annotation_type, ai_text, final_text")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(STYLE_EXEMPLAR_K);
      if (exs && exs.length) {
        styleExemplars = exs.map((e) => ({
          kind: e.kind as "positive" | "correction" | "negative",
          annotationType: (e.annotation_type as string) ?? undefined,
          aiText: (e.ai_text as string) ?? undefined,
          finalText: (e.final_text as string) ?? undefined,
        }));
      }
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

    // Resolve the real grading context + decide trust (Sleuth F-001/F-002). The app UI writes the
    // teacher's prompt/rubric to description/rubric_text; coalesce them and refuse to grade against
    // nothing. hasCanonicalRubric reflects whether a structured rubric was actually loaded above.
    const ctx = resolveAssignmentContext({
      title: asg?.title,
      instructions: asg?.instructions,
      description: asgFreeText?.description,
      rubricText: asgFreeText?.rubric_text,
      hasCanonicalRubric: rubric !== null,
    });
    if (!ctx.sufficient) {
      // Fail closed BEFORE any paid synthesis/grading call — never award marks from missing context.
      await db.from("submissions").update({ status: "grade_error" }).eq("id", submissionId);
      throw new AppError(422, "missing_context", ctx.reason ?? MISSING_CONTEXT_REASON);
    }
    const assignmentPrompt = ctx.assignmentPrompt;

    if (!rubric) {
      await db.from("submissions").update({ status: "grading" }).eq("id", submissionId);
      try {
        // The teacher's own rubric_text (when present) is authoritative for synthesis (Sleuth F-001).
        const synth = await synthesizeRubric(assignmentPrompt, classContext, ctx.rubricText);
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
          // Prefer the teacher's own rubric text as the holistic guide; fall back to the prompt.
          freeText: ctx.rubricText || assignmentPrompt || "Grade the submission holistically for quality and relevance to the assignment.",
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
        styleExemplars,
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

    // Auto-finalize (XPRIZE #1 must-go-right): publish high-confidence, on-topic, flag-free grades
    // UNATTENDED — "On-the-Loop" — routing only exceptions (off-topic / low-confidence / integrity
    // flags) to the teacher's needs_review queue. The decision is a pure, unit-tested function so the
    // edge behavior matches the tests in src/lib/autoFinalize.test.ts.
    //
    // Load the teacher's preference best-effort: the auto_finalize_* columns are absent until
    // migration 0020 (migrations_v2) is applied, in which case we fall back to the product defaults
    // (enabled, threshold 0.85). A read failure must never block grading.
    let afEnabled = AUTO_FINALIZE_DEFAULT_ENABLED;
    let afThreshold = AUTO_FINALIZE_DEFAULT_THRESHOLD;
    {
      const { data: af } = await db
        .from("privacy_settings")
        .select("auto_finalize_enabled, auto_finalize_threshold")
        .eq("user_id", userId)
        .maybeSingle();
      if (af) {
        if (typeof af.auto_finalize_enabled === "boolean") afEnabled = af.auto_finalize_enabled;
        if (typeof af.auto_finalize_threshold === "number") afThreshold = af.auto_finalize_threshold;
      }
    }

    const decision = decideFinalization({
      disposition,
      confidence: result.overall.confidence,
      flags: result.flags,
      enabled: afEnabled,
      threshold: afThreshold,
    });

    // Disposition: off-topic / low-confidence grades are surfaced for review, not presented as
    // settled. A clear, high-confidence grade is auto-finalized when the teacher allows it.
    const finalStatus = decision.autoFinalize
      ? "finalized"
      : (disposition === "needs_review" ? "needs_review" : "graded");

    // Update status, attaching provenance when we auto-publish. finalized_by/auto_finalized_at are
    // absent pre-migration — retry without them on an unknown-column error (the status still lands).
    const statusUpdate: Record<string, unknown> = { status: finalStatus };
    if (decision.autoFinalize) {
      statusUpdate.finalized_by = "ai";
      statusUpdate.auto_finalized_at = new Date().toISOString();
    }
    let statusRes = await db.from("submissions").update(statusUpdate).eq("id", submissionId);
    if (statusRes.error && /finalized_by|auto_finalized_at|column|schema cache/i.test(statusRes.error.message)) {
      statusRes = await db.from("submissions").update({ status: finalStatus }).eq("id", submissionId);
    }
    if (statusRes.error) {
      console.error(`[grade-submission] status update failed: ${statusRes.error.message}`);
    }

    // Finalize agent step (AGENT-05): record the unattended-publish decision so the pipeline view and
    // the AI-native evidence trail show the agent finalizing (or deferring to) each grade.
    trace.push({
      agent: "finalize",
      status: "ok",
      latencyMs: 0,
      detail: {
        autoFinalized: decision.autoFinalize,
        reason: decision.reason,
        confidence: result.overall.confidence,
        threshold: decision.appliedThreshold,
        ...(decision.blockingFlag ? { blockingFlag: decision.blockingFlag } : {}),
        finalStatus,
      },
    });

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
    if (decision.autoFinalize) {
      // Distinct audit row so the AI-native evidence trail can count agent-published grades.
      await admin.from("access_audit_log").insert({
        actor_id: userId,
        action: "grade_auto_finalized",
        resource: `submission:${submissionId}`,
      });
    }

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

    return ok(req, {
      gradeId: grade?.id ?? null,
      result,
      jobId,
      trace,
      status: finalStatus,
      autoFinalized: decision.autoFinalize,
      finalizeReason: decision.reason,
    });
  });
});
