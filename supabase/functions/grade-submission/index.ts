// POST /grade-submission  { submissionId }
// Auth: JWT (identity derived from token; submission ownership enforced by RLS).
// Loads the submission + its assignment rubric, runs the grading engine, persists the verified
// grade + annotations, logs the LLM session. Returns the GradingResult or an explicit error.
import { handlePreflight } from "../_shared/cors.ts";
import { withErrors, ok, AppError } from "../_shared/http.ts";
import { getUserFromJWT } from "../_shared/auth.ts";
import { userClient, adminClient } from "../_shared/db.ts";
import { gradeSubmission } from "../_shared/grading/engine.ts";
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

    // Load structured rubric (criteria) or fall back to assignment instructions as free text.
    const { data: rubricRow } = await db
      .from("rubrics")
      .select("id, total_points")
      .eq("assignment_id", submission.assignment_id)
      .maybeSingle();

    let rubric: RubricInput;
    if (rubricRow) {
      const { data: crit } = await db
        .from("rubric_criteria")
        .select("name, weight, max_score, level_descriptors")
        .eq("rubric_id", rubricRow.id)
        .order("sort_order");
      rubric = {
        totalPoints: Number(rubricRow.total_points) || 100,
        criteria: (crit ?? []).map((c) => ({
          name: c.name,
          weight: Number(c.weight),
          maxScore: Number(c.max_score),
          levelDescriptors: (c.level_descriptors ?? {}) as Record<string, string>,
        })),
      };
    } else {
      const { data: asg } = await db
        .from("assignments")
        .select("instructions")
        .eq("id", submission.assignment_id)
        .maybeSingle();
      rubric = { totalPoints: 100, criteria: [], freeText: asg?.instructions ?? "Grade holistically." };
    }

    await db.from("submissions").update({ status: "grading" }).eq("id", submissionId);

    let outcome;
    try {
      outcome = await gradeSubmission({ essay: submission.extracted_text, rubric });
    } catch (err) {
      await db.from("submissions").update({ status: "grade_error" }).eq("id", submissionId);
      throw err; // explicit error to the client — never a fabricated grade
    }
    const { result, usage } = outcome;

    // Persist grade + annotations under the owner's RLS context.
    const { data: grade } = await db
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

    if (result.annotations.length) {
      await db.from("annotations").insert(
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
    }

    await db.from("submissions").update({ status: "graded" }).eq("id", submissionId);

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
