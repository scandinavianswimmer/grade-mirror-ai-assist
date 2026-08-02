# Teacher's Desk implementation plan

> Approved 2026-08-01. Execute as one release, preserving honest public-preview and protected-backend boundaries.

**Goal:** Make the public site, teacher workspace, and XPRIZE evidence package feel like one human, recognizable teacher product while keeping every product and submission claim truthful.

**Architecture:** Extend the existing React/Vite/Tailwind application and Marginalia tokens. Keep API, Supabase, grading, and persistence behavior intact; translate stored state at the presentation boundary. Add a public synthetic Judge Mode that exposes only real build metadata and clearly marks unavailable production proof. Reuse existing fixtures and grading components instead of creating a second mock product.

**Stack:** React 18, TypeScript, React Router, Tailwind, Radix UI, Lucide, Vitest, Cloudflare Workers, existing Supabase integration.

---

## Task 1: Establish the release target and shared language

**Files:**

- Modify: `src/index.css`
- Modify: `tailwind.config.ts`
- Modify: `src/lib/submissionStatus.ts`
- Modify: `src/lib/submissionStatus.test.ts`
- Add: `src/lib/teacherLanguage.ts`
- Add: `src/lib/teacherLanguage.test.ts`

**Work:**

1. Preserve the Marginalia palette and typography while adding reusable shell, manuscript, queue, and evidence-rail utilities.
2. Centralize teacher-facing navigation and status vocabulary.
3. Replace “published/finalized” presentation language with Approved/Exported semantics.
4. Keep opt-in automatic approval explicit and attributed to the teacher's setting.
5. Add tests before migrating consuming screens.

## Task 2: Build the Teacher's Desk shell and Today queue

**Files:**

- Modify: `src/components/Navbar.tsx`
- Modify: `src/pages/Dashboard.tsx`
- Modify: `src/pages/AssignmentDetail.tsx`
- Modify: `src/App.tsx`
- Add or modify focused tests under `src/`

**Work:**

1. Replace the `aiTA` identity with Mr Selby.
2. Change navigation to Today, Classes, To review, Feedback style, Progress, and Activity without breaking existing routes.
3. Recompose Dashboard into a state-derived grading queue.
4. Preserve create-class, create-assignment, upload, sample-data, plan-limit, and auth behavior.
5. Recompose assignment detail into assignment progress and direct review entry points.

## Task 3: Recompose the core submission review

**Files:**

- Modify: `src/pages/SubmissionDetail.tsx`
- Modify: `src/components/EssayWithAnnotations.tsx`
- Modify: `src/components/AnnotationSidebar.tsx`
- Modify: `src/components/AgentPipeline.tsx`
- Modify: `src/components/OnTheLoopSummary.tsx`
- Add or modify focused tests under `src/`

**Work:**

1. Keep manuscript, annotations, rubric, score, and teacher decisions in one stable cockpit.
2. Move model, latency, token, pipeline, and unattended-operation evidence behind Judge Mode or an explicit technical disclosure.
3. Use Ready for review, Needs a closer look, Approved, and Exported throughout.
4. Make evidence links, pending teacher decisions, save state, Previous/Next, Approve, and Export unambiguous.
5. Preserve off-topic withholding, regrade safety, and persistence behavior.

## Task 4: Humanize the public site and footer

**Files:**

- Modify: `src/pages/Pitch.tsx`
- Modify: `src/components/public/PublicFooter.tsx`
- Modify: `src/PublicApp.tsx`
- Modify: `src/App.tsx`
- Add or modify public-page tests and accessibility assertions

**Work:**

1. Replace the template-like sequence with the five approved movements.
2. Lead with the exact approved hero copy and a realistic product workspace.
3. Keep the CTA honest in public-preview mode: open a safe sample or explain workspace setup, never accept student data.
4. Humanize the name story without inventing biography or endorsement.
5. Correct the footer's auto-approval wording while retaining Privacy, Terms, Accessibility, contact, report-problem, preview, and tribute disclosures.

