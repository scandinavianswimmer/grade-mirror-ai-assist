// POST /build-style-profile
// Auth: JWT. Distills the teacher's training examples into a style summary, stored on
// teacher_style_profiles. Consent-gated: only runs if the teacher allows training on content.
// (Sprint 2 wires this summary into the grading prompt.)
import { handlePreflight } from "../_shared/cors.ts";
import { withErrors, ok, AppError } from "../_shared/http.ts";
import { getUserFromJWT } from "../_shared/auth.ts";
import { userClient } from "../_shared/db.ts";
import { geminiGenerateText } from "../_shared/ai/gemini.ts";
import { GRADING_MODELS } from "../_shared/ai/router.ts";

const SYSTEM = `You analyze a teacher's past graded work and produce a concise "grading style profile":
their tone, strictness, what they praise vs. penalize, recurring feedback structures, and preferred
wording. Output 8-15 bullet points an AI grader can follow to imitate this teacher's voice. No preamble.`;

Deno.serve((req) => {
  const pre = handlePreflight(req);
  if (pre) return pre;

  return withErrors(req, async () => {
    if (req.method !== "POST") throw new AppError(405, "method", "POST only");
    const { userId } = await getUserFromJWT(req);
    const db = userClient(req);

    // Consent gate: do not train on student content unless explicitly allowed.
    const { data: privacy } = await db
      .from("privacy_settings")
      .select("allow_training_on_content")
      .eq("user_id", userId)
      .maybeSingle();
    if (!privacy?.allow_training_on_content) {
      throw new AppError(403, "consent", "Training on content is not enabled in privacy settings");
    }

    const { data: examples } = await db
      .from("training_examples")
      .select("essay, feedback, grade")
      .eq("user_id", userId)
      .limit(20);
    if (!examples || examples.length === 0) {
      throw new AppError(400, "no_examples", "No training examples to build a style profile from");
    }

    // De-identify: send only feedback + grade + a short essay excerpt (no names).
    const corpus = examples
      .map(
        (e, i) =>
          `Example ${i + 1}\nGrade: ${e.grade ?? "n/a"}\nFeedback: ${e.feedback ?? ""}\nExcerpt: ${(e.essay ?? "").slice(0, 400)}`,
      )
      .join("\n\n");

    const { text } = await geminiGenerateText(GRADING_MODELS[0].id, SYSTEM, corpus, 1500);
    if (!text.trim()) throw new AppError(502, "style", "Failed to generate style profile");

    await db
      .from("teacher_style_profiles")
      .upsert({ user_id: userId, style_summary: text, updated_at: new Date().toISOString() });

    return ok(req, { styleSummary: text, exampleCount: examples.length });
  });
});
