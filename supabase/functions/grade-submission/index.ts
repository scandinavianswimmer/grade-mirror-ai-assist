// POST /grade-submission  { submissionId }
// Auth: JWT (identity derived from token; submission ownership enforced by RLS).
// Loads the submission + its assignment rubric, runs the grading engine, persists the verified
// grade + annotations, logs the LLM session. Returns the GradingResult or an explicit error.
import { handlePreflight } from "../_shared/cors.ts";
import { withErrors, ok, AppError } from "../_shared/http.ts";
import { getUserFromJWT } from "../_shared/auth.ts";
import { userClient, adminClient } from "../_shared/db.ts";
import { gradeSubmission } from "../_shared/grading/engine.ts";
import { synthesizeRubric, toRubricInput } from "../_shared/grading/rubric-synth.ts";
import type { RubricInput } from "../_shared/grading-schema.ts";

Deno.serve((req) => {
  const pre = handlePreflight(req);
  if (pre) return pre;

  return withErrors(req, async () => {
    if (req.method !== "POST") throw new AppError(405, "method", "POST only");
    const { userId } = await getUserFromJWT(req);
    const { submissionId } = await req.json().catch(() => ({}));
    if (!submissionId) throw new AppError(400, "input", "submissionId is required");

    const db = userClient(req); // RLS: only the owner can read this submission

    const { data: submission, error: subErr } = await db
      .from("submissions")
      .select("id, assignment_id, extracted_text, extraction_confidence, status")
      .eq("id", submissionId)
      .single();
    if (subErr || !submission) throw new AppError(404, "submission", "Submission not found");

    if (!submission.extracted_text || (submission.extraction_confidence ?? 0) < 0.2) {
      await db.from("submissions").update({ status: "needs_review" }).eq("id", submissionId);
      throw new AppError(422, "needs_review", "Submission text missing/low-confidence; needs manual review");
    }

    // Assignment + class context: the relevance gate needs the task; calibration needs the level.
    const { data: asg } = await db
      .from("assignments")
      .select("title, instructions, course_name, class_id")
      .eq("id", submission.assignment_id)
      .maybeSingle();
    const assignmentPrompt = [asg?.title, asg?.instructions].filter(Boolean).join("\n\n").trim();

    let classContext: string | undefined;
    if (asg?.class_id) {
      const { data: cls } = await db
        .from("classes")
        .select("name, details")
        .eq("id", asg.class_id)
        .maybeSingle();
      if (cls) {
        const details = typeof cls.details === "object" && cls.details ? JSON.stringify(cls.details) : "";
        classContext = [cls.name, asg?.course_name, details].filter(Boolean).join(" · ").slice(0, 600);
      }
    }

    // Load the structured rubric. If none exists, synthesize a strict one from the assignment +
    // class level and persist it (GRADE-02) — never grade against model-invented generic criteria.
    const { data: rubricRow } = await db
      .from("rubrics")
      .select("id, total_points")
      .eq("assignment_id", submission.assignment_id)
      .maybeSingle();

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
      const synth = await synthesizeRubric(assignmentPrompt, classContext);
      rubric = toRubricInput(synth);
      // Persist so the teacher can review/edit and grading is reproducible.
      const { data: newRubric, error: rubErr } = await db
        .from("rubrics")
        .insert({ user_id: userId, assignment_id: submission.assignment_id, total_points: synth.totalPoints })
        .select("id")
        .single();
      if (rubErr) throw new AppError(500, "rubric_persist", `Failed to save synthesized rubric: ${rubErr.message}`);
      if (newRubric) {
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
        if (critErr) throw new AppError(500, "rubric_persist", `Failed to save rubric criteria: ${critErr.message}`);
      }
    }

    if (!rubric) throw new AppError(500, "rubric_missing", "No rubric available to grade against");

    await db.from("submissions").update({ status: "grading" }).eq("id", submissionId);

    let outcome;
    try {
      outcome = await gradeSubmission({
        essay: submission.extracted_text,
        rubric,
        assignmentPrompt,
        classContext,
      });
    } catch (err) {
      await db.from("submissions").update({ status: "grade_error" }).eq("id", submissionId);
      throw err; // explicit error to the client — never a fabricated grade
    }
    const { result, usage, disposition } = outcome;

    // Persist grade under the owner's RLS context. The grade is the critical write — fail loud (OPS-02).
    const { data: grade, error: gradeErr } = await db
      .from("submission_grades")
      .insert({
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
      })
      .select("id")
      .single();
    if (gradeErr || !grade) {
      await db.from("submissions").update({ status: "grade_error" }).eq("id", submissionId);
      throw new AppError(500, "grade_persist", `Failed to save grade: ${gradeErr?.message ?? "unknown"}`);
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

    return ok(req, { gradeId: grade?.id ?? null, result });
  });
});
