# Mr Selby “Teacher's Desk” design specification

**Status:** Approved by Luke on 2026-08-01
**Release goal:** A coherent, recognizable teacher product and an honest XPRIZE judge path for `mrselby.app`

## Product thesis

Mr Selby makes the first pass through an essay stack without taking the teacher's judgment out of the work. It drafts rubric scores and margin notes from the assignment, rubric, and student paper. The teacher reviews, revises, and approves the result.

The product should feel like a calm teacher's desk: familiar enough to a Canvas, Classroom, or Gradescope user that the workflow is immediately legible, but warmer and more manuscript-centered than an institutional LMS.

## Approved direction

The approved system combines three voices without mixing their jobs:

- **Faculty-room plainspoken** on the public site: concrete workload language, no startup abstractions.
- **Teacher's Desk** in the product: familiar teacher nouns, queue-first navigation, dense and useful review screens.
- **The Selby standard** only in origin and brand moments: assignment, feedback, and grade should feel like parts of the same lesson.

The visual references generated for this release are:

- Public site: `/Users/lukemladenoff/.codex/generated_images/019fbee8-d842-7d20-8535-6a2b0853a360/exec-b1acf941-73ea-4ad2-bef7-404799dabd97.png`
- Today queue: `/Users/lukemladenoff/.codex/generated_images/019fbee8-d842-7d20-8535-6a2b0853a360/exec-78d72b09-c112-4f9d-b965-959e2dfb4742.png`
- Review cockpit: `/Users/lukemladenoff/.codex/generated_images/019fbee8-d842-7d20-8535-6a2b0853a360/exec-a817c0c2-9909-4860-b035-973a7e45a994.png`

These are visual targets, not pixel-perfect source assets. Existing product behavior and truthful runtime state take precedence over illustrative mock data.

## Information architecture and vocabulary

The signed-in product uses this primary navigation:

| Existing label | Teacher's Desk label | Meaning |
|---|---|---|
| Dashboard | Today | Cross-class queue of work needing attention |
| Grade | To review | Assignment and submission review queue |
| Train | Feedback style | Examples and decisions that shape future drafts |
| Metrics | Progress | Teacher-facing quality and throughput evidence |
| History | Activity | Approved, exported, and recent work |

Supporting nouns are **Classes**, **Assignments**, **Submissions**, **Rubrics**, **Draft feedback**, **Ready for review**, **Needs a closer look**, **Approved**, and **Exported**.

Do not expose judge or operator language in the everyday teacher interface. Model IDs, latency, token counts, agent stages, trace IDs, “on-the-loop,” and AI-native claims belong in Judge Mode only.

## State semantics

The canonical state flow remains:

`uploaded → grading → graded → finalized → exported`

Teacher-facing language is:

| Stored state | Visible language | Release meaning |
|---|---|---|
| uploaded | Ready to draft | Student work is present and readable |
| grading | Drafting feedback… | The first pass is in progress |
| graded | Ready for review | A draft exists; nothing has been released |
| needs_review | Needs a closer look | The scan, evidence, or grading decision needs the teacher |
| grade_error | Draft did not finish | Retry without implying data loss |
| finalized | Approved | Review is complete, but work has not necessarily been delivered |
| exported | Exported | The approved result was exported or shared |

“Return” is reserved for a future, proven student-delivery integration. “Published” is not a synonym for `finalized`.

If a teacher explicitly enables eligible automatic approval, the interface must say **Approved automatically** and **You turned this on**. The public footer must not claim that every output always stays a draft.

## Public experience

The landing page is five purposeful movements rather than a chain of feature cards:

1. **Hero and real product workspace**
   - Heading: “Get through the essay stack without giving away the part that matters.”
   - Support: “Mr Selby drafts rubric scores and margin notes. You review, revise, and approve the work.”
   - Primary action: “Review a sample assignment.”
   - Secondary action: “See a paper in review.”
2. **The first-pass workflow**
   - Add student work → Review drafts → Approve → Export.
3. **Teacher-control proof**
   - Show accept, edit, dismiss, evidence, and deliberate approval in the actual workspace.
4. **The name story**
   - A personal tribute, no invented biography or implied endorsement.