## Task 5: Make onboarding and Feedback style value-first

**Files:**

- Modify: `src/components/onboarding/TeacherOnboarding.tsx`
- Modify: relevant components under `src/components/onboarding/`
- Modify: `src/pages/Training.tsx`
- Modify: `src/components/TrainingDataManager.tsx`
- Add or modify focused tests

**Work:**

1. Replace the six-step survey gate with a short sample-first path.
2. Defer optional profile, referral, research, and technical-comfort questions.
3. Rename Training to Feedback style in visible copy.
4. Remove hard-coded `47`, `92%`, `2 hrs`, fake history, emojis, gradients, and pulse effects.
5. Derive counts from actual examples/decisions or show an honest empty state.

## Task 6: Add The Teacher's Test Judge Mode

**Files:**

- Add: `src/pages/JudgeMode.tsx`
- Add: `src/components/judge/ReleaseProofRail.tsx`
- Add: `src/lib/releaseProof.ts`
- Add: tests for release proof and Judge Mode
- Modify: `src/PublicApp.tsx`
- Modify: `src/App.tsx`
- Modify: `vite.config.ts` or build-time metadata configuration if required

**Work:**

1. Add a public `/judge` route using only fictional fixtures and no student data.
2. Present the four Teacher's Test questions and the strong/off-topic proof pair.
3. Show build SHA/version when present; label missing Gemini/GCP/trace evidence as not captured.
4. Provide a 90-second judge path into the actual protected product only when a verified account exists.
5. Add the route to metadata, canonical/noindex policy, and accessibility coverage.

## Task 7: Prepare the XPRIZE proof package

**Files:**

- Add: `JUDGES.md`
- Add: `docs/launch/PROOF-NOT-PITCH-VIDEO.md`
- Add: `docs/launch/TEACHER-TIME-LEDGER.md`
- Add: `docs/launch/DEVPOST-GALLERY-BRIEF.md`
- Modify: `docs/launch/DEVPOST-DRAFT.md`
- Modify: `docs/launch/XPRIZE-SUBMISSION.md`
- Modify privately: `.submission-evidence/00-manifest.md`

**Work:**

1. Write a concise judge map and report card of verified, pending, and blocked proof.
2. Write a 2:40 live-product video script with captions and shot list.
3. Create a paired-study protocol and blank ledger; do not invent participants or outcomes.
4. Define three 1500×1000 gallery panels using only production facts.
5. Add five-year goal, profitability path, potential teacher economic opportunities, concentration disclosure, and evidence placeholders to the Devpost draft.
6. Refresh the private manifest only with exact release facts after shipping.

## Task 8: Verify, compare, and ship

**Files:**

- Add: `design-qa.md`
- Modify: any file required to resolve failures
- Modify privately: `.submission-evidence/00-manifest.md`

**Work:**

1. Run focused unit tests while implementing.
2. Run `npm run verify` and fix every in-scope failure.
3. Exercise public root, `/judge`, legal pages, auth/setup, Today, assignment, and submission review in the approved in-app browser.
4. Test keyboard navigation, focus visibility, zoom/reflow, reduced motion, and high-contrast-relevant states; run automated axe coverage.
5. Capture 1440 px and mobile implementation screenshots.
6. Compare implementation and approved concept images together, record mismatches, fix, and repeat until `design-qa.md` says `final result: passed`.
7. Commit, push, open or update the pull request, verify CI, merge, deploy to Cloudflare, verify the exact live Worker version, and update the private manifest.

## Release gates

- No fake user, revenue, time-saving, model, trace, Google Cloud, or production-backend evidence.
- No teacher-facing “AI-native,” model ID, token, latency, on-the-loop, publish, or finalize language.
- No horizontal page scroll at 320 CSS px or 200% zoom on supported desktop widths.
- No unresolved critical/serious axe findings.
- No regression in off-topic withholding or teacher-decision persistence.
- The final manifest identifies one exact commit, CI run, Cloudflare Worker version, and live verification cutoff.
