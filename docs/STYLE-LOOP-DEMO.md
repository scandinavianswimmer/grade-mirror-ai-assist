# Style-Loop Demo — "aiTA learns your voice"

Proves the marquee goal claim: **the output looks like the teacher actually graded it.** This is the
#1 gap flagged in `.planning/GOAL-ALIGNMENT-REVIEW.md` — close it and the system matches the goal.

## How it works (verified in code)
- `grade-submission` reads `teacher_style_profiles.style_summary` for the grading teacher
  (`index.ts:94-98`) and passes it to the engine as `styleProfile` (`index.ts:191`).
- `engine.ts buildCachedSystem` injects it as a **"TEACHER GRADING STYLE — write feedback in this
  teacher's voice"** block (`engine.ts:130-135`).
- The **Style agent step** in the visible pipeline flips **`skipped` → `ok (applied)`** when a profile
  is present (`engine.ts:375-378`) — a clean on-camera signal that the teacher's voice is being applied.

So: **no DB write to the grader is needed** — seed `teacher_style_profiles.style_summary` and the
already-deployed grader injects it on the next grade.

## Seeded persona (see `scripts/seed-demo-style-profile.sql`)
A warm, Socratic 8th-grade English teacher who: opens with a specific affirmation, **coaches with
questions**, demands **"Evidence?"** for unsupported claims, calls plot summary "retelling, not
analysis," is **hard on thesis/structure but lenient on grammar**, and **always closes with
"Next step:"**. Deliberately distinctive so the with/without difference is obvious on camera.

## Steps to record the demo
1. **Deploy the two committed grading fixes first** (so criteria are assignment-specific + notes don't
   duplicate on a re-grade): `supabase functions deploy grade-submission --no-verify-jwt`.
   Recommended: also enable `gemini-2.5-pro` billing so the happy path runs on pro.
2. **Capture the BEFORE (no profile).** Either screenshot an existing grade (the generic
   "exceptionally clear, well-organized…" summary on the Stanley essay is a perfect baseline), or grade
   a fresh essay while no profile exists. Note the agent pipeline shows **Style: skipped**.
3. **Run the seed:** `psql … -f scripts/seed-demo-style-profile.sql` (see that file's header for the
   exact session-pooler command — needs your DB password).
4. **Capture the AFTER (with profile).** Re-grade the same essay. Expect the feedback to adopt the
   teacher's voice — questions instead of commands, **"Evidence?"**, quoting the student's words back,
   and a closing **"Next step:"** — and the pipeline now shows **Style: ok (applied)**.
5. **Show the A/B side by side.** Same essay, same rubric — only the voice changed. That is "it grades
   like me."
6. **(Optional, strongest) Close the loop on camera:** edit one annotation → "AI originally suggested…"
   is recorded; over a batch the **Metrics → edit-rate-over-time** trends down = "it's learning me."

## Cleanest controlled A/B (same essay, post-deploy)
With the dedup fix deployed, re-grades are clean, so you can toggle:
- Grade essay → screenshot (profile present = WITH).
- Run the UNDO block's `DELETE FROM teacher_style_profiles …` → re-grade → screenshot (WITHOUT).
- Re-run the seed to restore. (Pre-deploy, avoid repeated re-grades — they duplicated annotations.)

## Notes / caveats
- `build-style-profile` (the fn that would generate the summary from samples) currently targets
  `GRADING_MODELS[0]` = `gemini-2.5-pro` (quota=0 → 429) and may not be deployed. The seed writes the
  summary directly so the demo doesn't depend on it. To make it fully real later: give that fn a
  flash fallback / `GEMINI_STYLE_MODEL`, deploy it, and let it regenerate from the 10 seeded samples.
- The seed also writes 10 `training_examples` and flips `allow_training_on_content = TRUE` so the
  onboarding "≥10 samples" state and consent are realistic.
- UNDO block at the bottom of the seed file removes everything.