5. **Trust and next step**
   - Plain privacy, accessibility, launch-state, and optional-auto-approval language; one focused call to action.

No invented testimonials, time-saved statistics, customer counts, or production claims appear on the public page.

## Signed-in home: Today

Today opens on a cross-class queue. It answers “What needs my attention?” before it advertises product capability.

Queue groups are derived from real assignment/submission state when available:

- **Needs a closer look**
- **Drafts ready**
- **Keep going**
- **Approved recently**

Each row includes assignment, class, a concrete progress or exception sentence, due/updated context when known, and one direct action. Empty and error states remain useful. The existing synthetic sample remains clearly labeled as fictional.

## Core review cockpit

The core screen holds three stable regions:

1. Submission navigation with search/filter and teacher-facing status.
2. Student manuscript with linked margin notes and accept/edit/dismiss decisions.
3. Rubric/feedback rail with a persistent total, criterion evidence, save state, and approve/export action.

The teacher can always tell:

- which student and assignment are open;
- how far through the stack they are;
- whether changes are saved;
- which draft notes still need a decision;
- what evidence supports a draft;
- whether the result is merely approved or actually exported.

## Feedback style and onboarding

Feedback style replaces “training.” It shows actual examples and teacher decisions. It must not display hard-coded counts, accuracy, time savings, fabricated model history, or generic AI language.

New-user onboarding becomes value-first:

1. Open the clearly labeled fictional sample assignment.
2. Review one drafted paper.
3. Edit or approve a note.
4. Explain that these decisions shape future drafts.
5. Defer optional profile, referral, and research questions.

## Judge Mode: The Teacher's Test

Judge Mode is a separate, clearly labeled evidence surface. It uses fictional student work and asks four questions:

1. Does the draft follow the assignment and rubric?
2. Can it point to evidence in the paper?
3. Does it stop when the work should not be graded?
4. Can the teacher revise every margin note before approval?

Its proof rail may show only facts available from the current release: release SHA, deployed version, Gemini model, Google Cloud service, UTC timestamp, trace/job ID, agent states, persisted result, and reload proof. Missing production evidence is displayed as “Not captured for this release,” never substituted with illustrative values.

The paired synthetic examples are:

- a strong, on-topic response that produces evidence-linked draft feedback;
- an off-topic or unreadable response where grading is withheld and teacher review is required.

## Submission package

The release prepares these judge-facing artifacts:

- `JUDGES.md` with a 90-second route, exact release identity, synthetic-data notice, teacher/AI boundary, architecture, proof links, and known limits;
- a “Proof, Not Pitch” video script under three minutes;
- a Teacher Time Ledger protocol and data sheet with no invented participants or results;
- a three-panel gallery brief for Business Viability, AI-Native Operations, and Category Impact;
- a report-card style evidence map that distinguishes verified, pending, and blocked facts;
- a refreshed private evidence manifest tied to the final shipped commit and Worker version.

## Visual system

Build on the existing Marginalia tokens:

- warm parchment background and paper cards;
- deep ink type;
- pine primary actions and navigation;
- ochre as a restrained annotation/evidence accent;
- Fraunces variable for editorial headings;
- Hanken Grotesk for interface text;
- Spline Sans Mono only for traces and technical evidence;
- 6–10 px radii, 1 px borders, restrained shadows;
- no gradients, glassmorphism, glow, giant pills, pulsing sparkle icons, or decorative bento grids.

## Accessibility and responsive behavior

- Preserve keyboard access, visible focus, skip links, route announcements, heading order, reduced motion, and 44 px touch targets.
- Do not rely on color alone for status.
- Keep text and controls usable at 200% browser zoom and at 320 CSS px.
- On small screens, the review cockpit becomes a document-first stack with explicit tabs for submissions and rubric/feedback; actions remain reachable without horizontal page scrolling.
- All generated or decorative visuals require useful alt text or must be hidden from assistive technology.

## Truth constraints and known release boundary

The public preview can demonstrate the interface with fictional data. It cannot claim a working protected judge account, production Gemini trace, Google Cloud runtime, user study, revenue, or profitability evidence until those artifacts exist for the exact shipped release.

The redesign is complete only when functional tests, the full verification command, browser QA, accessibility QA, and a visual comparison against the three approved concept images pass.
