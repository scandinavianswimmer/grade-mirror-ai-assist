# aiTA — Build with Gemini XPRIZE submission gate

Audit date: **August 1, 2026**

Track: **Education & Human Potential**

Official deadline: **August 17, 2026 at 1:00 PM PDT**

Official sources: [rules](https://www.geminixprize.com/rules) · [Devpost rules](https://xprize.devpost.com/rules) · [FAQ](https://xprize.devpost.com/details/faq) · [eligibility clarification](https://xprize.devpost.com/forum_topics/44047-clarification-on-eligibility-timeline) · [dates](https://xprize.devpost.com/details/dates)

Conditional deployment recovery: [`DEPLOYMENT-RECOVERY.md`](DEPLOYMENT-RECOVERY.md)

## 0. Eligibility gate: organizer approval received

On **August 1, 2026**, the founder confirmed that organizer approval was received for aiTA to proceed. Archive the written ruling in the private submission evidence folder and preserve its complete wording; do not commit private correspondence or contact details to this public repository.

- The public GitHub repository and first AI Grading Assistant MVP commit date to **June 23, 2025**.
- That history was the reason written organizer confirmation was required.
- The submission should accurately describe the history and follow any conditions in the ruling rather than claiming the repository itself was first created after May 19, 2026.

Eligibility is therefore no longer the release stop gate. Deployment evidence, a working judge journey, and complete submission materials remain blocking.

## 1. Verified readiness snapshot

| Gate | Status on Aug 1 | Evidence / next action |
|---|---|---|
| Date eligibility | **CLEARED — founder confirmed** | Organizer approval received Aug 1; archive the written ruling and follow any stated conditions |
| Public code repository | Ready | `scandinavianswimmer/grade-mirror-ai-assist` is public |
| License | Open | All rights reserved; founder must choose whether to add a license |
| Public live application | **NO-GO** | No custom domain has been purchased; do not use or imply ownership of `aita.app`. Use the configured Firebase Hosting URL for launch after it returns HTTP 200 (it currently returns 404), then connect a purchased domain later. |
| Working backend | **NO-GO** | Both candidate Supabase hosts (`rwiqwuohbcvhuvtlxlvh` and `yhdobsmmhdvqswjpousc`) return authoritative DNS NXDOMAIN; current credentials cannot access the intended later project |
| Google Cloud product in deployed app | **UNPROVEN** | Cloud Run/Firebase/Vertex paths exist in code; no live deployment evidence |
| Gemini API call in deployed app | **UNPROVEN** | Gemini integration exists in code; no production request/log proof |
| CI quality gate | **Ready remotely** | Code commit `5a59250` passed the repaired app-and-Node TypeScript gate, lint, 222 tests, production build, and deterministic evals in [GitHub Actions run 30719973506](https://github.com/scandinavianswimmer/grade-mirror-ai-assist/actions/runs/30719973506) |
| Test credentials / judge instructions | Missing | Create only against the exact live release; never include secrets in the repo |
| Real users and testimonials | Unverified | Export timestamped, privacy-safe evidence; do not use seed/demo personas as users |
| Real revenue and P&L | Unverified | Export Stripe revenue by month, costs excluding marketing, CAC, and related-party split |
| Production execution logs | Missing | Capture Gemini/GCP request volume, agent traces, failures, and release identifiers |
| Public demo video under 3:00 | Missing | Record only after the live build and evidence below are verified |
| 500–1,000 word narrative | Draft only | Complete with measured figures and links; remove every placeholder |
| Repository/security hygiene | Partial | Current tree scan is clean; old history contains public Supabase/Firebase client identifiers and GitHub secret scanning is disabled. `npm audit --omit=dev` reports the current React Router RSC advisory, but the official advisory says it applies only to unstable RSC APIs; this Vite `BrowserRouter` SPA has no RSC package or API usage. Track and upgrade when a compatible patched release is published. |
| Password recovery | **READY LOCALLY; LIVE GATE PENDING** | Dedicated request/update routes, account-enumeration-safe confirmation, expired-link handling, and recovery-intent tests pass. A real emailed link still requires the confirmed Supabase project and redirect allowlist. |
| Privacy and Terms | **POLISHED PREVIEWS** | Public, accessible preview pages now state the product's current practices and show conspicuous placeholders for the effective date, legal entity, contact, and future public domain. Final legal review and real contact details remain required before launch. |
| Accessibility beta pass | **READY LOCALLY; REPEAT ON LIVE URL** | VoiceOver, exact 200% Safari zoom, macOS Increase Contrast, keyboard/dialog focus, 320px reflow, route announcements, landmarks, form labels, and chart text alternatives were exercised against the configured production build. Repeat against the exact deployed release. |

### 1.1 Beta-gap closure evidence — August 1

- `npm run verify` passes locally with zero lint warnings, both TypeScript projects, **230 tests**, a production build, deterministic eval dry runs, and the calibration gate.
- Password recovery now uses `/auth/forgot-password` and `/auth/reset-password`. The request result is deliberately generic, success headings receive focus, expired or context-free update links fail closed, and tab-scoped recovery intent is cleared after use or sign-out. The local synthetic-backend browser pass covered request confirmation and invalid-link behavior; a valid emailed production link remains part of the live gate.
- VoiceOver was enabled through macOS Accessibility settings for a real Safari pass. Safari exposed the auth and recovery headings, named email/password controls, recovery/legal links, and the `Navigated to Reset your password · aiTA` route announcement. The VoiceOver rotor opened and exited normally.
- Safari page zoom was set to exactly **200%**. The recovery flow remained readable and operable with no horizontal clipping; the setting was restored to 100% afterward.
- macOS **Increase Contrast** was enabled. Input, card, link, focus, and primary-action boundaries remained visible; the setting was restored afterward. Source-level forced-colors and `prefers-contrast` fallbacks are also present.
- At 320px, authenticated navigation retains all five destinations with 56px targets, workspace pages do not overflow horizontally, long dialogs scroll inside the viewport, and closing a dialog restores focus to its launch button. At 640px and the default desktop viewport, public/auth/legal surfaces also reflow without horizontal overflow.
- Privacy and Terms are intentionally labeled launch previews. They do not invent ownership of a domain, a legal entity, an effective date, a privacy address, or a completed compliance review.
- The production dependency audit currently reports [GHSA-qwww-vcr4-c8h2](https://github.com/advisories/GHSA-qwww-vcr4-c8h2) through `react-router`/`react-router-dom`. GitHub's reviewed advisory says the issue affects only unstable RSC APIs; the app is a client-only Vite SPA using `BrowserRouter`, has no React Server Components package or RSC API references, and therefore does not expose the affected path. No compatible patched npm release was available during this audit, so a forced breaking downgrade was not used to create a false-green report.

## 2. Submission checklist

The eligibility gate is cleared. Every remaining item still requires evidence from the exact release.

- [ ] One category selected: Education & Human Potential.
- [ ] Project name, short tagline, thumbnail, team, and contact details finalized.
- [ ] 500–1,000 word description covers the problem, solution, AI-native operation, business viability, category impact, Google Cloud architecture, and measured evidence.
- [ ] Public demo video is **under three minutes**, captioned, and shows the exact deployed release.
- [ ] Public repository URL points to the reviewed commit/tag and includes setup instructions.
- [ ] Live application URL works in a private browser session.
- [ ] Submission and product surfaces use the verified Firebase Hosting URL; replace the polished custom-domain placeholders only after a domain is purchased, connected, and verified.
- [ ] Judge account and test instructions reproduce the demonstrated path without exposing real student data.
- [ ] At least one Google Cloud product and at least one Gemini API call are present in the deployed app and backed by timestamped logs.
- [ ] Real-user counts, demographics, testimonials, and production usage are documented.
- [ ] Revenue by month, operating costs excluding marketing, marketing spend/CAC, and related-party revenue are documented.
- [ ] Every factual claim maps to an evidence file or live dashboard capture.
- [ ] Submission is entered before **August 17, 2026 at 1:00 PM PDT**.

## 3. Evidence-safe narrative outline

Target 650–850 words. Bracketed values are blocking placeholders, not claims.

1. **Problem (80–120 words):** teacher grading time, generic feedback, and the risk of confidently grading off-assignment work. Cite a primary source for any market or bias statistic.
2. **Product (120–160 words):** rubric-grounded grading, evidence anchors, refusal/exception paths, teacher voice, and accept/edit/dismiss controls. Say what is opt-in versus default.
3. **AI-native operation (120–160 words):** describe the actual deployed Gemini pipeline and Google Cloud services. Insert `[PRODUCTION_REQUEST_COUNT]`, `[DATE_RANGE]`, and a link to privacy-safe logs.
4. **Measured impact (100–140 words):** insert `[REAL_TEACHER_COUNT]`, `[REAL_SUBMISSION_COUNT]`, `[TIME_SAVED_METHOD]`, and `[VOICE_EVAL_RESULT]`. Report null or negative findings honestly.
5. **Business viability (100–140 words):** insert monthly arms-length revenue, related-party revenue, active paid accounts, churn/retention, costs, and CAC. Seed accounts and founder payments do not count as independent traction.
6. **Why this category / next step (60–100 words):** explain the education benefit without claiming student outcomes that were not measured.

Claim rules:

- “Implemented” means code exists and passed the release gate.
- “Deployed” means the public URL and exact release were tested.
- “In production” requires real production logs from that release.
- “Auto-finalized” requires persisted `finalized_by = ai` or `auto_finalized_at` provenance; confidence alone is not proof.
- “Paying users,” “revenue,” “time saved,” and “convergence” require dated primary evidence.

## 4. Conditional video plan — target 2:40, hard cap 3:00

Do not record against seed data and narrate it as production usage.

| Time | Show | Evidence-safe narration |
|---|---|---|
| 0:00–0:20 | Real teacher problem and live app URL | Identify the user problem without unsupported market totals |
| 0:20–0:55 | Create/open assignment, rubric, and privacy-safe submission | Explain rubric grounding and the teacher's control |
| 0:55–1:25 | Grade one on-topic response; reveal evidence anchors | Show the deployed Gemini request and trace ID |
| 1:25–1:50 | Off-topic response routed/withheld | Demonstrate refusal rather than a fabricated score |
| 1:50–2:15 | Accept/edit/dismiss and finalize | Show the edit trail and voice feedback loop |
| 2:15–2:35 | Real metrics/revenue evidence | Use dated values; label small samples and related-party revenue |
| 2:35–2:50 | Architecture + closing URL | Name only the Google Cloud services proven live |

If opt-in unattended publication is actually enabled, show the setting and explicit provenance. Otherwise omit the auto-finalize claim entirely.

## 5. Tonight's honest finish line

Tonight can produce a reviewed release candidate and complete the submission surfaces. Organizer approval clears the eligibility issue, but a working production deployment and evidence that has not yet been collected cannot be fabricated.

- [x] Finish the local `npm run verify` gate.
- [x] Validate GitHub Actions syntax and remove masked deployment failures.
- [x] Smoke-test public routes from a production build with local, non-production configuration.
- [x] Repair the false-green TypeScript command, compile the actual app, and resolve all 53 surfaced errors.
- [x] Run a developer, beta/accessibility, and production-surface audit; fail dead checkout/contact links closed and remove student-data debug traces.
- [x] Add the missing additive `training_examples` reconciliation migration so consented reinforcement writes match the deployable schema.
- [x] Scan the current tree and targeted historical credential patterns; document the remaining public client identifiers.
- [x] Push the isolated release-candidate branch and open draft PR #30.
- [x] Pass the remote GitHub Actions quality gate on the pushed candidate.
- [x] Receive organizer approval to proceed.
- [x] Implement and locally test password recovery, including generic request confirmation and fail-closed invalid links.
- [x] Publish polished Privacy and Terms previews with conspicuous launch placeholders instead of invented facts.
- [x] Complete the local VoiceOver, exact 200% zoom, Increase Contrast, keyboard, dialog-focus, and responsive-layout beta pass; restore all host settings afterward.
- [ ] Archive the written ruling in the private submission evidence folder and note any conditions.
- [ ] If continuing: confirm the canonical Supabase ref, restore/provision only that backend, configure Google Cloud/Firebase and secrets, deploy, and re-run the release gate against the live URLs.
- [ ] Only then collect real evidence, record the video, finish the narrative, and submit.
