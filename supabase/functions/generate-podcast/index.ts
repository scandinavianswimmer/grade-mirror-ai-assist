// POST /generate-podcast { title, inputNotes? }
// Auth: JWT (required). Identity is derived from the verified token — NEVER from the body —
// and the row is written through the user's RLS-scoped client, so a caller can only ever create
// a podcast episode owned by themselves. Input is bounded to cap prompt-injection / cost abuse.
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.12.0";
import { handlePreflight } from "../_shared/cors.ts";
import { withErrors, ok, AppError } from "../_shared/http.ts";
import { getUserFromJWT } from "../_shared/auth.ts";
import { userClient } from "../_shared/db.ts";
import { ENV } from "../_shared/env.ts";

const PODCAST_MODEL = "gemini-2.5-flash";
const MAX_TITLE_CHARS = 300;
const MAX_NOTES_CHARS = 10_000;

interface PodcastGenerationResponse {
  script: string;
  summary: string;
  tags: string[];
  voiceStyle: string;
}

Deno.serve((req) => {
  const pre = handlePreflight(req);
  if (pre) return pre;

  return withErrors(req, async () => {
    if (req.method !== "POST") throw new AppError(405, "method", "POST only");

    // Identity from the verified JWT, never the request body (was an IDOR: body-supplied userId).
    const { userId } = await getUserFromJWT(req);

    const body = await req.json().catch(() => ({}));
    // Strip characters that could break out of the prompt's quoted/delimited context (mild
    // prompt-injection hardening; the fields are interpolated into the model prompt below).
    const sanitize = (s: string) => s.replace(/["`\\]/g, " ").trim();
    const title = sanitize(typeof body.title === "string" ? body.title : "");
    const inputNotes = sanitize(typeof body.inputNotes === "string" ? body.inputNotes : "");
    if (!title) throw new AppError(400, "input", "title is required");
    if (title.length > MAX_TITLE_CHARS) throw new AppError(400, "input", `title too long (max ${MAX_TITLE_CHARS})`);
    if (inputNotes.length > MAX_NOTES_CHARS) throw new AppError(400, "input", `inputNotes too long (max ${MAX_NOTES_CHARS})`);

    const genAI = new GoogleGenerativeAI(ENV.geminiKey());
    const model = genAI.getGenerativeModel({ model: PODCAST_MODEL });

    const prompt = `
You are an expert podcast scriptwriter specializing in AEC (Architecture, Engineering, Construction) industry content.

Create a comprehensive podcast script for the following:
Title: "${title}"
${inputNotes ? `Additional Notes: ${inputNotes}` : ""}

The podcast should be engaging, professional, and technically accurate. Structure it as follows:

1. **Opening Hook** (30-45 seconds): Start with a compelling statistic or story
2. **Introduction** (1-2 minutes): Introduce the topic and what listeners will learn
3. **Main Content** (8-12 minutes): Deep dive into the topic with real examples
4. **Tool Spotlight** (2-3 minutes): Highlight relevant AI tools
5. **Key Takeaways** (1-2 minutes): Summarize main points
6. **Call to Action** (30 seconds): Encourage engagement

Please respond in JSON format with the following structure:
{
  "script": "full detailed script with timing cues and natural speech patterns",
  "summary": "compelling 2-3 sentence episode description",
  "tags": ["relevant", "hashtags"],
  "voiceStyle": "detailed voice direction (tone, pace, emphasis style)"
}

Make it sound natural and engaging, not robotic.`;

    const result = await model.generateContent(prompt);
    const text = (await result.response).text();

    let generated: PodcastGenerationResponse;
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("no JSON in response");
      generated = JSON.parse(jsonMatch[0]);
    } catch {
      generated = {
        script: text,
        summary: `Episode exploring ${title} - essential insights for AEC professionals.`,
        tags: ["#AEC", "#Construction", "#Technology", "#AI"],
        voiceStyle: "Professional yet conversational, confident delivery with technical expertise",
      };
    }

    // RLS-scoped insert: user_id comes from the JWT, so the row can only belong to the caller.
    const db = userClient(req);
    const { data: podcast, error: dbError } = await db
      .from("podcast_episodes")
      .insert({
        user_id: userId,
        title,
        input_notes: inputNotes || null,
        script: generated.script,
        summary: generated.summary,
        tags: generated.tags,
        voice_style: generated.voiceStyle,
        status: "generated",
      })
      .select()
      .single();

    if (dbError) throw new AppError(500, "db", `Failed to save podcast: ${dbError.message}`);

    return ok(req, { success: true, podcast });
  });
});
