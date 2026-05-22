// POST /generate-style-summary
// Auth: JWT. Identity from the token (C2). Exemplars are fetched server-side, scoped to the
// teacher (C3/C23) — the client never supplies examples. Model name is env-configured (M54).
import { handlePreflight } from "../_shared/cors.ts";
import { withErrors, ok, AppError } from "../_shared/http.ts";
import { getUserFromJWT } from "../_shared/auth.ts";
import { userClient } from "../_shared/db.ts";

const MODEL = Deno.env.get("GEMINI_STYLE_MODEL") || "gemini-2.5-flash";

Deno.serve((req) => {
  const pre = handlePreflight(req);
  if (pre) return pre;

  return withErrors(req, async () => {
    if (req.method !== "POST") throw new AppError(405, "method", "POST only");

    const { userId } = await getUserFromJWT(req);
    const geminiApiKey = Deno.env.get("GEMINI_API_KEY");
    if (!geminiApiKey) throw new AppError(503, "config", "AI provider is not configured");

    const db = userClient(req);

    // Fetch the teacher's own exemplars server-side (RLS-scoped). Never trust client input.
    const { data: examples } = await db
      .from("training_examples")
      .select("essay, rubric, feedback, grade")
      .eq("user_id", userId)
      .eq("is_exemplar", true) // only genuine style exemplars (H21)
      .order("created_at", { ascending: false })
      .limit(20);

    if (!examples?.length) {
      throw new AppError(400, "input", "No grading exemplars found to build a style profile");
    }

    const examplesText = examples
      .map((e, i) =>
        `Example ${i + 1}:\n` +
        `Essay excerpt: ${String(e.essay ?? "").slice(0, 300)}\n` +
        `Rubric: ${String(e.rubric ?? "")}\n` +
        `Teacher feedback: ${String(e.feedback ?? "")}\n` +
        `Teacher grade: ${String(e.grade ?? "")}`,
      )
      .join("\n\n");

    const prompt =
      "Analyze and summarize this teacher's grading style from their own past grading examples. " +
      "Focus on: feedback approach and tone, grading criteria emphasis, communication style, " +
      "assessment patterns, and areas of focus. Provide a specific, actionable summary that can " +
      "guide an AI to grade in a similar manner.\n\nGrading Examples:\n" + examplesText;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${geminiApiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.7, topK: 40, topP: 0.95, maxOutputTokens: 1024 },
        }),
      },
    );

    if (!response.ok) throw new AppError(502, "ai_upstream", `AI provider error ${response.status}`);

    const data = await response.json();
    const summary = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!summary) throw new AppError(502, "ai_empty", "AI returned no content");

    await db.from("ai_profiles").upsert({
      user_id: userId,
      grading_style_summary: summary,
      last_trained: new Date().toISOString(),
      ai_model_id: `teacher_${userId}`,
    });

    return ok(req, { summary });
  });
});
