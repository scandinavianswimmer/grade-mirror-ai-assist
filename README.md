# aiTA — your grading co-pilot

**aiTA helps middle- and high-school teachers grade student essays in their own voice and standards — while keeping the teacher as the final authority.**

Paste a rubric, upload student work, and aiTA returns rubric-aligned scores and margin feedback written the way *you* write it. Off-topic or adversarial submissions are flagged and withheld, never silently scored. Every grade is reviewable: accept, edit, or dismiss each comment — and your edits teach aiTA your voice over time.

---

## Why it's different

- **Grades in the teacher's voice.** A consent-gated style profile learns from your past feedback, so comments read like yours — not generic AI. ("I barely had to edit this.")
- **Trustworthy by construction.** Rubric-mandatory, relevance-gated scoring. Off-assignment work is withheld with a flag, not given a fabricated grade.
- **Human-in-the-loop.** Teacher keeps final authority — accept / edit / dismiss every annotation; edits feed the learning loop.
- **Auditable.** Each grade carries a rubric snapshot, evidence anchoring, and an agent-pipeline trace.
- **Privacy-first.** Owner-isolated data, private storage with signed URLs, de-identification before model calls, right-to-erasure, and retention controls.

## How it works

1. **Set up** a class and a rubric-aligned assignment.
2. **Upload** student submissions (PDF / DOCX / text) — server-side extraction with confidence scoring.
3. **Grade** — the AI pipeline validates against the rubric, verifies evidence, recomputes totals, anchors comments to the text, and fails loud rather than guessing.
4. **Review** — accept, edit, or dismiss each comment; finalize when satisfied.
5. **Improve** — your edits sharpen aiTA's grasp of your voice on the next batch.

## Tech stack

- **Frontend:** Vite · React 18 · TypeScript · shadcn/ui · Tailwind · **Firebase Hosting**
- **Backend:** Supabase (Postgres + Edge Functions) → migrating to Google Cloud (Cloud Run · Cloud SQL · Cloud Storage · Firebase)
- **AI:** Google **Gemini** (via Vertex AI) — rubric-aligned grading with structured JSON output, evidence verification, and teacher-style injection
- **Payments:** Stripe · **Analytics:** PostHog

## Local development

```sh
npm install
npm run dev        # → http://localhost:8080
npm run build      # production build
npm test           # vitest
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

Active build toward a public launch and the **Build with Gemini XPRIZE** (Education & Human Potential). See `.planning/LAUNCH-PLAN.md` for the roadmap.

## Screenshots

_Real images go here once the app is deployed. Placeholders for now:_

- **Dashboard** — classes, assignments, and grading queue at a glance.
- **Grading workspace** — rubric-aligned scores with voice feedback.
- **The "trust moment"** — an off-topic submission flagged and withheld instead of silently scored.
- **Pricing** — plans and limits.

## License

Licensing is **TBD — all rights reserved** pending the founder's decision. No license is granted until a `LICENSE` file is added.
