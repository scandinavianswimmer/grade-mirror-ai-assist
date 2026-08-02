# Mr Selby — thoughtful grading support

**Mr Selby is built to help middle- and high-school teachers grade student essays in their own voice and standards—while keeping the teacher as the final authority.**

Paste a rubric, upload student work, and Mr Selby drafts rubric-aligned scores and margin feedback for teacher review. Off-topic or adversarial submissions are flagged and withheld rather than silently scored. Teachers can accept, edit, or dismiss each comment, and consented examples and edits can guide later feedback.

The name is a personal tribute to a favorite teacher whose care in teaching, designing assignments, and grading them set the standard behind the product. It does not imply affiliation with or endorsement by that teacher. The project was formerly developed as **aiTA / Grade Mirror**; internal infrastructure identifiers retain those names where changing them would risk data or deployment continuity.

---

## Why it's different

- **Guided by the teacher's voice.** A consent-gated style profile uses patterns from past examples and edits to guide later feedback.
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

- **Frontend:** Vite · React 18 · TypeScript · shadcn/ui · Tailwind; the safe public preview is live at [mrselby.app](https://mrselby.app) on Cloudflare Workers
- **Backend:** Supabase Postgres + Edge Functions; no approved production backend is connected yet, so accounts and classroom data remain intentionally closed
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

The public site is live. Release commit [`119d109`](https://github.com/scandinavianswimmer/grade-mirror-ai-assist/commit/119d1090cd71fc5f5607379b54cba46261ac9b9c), tagged `mr-selby-public-preview-2026-08-01`, is deployed as Cloudflare Worker version `94fc5cfb-941f-4d95-b50e-7de49d9b7066`. It serves the product overview, Privacy and Terms launch previews, guarded setup routes, canonical redirects, self-hosted fonts, and static security headers without loading the protected product bundle.

The protected product is still in pre-launch hardening. Core workflows are implemented and covered by automated tests, but signup, password email delivery, grading, billing, account deletion, and the Gemini/Google Cloud path are not production claims until a fresh, isolated Supabase backend is approved, provisioned, and accepted end to end.

[GitHub Actions run 30728937099](https://github.com/scandinavianswimmer/grade-mirror-ai-assist/actions/runs/30728937099) passed lint, both TypeScript projects, the frozen Deno typecheck for all 16 Edge Functions, 26 test files with **256 tests**, the production build, deterministic evals, and the calibration gate for the deployed release commit. Post-merge [main run 30729106237](https://github.com/scandinavianswimmer/grade-mirror-ai-assist/actions/runs/30729106237) repeated the gate and proved the disabled Supabase deployment path skipped safely. The founder confirmed written organizer approval to proceed with the **Build with Gemini XPRIZE**; the complete ruling remains private evidence and its conditions govern the submission. See [`docs/launch/XPRIZE-SUBMISSION.md`](docs/launch/XPRIZE-SUBMISSION.md) for the exact evidence boundary.

## Screenshots

The public brand and social assets are available at [`public/mr-selby-mark.png`](public/mr-selby-mark.png) and [`public/mr-selby-social.png`](public/mr-selby-social.png). Protected-product screenshots remain evidence-gated until the configured judge journey passes against the exact deployed release:

- **Dashboard** — classes, assignments, and grading queue at a glance.
- **Grading workspace** — rubric-aligned scores with voice feedback.
- **The "trust moment"** — an off-topic submission flagged and withheld instead of silently scored.
- **Pricing** — plans and limits.

## License

Licensing is **TBD — all rights reserved** pending the founder's decision. No license is granted until a `LICENSE` file is added.
