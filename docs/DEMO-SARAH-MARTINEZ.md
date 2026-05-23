# Demo Account — Sarah Martinez (primary ICP)

Stand up a believable, teacher-controlled aiTA account for recording, navigating, and showing to
beta prospects + X Prize. Built to pass the spec's final test: *"Would a burned-out but high-integrity
English teacher believe this account represents a real teacher genuinely using aiTA weekly?"*

## Design (read this first)
Two honest constraints shape the build:
1. **Annotations can't be faked.** They anchor to real essay text (`start_index/end_index`) and the
   grader verifies every evidence quote — fabricated annotations won't render. So we seed **real
   essays** and let the **grader produce authentic annotations** in Sarah's voice.
2. **Bulk live writes are permission-gated**, so structural seeding is a **SQL script you run via
   `psql`** (as `postgres`), which also keeps the training-consent flip your explicit action.

Result = **broad + shallow, narrow + deep**: a full roster (6 classes, 10 assignments, a real upload
queue of student essays in varied ability levels + edge cases) that looks like a real grading week,
plus a few **hero essays graded for real on camera** with annotations in Sarah's voice and HITL edits.
This is more credible than thousands of fake annotations.

## Step 1 — Create the account
**Recommended (clean slate):** in the app, sign up `sarah.martinez.demo@aitaedu.ai`. Then get her id:
```sql
SELECT id FROM auth.users WHERE email='sarah.martinez.demo@aitaedu.ai';
```
Put that uuid into `scripts/seed-demo-sarah-martinez.sql` at `\set teacher '...'`.
*(Fast alternative: leave the default = the existing test teacher id — but its existing test data
[Luke class, oil-change/injection artifacts] will also show. A fresh account is cleaner for recording.)*

## Step 2 — Run the seed
```bash
PW='<db_password>'
PGPASSWORD="$PW" psql "host=aws-1-us-west-2.pooler.supabase.com port=5432 \
  user=postgres.yhdobsmmhdvqswjpousc dbname=postgres sslmode=require" \
  -v ON_ERROR_STOP=1 -f scripts/seed-demo-sarah-martinez.sql
```
The final `SELECT` prints a row confirming teacher / consent / style_len / training / classes(6) /
assignments(10) / seeded_submissions(14). Idempotent; re-runnable. UNDO block at the file's bottom.

## Step 3 — Prereqs for clean, real grading
1. **Deploy the two committed grading fixes** (assignment-specific synthesized rubric + no duplicate
   notes on re-grade): `supabase functions deploy grade-submission --no-verify-jwt`
2. **Enable `gemini-2.5-pro` billing** on the Google project so the happy path runs on pro (otherwise it
   falls back to flash, visible as a 429 in the agent trace).

## Step 4 — Generate the authentic graded content
Ping me after Steps 1-3 and I'll drive this in-browser (or do it yourself):
- Open **Gatsby Symbolism** (English II P1) and **MLK Rhetorical Analysis** (AP Lang P6).
- **Grade all ungraded** on each → real, rubric-aligned grades + inline annotations **in Sarah's voice**
  (the Style agent step shows `ok (applied)`).
- The edge cases will behave on camera: **Brandon Davis** (jump-shot essay) → withheld/`needs_review`
  off-topic; **Logan Mitchell** (one line) → low/withheld; **Hannah Lee** (uniform, generic) → likely
  AI-generated risk flag.
- On 2-3 strong essays: **accept** most notes, **edit** one (shows "AI originally suggested…"),
  **dismiss** one, then **Finalize** → status flips to Finalized; Metrics begin to populate.
- Grading the queue also feeds the **Metrics dashboard** (time saved, approval rate, turnaround) with
  real numbers.

## Step 5 — The demo script (maps to the spec's 5 critical moments)
1. **Open the dashboard** → 6 classes, a real grading queue. "This is Sarah's Tuesday — 14 essays in,
   165 students across six periods." *(busy, real, human)*
2. **Bag of bricks → lifted:** open Gatsby, **Grade all ungraded** → the **visible agent pipeline**
   (Rubric → Relevance/Risk → Grading → Annotation → Feedback Summary → Style) chews through the batch.
   *(time savings + "AI workforce", not one black-box call)*
3. **Trustworthiness:** open **Brandon Davis** — the jump-shot essay is **withheld, not scored 95%**.
   "It refuses to rubber-stamp off-topic work." Show confidence + per-criterion evidence citations on a
   real essay. *(explainability, trust)*
4. **It sounds like me (the moat):** open **Sofia Reyes** — feedback is in Sarah's voice (names the
   strength, "push your analysis one step further," flags summary-heavy, coaches quote integration).
   Contrast with the generic default if you kept a no-profile baseline. Style step = `ok (applied)`.
   *(AI learning / teacher voice)*
5. **Human oversight:** accept, **edit** a note (→ "AI originally suggested…"), dismiss one, **Finalize**.
   "aiTA drafts; Sarah decides; nothing is final without her." *(human-in-the-loop)*
6. **Rubric intelligence + measurable relief:** show a criterion mapping to the rubric, then **Metrics**
   — time saved + approval rate + turnaround. "Five hours of grading became ninety minutes — and the
   feedback still sounds like her." *(rubric mapping + measurable workload reduction)*

## What's real vs. scaffolded (be honest in the room)
- **Real:** the grades, annotations, evidence citations, Sarah's voice injection, the off-topic refusal,
  HITL edits, the agent pipeline, the metrics computed from the graded set.
- **Scaffolded:** the roster volume (student counts are class metadata; not every assignment has a full
  submission set) and Sarah's identity (seeded). The spec's "167 students / 432 processed / thousands
  of annotations" are aspirational; the seed favors a believable curated set over fake volume.

## Caveats / known gaps (from the goal-alignment review)
- `build-style-profile` (auto-generate the voice from samples) targets `gemini-2.5-pro` (quota=0) and may
  be undeployed — the seed writes Sarah's `style_summary` directly so the demo doesn't depend on it. To
  make it fully live later: give that fn a flash fallback, deploy it, regenerate from the 10 seeded samples.
- Pre-deploy, avoid repeated re-grades (the dedup fix isn't live until Step 3 → duplicate notes).
- See `.planning/GOAL-ALIGNMENT-REVIEW.md` for the full demo/X-Prize/beta punch list.
