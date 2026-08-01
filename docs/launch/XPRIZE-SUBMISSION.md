# aiTA — Build with Gemini XPRIZE submission gate

Audit date: **August 1, 2026**

Track: **Education & Human Potential**

Official deadline: **August 17, 2026 at 1:00 PM PDT**

Official sources: [rules](https://www.geminixprize.com/rules) · [Devpost rules](https://xprize.devpost.com/rules) · [FAQ](https://xprize.devpost.com/details/faq) · [eligibility clarification](https://xprize.devpost.com/forum_topics/44047-clarification-on-eligibility-timeline) · [dates](https://xprize.devpost.com/details/dates)

## 0. Stop gate: the existing project is not presently eligible

Do **not** submit aiTA in its current identity or describe it as a project newly created after May 19, 2026.

- The public GitHub repository was created on **June 23, 2025**.
- Its first commit is dated **June 23, 2025** and already describes an AI Grading Assistant MVP.
- The organizer's published clarification says the project/business itself must be newly created after May 19, 2026. A later launch, a new feature, a hosted edition, or substantial enhancements to an older application do not make the older project eligible.
- Generic libraries, templates, frameworks, boilerplate, and snippets may be reused in a genuinely new post-cutoff project if disclosed. That is not permission to relabel this application.

Proceed only after one of these gates clears:

1. **Written organizer ruling:** send the exact history above to the organizer and receive written confirmation that this project is eligible; or
2. **Genuinely new project:** create a substantively new project and business after May 19, 2026. It cannot be aiTA with a new name or one added feature. Disclose every reused generic component.

Suggested organizer message:

> Our public repository and AI-grading MVP date to June 23, 2025. Since May 19, 2026 we have added new Gemini/Google Cloud infrastructure and product capabilities. Your FAQ says a pre-existing application remains ineligible even when substantially enhanced. Can you confirm in writing whether this project is ineligible, and whether only generic boilerplate—not product-specific grading code—may be reused in a genuinely new project?

## 1. Verified readiness snapshot

| Gate | Status on Aug 1 | Evidence / next action |
|---|---|---|
| Date eligibility | **NO-GO** | Repo and product history begin in June 2025; obtain written ruling or pivot |
| Public code repository | Ready | `scandinavianswimmer/grade-mirror-ai-assist` is public |
| License | Open | All rights reserved; founder must choose whether to add a license |
| Public live application | **NO-GO** | Configured Firebase URL returns HTTP 404 |
| Working backend | **NO-GO** | Legacy Grade Mirror Supabase project is inactive |
| Google Cloud product in deployed app | **UNPROVEN** | Cloud Run/Firebase/Vertex paths exist in code; no live deployment evidence |
| Gemini API call in deployed app | **UNPROVEN** | Gemini integration exists in code; no production request/log proof |
| CI quality gate | Ready locally | `npm run verify` and `actionlint` pass; branch is not pushed, so GitHub has not run this workflow yet |
| Test credentials / judge instructions | Missing | Create only against the exact live release; never include secrets in the repo |
| Real users and testimonials | Unverified | Export timestamped, privacy-safe evidence; do not use seed/demo personas as users |
| Real revenue and P&L | Unverified | Export Stripe revenue by month, costs excluding marketing, CAC, and related-party split |
| Production execution logs | Missing | Capture Gemini/GCP request volume, agent traces, failures, and release identifiers |
| Public demo video under 3:00 | Missing | Record only after the live build and evidence below are verified |
| 500–1,000 word narrative | Draft only | Complete with measured figures and links; remove every placeholder |
| Repository credential hygiene | Partial | Current tree scan is clean; old history contains public Supabase/Firebase client identifiers and GitHub secret scanning is disabled |

## 2. Conditional submission checklist

Use this only after the eligibility gate clears.

- [ ] One category selected: Education & Human Potential.
- [ ] Project name, short tagline, thumbnail, team, and contact details finalized.
- [ ] 500–1,000 word description covers the problem, solution, AI-native operation, business viability, category impact, Google Cloud architecture, and measured evidence.
- [ ] Public demo video is **under three minutes**, captioned, and shows the exact deployed release.
- [ ] Public repository URL points to the reviewed commit/tag and includes setup instructions.
- [ ] Live application URL works in a private browser session.
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
- “Auto-finalized” requires persisted `finalized_by = aiTA` or `auto_finalized_at` provenance; confidence alone is not proof.
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

Tonight can produce a reviewed release candidate and a complete evidence map. It cannot honestly produce an eligible submission from this pre-cutoff project, a working production deployment without account access/configuration, or real traction that has not occurred.

- [x] Finish the local `npm run verify` gate.
- [x] Validate GitHub Actions syntax and remove masked deployment failures.
- [x] Smoke-test public routes from a production build with local, non-production configuration.
- [x] Scan the current tree and targeted historical credential patterns; document the remaining public client identifiers.
- [ ] Send the organizer eligibility question.
- [ ] Decide whether to seek a ruling, pivot to a genuinely new eligible project, or ship aiTA outside this competition.
- [ ] If continuing: provision Google Cloud/Firebase, activate a backend, configure secrets, deploy, and re-run the release gate against the live URLs.
- [ ] Only then collect real evidence, record the video, finish the narrative, and submit.
