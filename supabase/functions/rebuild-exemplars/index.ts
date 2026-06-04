// POST /rebuild-exemplars
// Auth: JWT. Rebuilds the teacher's binary-signal few-shot exemplar store from their reviewed
// annotations on FINALIZED submissions: accept => positive, edit => correction (ai->final), dismiss
// => negative. Consent-gated, owner-scoped, and de-identified before storage (a name in one student's
// feedback must never leak into another student's grading prompt). Idempotent: replaces the teacher's
// exemplar set each run. Phase 15 Wave 2 (PROOF-02). The prose style summary (build-style-profile)
// remains the cold-start fallback (LEARN-06); this store is the primary voice signal once a teacher
// has edited a batch. Triggered after each finalized batch from the HITL finalize flow.
import { handlePreflight } from "../_shared/cors.ts";
import { withErrors, ok, AppError } from "../_shared/http.ts";
import { getUserFromJWT } from "../_shared/auth.ts";
import { userClient } from "../_shared/db.ts";
import { scrubNames } from "../_shared/deid.ts";

// Cap reviewed annotations fed into the store so rebuild stays cheap and the prompt prefix bounded.
const MAX_EXEMPLARS = 200;

type Kind = "positive" | "correction" | "negative";

function kindFor(status: string): Kind {
  if (status === "accepted") return "positive";
  if (status === "edited") return "correction";
  return "negative"; // rejected
}

Deno.serve((req) => {
  const pre = handlePreflight(req);
  if (pre) return pre;

  return withErrors(req, async () => {
    if (req.method !== "POST") throw new AppError(405, "method", "POST only");
    const { userId } = await getUserFromJWT(req);
    const db = userClient(req);

    // Consent gate: never derive a learning store from student content without explicit opt-in.
    const { data: privacy } = await db
      .from("privacy_settings")
      .select("allow_training_on_content")
      .eq("user_id", userId)
      .maybeSingle();
    if (!privacy?.allow_training_on_content) {
      throw new AppError(403, "consent", "Training on content is not enabled in privacy settings");
    }

    // Finalized submissions for this teacher (RLS-scoped) → batch ordering + student name for de-id.
    // Selected via RLS rather than an explicit user_id filter so it also works on the v1-derived cloud
    // schema (submissions.user_id may be absent there; ownership is still enforced by RLS).
    const { data: subs } = await db
      .from("submissions")
      .select("id, batch_id, student_name, status")
      .eq("status", "finalized");
    const subMap = new Map((subs ?? []).map((s) => [s.id as string, s]));

    // Reviewed annotations (accept/edit/dismiss), newest first. RLS + user_id both scope to the owner.
    const { data: anns } = await db
      .from("annotations")
      .select("id, status, ai_comment, comment, quote, type, edit_distance, submission_id, created_at")
      .eq("user_id", userId)
      .in("status", ["accepted", "edited", "rejected"])
      .order("created_at", { ascending: false })
      .limit(MAX_EXEMPLARS);

    const exemplars = (anns ?? [])
      .filter((a) => subMap.has(a.submission_id as string)) // only notes on finalized submissions
      .map((a) => {
        const sub = subMap.get(a.submission_id as string)!;
        const names = sub.student_name ? [String(sub.student_name)] : [];
        const kind = kindFor(a.status as string);
        return {
          user_id: userId,
          kind,
          annotation_type: (a.type as string) ?? null,
          // De-identify before storage: this text is re-injected into future grading prompts.
          ai_text: kind === "positive" ? null : scrubNames((a.ai_comment as string) ?? null, names),
          final_text: kind === "negative" ? null : scrubNames((a.comment as string) ?? null, names),
          quote: scrubNames((a.quote as string) ?? null, names),
          edit_distance: kind === "correction" ? ((a.edit_distance as number) ?? null) : null,
          source_submission_id: (a.submission_id as string) ?? null,
          batch_id: (sub.batch_id as string) ?? null,
        };
      });

    // Idempotent rebuild: replace this teacher's exemplar set (owner-scoped delete, then insert).
    const { error: delErr } = await db
      .from("teacher_feedback_exemplars")
      .delete()
      .eq("user_id", userId);
    if (delErr) throw new AppError(500, "rebuild", `Failed to clear exemplars: ${delErr.message}`);
    if (exemplars.length) {
      const { error: insErr } = await db.from("teacher_feedback_exemplars").insert(exemplars);
      if (insErr) throw new AppError(500, "rebuild", `Failed to write exemplars: ${insErr.message}`);
    }

    return ok(req, {
      exemplarCount: exemplars.length,
      positive: exemplars.filter((e) => e.kind === "positive").length,
      correction: exemplars.filter((e) => e.kind === "correction").length,
      negative: exemplars.filter((e) => e.kind === "negative").length,
    });
  });
});
