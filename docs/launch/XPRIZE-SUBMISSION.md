# Mr Selby — Build with Gemini XPRIZE submission gate

Audit date: **August 1, 2026**

Track: **Education & Human Potential**

Official deadline: **August 17, 2026 at 1:00 PM PDT**

Official sources: [rules](https://www.geminixprize.com/rules) · [Devpost rules](https://xprize.devpost.com/rules) · [FAQ](https://xprize.devpost.com/details/faq) · [eligibility clarification](https://xprize.devpost.com/forum_topics/44047-clarification-on-eligibility-timeline) · [dates](https://xprize.devpost.com/details/dates)

Protected-product activation: [`../GO-LIVE-RUNBOOK.md`](../GO-LIVE-RUNBOOK.md)

## 0. Eligibility gate: organizer approval received

On **August 1, 2026**, the founder confirmed that organizer approval was received for Mr Selby to proceed. Archive the written ruling in the private submission evidence folder and preserve its complete wording; do not commit private correspondence or contact details to this public repository.

- The public GitHub repository and first AI Grading Assistant MVP commit date to **June 23, 2025**.
- That history was the reason written organizer confirmation was required.
- The submission should accurately describe the history and follow any conditions in the ruling rather than claiming the repository itself was first created after May 19, 2026.

Eligibility is therefore no longer the release stop gate. Deployment evidence, a working judge journey, and complete submission materials remain blocking.

## 1. Verified readiness snapshot

| Gate | Status on Aug 1 | Evidence / next action |
|---|---|---|
| Date eligibility | **CLEARED — founder confirmed** | Organizer approval received Aug 1; archive the written ruling and follow any stated conditions |
| Public code repository | **PUBLIC; PREVIEW RELEASE TAGGED** | `scandinavianswimmer/grade-mirror-ai-assist` is public. PR #30 is merged and deployed commit `119d109` is tagged `mr-selby-public-preview-2026-08-01`. A license or private-judge sharing decision remains required. |
| License | **BLOCKED — OWNER DECISION** | The repository is currently all rights reserved and has no `LICENSE`. Choose relevant public-repository licensing, or use the contest's private-repository sharing path. |
| Public live application | **PUBLIC PREVIEW LIVE; PRODUCT GATED** | Release `119d109` / Worker `94fc5cfb-941f-4d95-b50e-7de49d9b7066` serves the rebranded overview, legal previews, security headers, self-hosted fonts, and guarded setup state at `https://mrselby.app`. Accounts and classroom data remain closed until the backend is provisioned and verified. |
| Working backend | **NO-GO** | No approved Mr Selby Supabase project is connected. The protected product bundle is intentionally excluded from the live preview. |
| Google Cloud product in deployed app | **UNPROVEN** | Cloud Run/Firebase/Vertex paths exist in code; no live deployment evidence |
| Gemini API call in deployed app | **UNPROVEN** | Gemini integration exists in code; no production request/log proof |
| CI quality gate | **READY REMOTELY** | Exact release `119d109` passed lint, both TypeScript projects, the frozen Deno check for all 16 Edge Functions, 26 test files with 256 tests, the production build, deterministic evals, and the calibration gate in [run 30728937099](https://github.com/scandinavianswimmer/grade-mirror-ai-assist/actions/runs/30728937099). [Main run 30729106237](https://github.com/scandinavianswimmer/grade-mirror-ai-assist/actions/runs/30729106237) repeated the gate after merge and proved the disabled Supabase deploy path skipped safely. |
| Test credentials / judge instructions | Missing | Create only against the exact live release; never include secrets in the repo |
| Real users and testimonials | Unverified | Export timestamped, privacy-safe evidence; do not use seed/demo personas as users |
| Real revenue and P&L | Unverified | Export Stripe revenue by month, costs excluding marketing, CAC, and related-party split |
| Production execution logs | Missing | Capture Gemini/GCP request volume, agent traces, failures, and release identifiers |
| Public demo video under 3:00 | Missing | Record only after the live build and evidence below are verified |
| 500–1,000 word narrative | Draft only | Complete with measured figures and links; remove every placeholder |
| Repository/security hygiene | **PARTIAL — HISTORICAL ALERT OPEN** | GitHub secret scanning and push protection are enabled. One historical Google API-key alert remains open at commit `ef9b808`; the current `.env.example` value is empty, but the owner must verify the historical key, restrict or revoke it if active, and record the alert's resolution without reproducing the value. `npm audit --omit=dev` also reports the current React Router RSC advisory; the reviewed advisory applies only to unstable RSC APIs, and this Vite `BrowserRouter` SPA has no RSC package or API usage. Track and upgrade when a compatible patched release is published. |
| Password recovery | **READY LOCALLY; LIVE GATE PENDING** | Dedicated request/update routes, account-enumeration-safe confirmation, expired-link handling, and recovery-intent tests pass. A real emailed link still requires the confirmed Supabase project and redirect allowlist. |
| Right to erasure | **READY LOCALLY; LIVE GATE PENDING** | The authenticated Edge Function recursively removes and re-verifies all owned objects before deleting records, covers the current and legacy private buckets, rejects cross-owner paths, and fails closed on partial deletion. A seeded live deletion test still requires the confirmed Supabase project. |
| Privacy and Terms | **POLISHED PREVIEWS — LIVE** | Public, accessible pages at `mrselby.app` state the product's current practices and show conspicuous placeholders for the effective date, legal entity, and contact. Final legal review and real contact details remain required before account launch. |
| Accessibility beta pass | **LOCAL MANUAL PASS; LIVE PUBLIC SMOKE PASS** | VoiceOver, exact 200% Safari zoom, macOS Increase Contrast, keyboard/dialog focus, 320px reflow, route announcements, landmarks, form labels, and chart text alternatives were exercised against the configured production build. Public routes were retested live; repeat the full manual pass against the final protected release. |

### 1.1 Beta-gap closure evidence — August 1

- Release `119d109` passes remotely under Node 22 in [run 30728937099](https://github.com/scandinavianswimmer/grade-mirror-ai-assist/actions/runs/30728937099): zero lint warnings, both TypeScript projects, **26 test files / 256 tests**, a production build, deterministic eval dry runs, the calibration gate, and a frozen Deno typecheck of every top-level Edge Function. The post-merge main run repeated the same release gate.
- Password recovery now uses `/auth/forgot-password` and `/auth/reset-password`. The request result is deliberately generic, success headings receive focus, expired or context-free update links fail closed, and tab-scoped recovery intent is cleared after use or sign-out. The local synthetic-backend browser pass covered request confirmation and invalid-link behavior; a valid emailed production link remains part of the live gate.
- VoiceOver was enabled through macOS Accessibility settings for a real Safari pass. Safari exposed the auth and recovery headings, named email/password controls, recovery/legal links, and the `Navigated to Reset your password · Mr Selby` route announcement. The VoiceOver rotor opened and exited normally.
- Safari page zoom was set to exactly **200%**. The recovery flow remained readable and operable with no horizontal clipping; the setting was restored to 100% afterward.
- macOS **Increase Contrast** was enabled. Input, card, link, focus, and primary-action boundaries remained visible; the setting was restored afterward. Source-level forced-colors and `prefers-contrast` fallbacks are also present.
- At 320px, authenticated navigation retains all five destinations with 56px targets, workspace pages do not overflow horizontally, long dialogs scroll inside the viewport, and closing a dialog restores focus to its launch button. At 640px and the default desktop viewport, public/auth/legal surfaces also reflow without horizontal overflow.
- Privacy and Terms are intentionally labeled launch previews. They accurately show the public preview as live and do not invent a legal entity, effective date, privacy address, or completed compliance review.
- The production dependency audit currently reports [GHSA-qwww-vcr4-c8h2](https://github.com/advisories/GHSA-qwww-vcr4-c8h2) through `react-router`/`react-router-dom`. GitHub's reviewed advisory says the issue affects only unstable RSC APIs; the app is a client-only Vite SPA using `BrowserRouter`, has no React Server Components package or RSC API references, and therefore does not expose the affected path. No compatible patched npm release was available during this audit, so a forced breaking downgrade was not used to create a false-green report.

## 2. Submission checklist

The eligibility gate is cleared. Every remaining item still requires evidence from the exact release.

- [x] Category selected: Education & Human Potential.
- [x] Project name finalized: Mr Selby.
- [x] Short tagline and image candidates prepared: “Thoughtful grading support, shaped by how you teach”; `public/mr-selby-mark.png` and `public/mr-selby-social.png`.
- [ ] Entrant or team membership and contact details finalized in Devpost.
- [ ] 500–1,000 word description covers the problem, solution, AI-native operation, business viability, category impact, Google Cloud architecture, and measured evidence.
- [ ] Public demo video is **under three minutes**, captioned, and shows the exact deployed release.
- [x] Public repository URL points to reviewed commit `119d109` / tag `mr-selby-public-preview-2026-08-01` and includes setup instructions.
- [x] Public-preview URL works over HTTPS in a clean browser session; protected product acceptance remains open.
- [x] Public and submission surfaces use `https://mrselby.app`; the Worker custom domain, HTTPS, canonical HTTP/`www` redirects, SPA routes, and static security headers are verified.
- [ ] Judge account and test instructions reproduce the demonstrated path without exposing real student data.
- [ ] At least one Google Cloud product and at least one Gemini API call are present in the deployed app and backed by timestamped logs.
- [ ] Real-user counts, demographics, testimonials, and production usage are documented.
- [ ] Revenue by month, operating costs excluding marketing, marketing spend/CAC, and related-party revenue are documented.
- [ ] Every factual claim maps to an evidence file or live dashboard capture.
- [ ] Submission is entered before **August 17, 2026 at 1:00 PM PDT**.

## 3. Private submission evidence bundle

The ignored `.submission-evidence/` directory now contains a current private manifest and the exact-release Lighthouse JSON. Continue filling it with primary evidence or explicit zero/not-yet-available statements. Current identifiers are commit `119d109`, tag `mr-selby-public-preview-2026-08-01`, Worker `94fc5cfb-941f-4d95-b50e-7de49d9b7066`, [release CI run 30728937099](https://github.com/scandinavianswimmer/grade-mirror-ai-assist/actions/runs/30728937099), [main run 30729106237](https://github.com/scandinavianswimmer/grade-mirror-ai-assist/actions/runs/30729106237), and `https://mrselby.app`.

The private bundle must cover the organizer ruling, final repository/license identity, protected release, Gemini and Google Cloud proof, judge journey, users, May–August revenue, related-party revenue, expenses, exact-release media, and final narrative. For every artifact, record its capture time, release SHA, source, denominator, exclusions, and verifier. Redact credentials, student content, private correspondence, and unnecessary personal information before sharing.

## 4. Evidence-safe narrative outline

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

## 5. Conditional video plan — target 2:40, hard cap 3:00

Do not record against seed data and narrate it as production usage.
Use an original, clearly synthetic assignment, rubric, and student response unless permission for every third-party work, mark, and recording element has been documented.

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

## 6. Tonight's honest finish line

Tonight produced a merged, tagged, and live-QA-verified public preview plus the submission surfaces and private release manifest. Organizer approval clears the eligibility issue, but the protected production deployment and evidence that has not yet been collected cannot be fabricated.

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
- [x] Harden account and retention erasure so nested Storage objects are recursively removed and verified before related records are deleted.
- [x] Deploy the safe public preview to Cloudflare Workers at `https://mrselby.app` and verify DNS, TLS, SPA routes, assets, and security headers.
- [x] Record release commit `119d109`, tag `mr-selby-public-preview-2026-08-01`, Worker version `94fc5cfb-941f-4d95-b50e-7de49d9b7066`, both remote CI runs, live QA, and Lighthouse evidence in the private manifest.
- [x] Complete the local VoiceOver, exact 200% zoom, Increase Contrast, keyboard, dialog-focus, and responsive-layout beta pass; restore all host settings afterward.
- [ ] Archive the written ruling in the private submission evidence folder and note any conditions.
- [ ] Verify the historical Google API key identified by GitHub, restrict or revoke it if active, and resolve the alert with a documented disposition.
- [x] Merge PR #30 and tag the exact verified public-preview release.
- [ ] Choose the repository licensing or private-sharing path before Devpost submission.
- [ ] Obtain organization and cost approval for a fresh, isolated Supabase project; review the fresh-project schema path before linking, migrating, or deploying.
- [ ] Configure Google Cloud/Gemini, required functions, auth redirects, and secrets; deploy the protected product and re-run the release gate against the live URLs.
- [ ] Only then collect real evidence, record the video, finish the narrative, and submit.
