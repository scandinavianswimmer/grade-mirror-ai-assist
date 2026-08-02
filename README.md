# Mr Selby — thoughtful grading support

**Mr Selby helps middle- and high-school teachers grade student essays in their own voice and standards—while keeping the teacher as the final authority.**

Paste a rubric, upload student work, and Mr Selby returns rubric-aligned scores and margin feedback written the way *you* write it. Off-topic or adversarial submissions are flagged and withheld, never silently scored. Every grade is reviewable: accept, edit, or dismiss each comment—and your edits teach Mr Selby your voice over time.

The name is a personal tribute to a favorite teacher whose care in teaching, designing assignments, and grading them set the standard behind the product. It does not imply affiliation with or endorsement by that teacher. The project was formerly developed as **aiTA / Grade Mirror**; internal infrastructure identifiers retain those names where changing them would risk data or deployment continuity.

---

## Why it's different

- **Grades in the teacher's voice.** A consent-gated style profile learns from your past feedback, so comments read like yours — not generic AI. ("I barely had to edit this.")
- **Trustworthy by construction.** Rubric-mandatory, relevance-gated scoring. Off-assignment work is withheld with a flag, not given a fabricated grade.
- **Teacher-controlled.** Human review is the default. Teachers accept, edit, or dismiss annotations; eligible automated finalization is explicitly opt-in and remains auditable.
- **Auditable.** Each grade carries a rubric snapshot, evidence anchoring, and an agent-pipeline trace.
- **Privacy-first.** Owner-isolated data, private storage with signed URLs, de-identification before model calls, right-to-erasure, and retention controls.

## How it works

1. **Set up** a class and a rubric-aligned assignment.
2. **Upload** student submissions (PDF / DOCX / text) — server-side extraction with confidence scoring.
3. **Grade** — the AI pipeline validates against the rubric, verifies evidence, recomputes totals, anchors comments to the text, and fails loud rather than guessing.
4. **Review** — accept, edit, or dismiss each comment; finalize when satisfied.
5. **Improve** — your edits sharpen Mr Selby's grasp of your voice on the next batch.

## Tech stack

- **Frontend:** Vite · React 18 · TypeScript · shadcn/ui · Tailwind; `mrselby.app` is purchased and delegated to Cloudflare, but the exact release is not live yet
- **Backend:** Supabase Postgres + Edge Functions; Cloud Run and Cloud Storage adapters are implemented but not yet deployed
- **AI:** Google **Gemini** with an optional Vertex AI transport; rubric-aligned grading, evidence verification, and teacher-style injection
- **Payments:** Stripe · **Analytics:** PostHog

## Local development

```sh
nvm use
npm ci
npm run dev        # → http://localhost:8080
npm run verify     # lint, types, tests, build, and deterministic eval gates
```

Copy `.env.example` → `.env` and fill in the public values. Server secrets are never committed — they live in Supabase function secrets (and, post-migration, Google Cloud Secret Manager).

## Project layout

```
src/                         React app (pages, components, lib)
supabase/functions/          Edge functions (grading, ingest, billing, privacy)
supabase/functions/_shared/  Grading engine, AI router, auth, rate-limiting
supabase/migrations*/        Database schema
worker/                      Async grading worker (Cloud Run)
docs/                        Concepts, guides, references
.planning/                   Roadmap, state, launch plan
```

## Status

The application is in pre-launch hardening. Core product flows are implemented and covered by automated tests, but the configured production hosting, backend, billing, and Vertex deployment are not currently verified live.

The existing project predates the **Build with Gemini XPRIZE** eligibility window. Do not present this repository as an eligible entry without a written organizer ruling; see [`docs/launch/XPRIZE-SUBMISSION.md`](docs/launch/XPRIZE-SUBMISSION.md) for the evidence gate and conditional submission checklist.

## Screenshots

No production screenshots are claimed yet. Replace this section with timestamped captures from the exact deployed release before launch:

- **Dashboard** — classes, assignments, and grading queue at a glance.
- **Grading workspace** — rubric-aligned scores with voice feedback.
- **The "trust moment"** — an off-topic submission flagged and withheld instead of silently scored.
- **Pricing** — plans and limits.

## License

Licensing is **TBD — all rights reserved** pending the founder's decision. No license is granted until a `LICENSE` file is added.
