// POST /ingest-document  { submissionId }
// Auth: JWT. Downloads the submission's uploaded file from Storage, extracts text server-side,
// writes extracted_text + confidence, and sets status (graded-ready vs needs_review).
import { handlePreflight } from "../_shared/cors.ts";
import { withErrors, ok, AppError } from "../_shared/http.ts";
import { getUserFromJWT } from "../_shared/auth.ts";
import { userClient } from "../_shared/db.ts";
import { extractDocument } from "../_shared/extract/index.ts";

const BUCKET = "submissions";

Deno.serve((req) => {
  const pre = handlePreflight(req);
  if (pre) return pre;

  return withErrors(req, async () => {
    if (req.method !== "POST") throw new AppError(405, "method", "POST only");
    await getUserFromJWT(req); // ensure authenticated; RLS enforces ownership below
    const { submissionId } = await req.json().catch(() => ({}));
    if (!submissionId) throw new AppError(400, "input", "submissionId is required");

    const db = userClient(req);
    const { data: submission, error } = await db
      .from("submissions")
      .select("id, file_path")
      .eq("id", submissionId)
      .single();
    if (error || !submission) throw new AppError(404, "submission", "Submission not found");
    if (!submission.file_path) throw new AppError(400, "input", "Submission has no uploaded file");

    const { data: file, error: dlErr } = await db.storage.from(BUCKET).download(submission.file_path);
    if (dlErr || !file) throw new AppError(404, "storage", "Could not download submission file");

    const bytes = new Uint8Array(await file.arrayBuffer());
    const filename = submission.file_path.split("/").pop() ?? "upload";
    const extracted = await extractDocument(filename, bytes);

    const status = extracted.confidence >= 0.2 && extracted.text.length > 0 ? "uploaded" : "needs_review";
    await db
      .from("submissions")
      .update({
        extracted_text: extracted.text,
        extraction_confidence: extracted.confidence,
        status,
      })
      .eq("id", submissionId);

    return ok(req, {
      status,
      confidence: extracted.confidence,
      pages: extracted.pages,
      length: extracted.text.length,
      warnings: extracted.warnings,
    });
  });
});
