// POST /privacy-tasks   (cron/secret-gated — NOT user-callable)
// Header: x-cron-secret: <CRON_SECRET>
// Runs retention + anonymization across all teachers. Anonymizes student PII INCLUDING names
// embedded in essay/feedback/annotation text (the v1 gap), and deletes data past retention.
import { handlePreflight } from "../_shared/cors.ts";
import { withErrors, ok, AppError } from "../_shared/http.ts";
import { requireCronSecret } from "../_shared/auth.ts";
import { adminClient } from "../_shared/db.ts";

// Replace each known student name with an opaque token everywhere it appears in free text.
function scrub(text: string | null, names: string[]): string | null {
  if (!text) return text;
  let out = text;
  names.forEach((name, i) => {
    if (!name || name.trim().length < 2) return;
    const re = new RegExp(name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
    out = out.replace(re, `Student_${i + 1}`);
  });
  return out;
}

Deno.serve((req) => {
  const pre = handlePreflight(req);
  if (pre) return pre;

  return withErrors(req, async () => {
    if (req.method !== "POST") throw new AppError(405, "method", "POST only");
    requireCronSecret(req); // service-role/cron only

    const admin = adminClient();
    const report = { anonymized: 0, deletedSubmissions: 0 };

    // 1) Anonymize for teachers who opted in. Scrub names from name field AND body text.
    const { data: optedIn } = await admin
      .from("privacy_settings")
      .select("user_id")
      .eq("anonymize_student_names", true);

    for (const row of optedIn ?? []) {
      const { data: subs } = await admin
        .from("submissions")
        .select("id, student_name")
        .eq("user_id", row.user_id)
        .not("student_name", "is", null);
      const names = (subs ?? []).map((s) => s.student_name as string).filter(Boolean);
      if (names.length === 0) continue;

      for (const s of subs ?? []) {
        // submission body
        const { data: full } = await admin
          .from("submissions")
          .select("extracted_text")
          .eq("id", s.id)
          .single();
        await admin
          .from("submissions")
          .update({
            student_name: "Student",
            extracted_text: scrub(full?.extracted_text ?? null, names),
          })
          .eq("id", s.id);

        // grade summary + annotations
        const { data: grades } = await admin
          .from("submission_grades")
          .select("id, summary_feedback")
          .eq("submission_id", s.id);
        for (const g of grades ?? []) {
          await admin
            .from("submission_grades")
            .update({ summary_feedback: scrub(g.summary_feedback, names) })
            .eq("id", g.id);
        }
        const { data: anns } = await admin
          .from("annotations")
          .select("id, comment, quote")
          .eq("submission_id", s.id);
        for (const a of anns ?? []) {
          await admin
            .from("annotations")
            .update({ comment: scrub(a.comment, names), quote: scrub(a.quote, names) })
            .eq("id", a.id);
        }
        report.anonymized++;
      }
    }

    // 2) Retention: delete submissions older than each teacher's retention window.
    const { data: settings } = await admin.from("privacy_settings").select("user_id, retention_days");
    for (const s of settings ?? []) {
      const cutoff = new Date(Date.now() - (s.retention_days ?? 365) * 86400_000).toISOString();
      const { data: del } = await admin
        .from("submissions")
        .delete()
        .eq("user_id", s.user_id)
        .lt("created_at", cutoff)
        .select("id");
      report.deletedSubmissions += del?.length ?? 0;
    }

    await admin.from("access_audit_log").insert({
      action: "privacy_tasks_run",
      resource: `anonymized:${report.anonymized};deleted:${report.deletedSubmissions}`,
    });

    return ok(req, report);
  });
});
