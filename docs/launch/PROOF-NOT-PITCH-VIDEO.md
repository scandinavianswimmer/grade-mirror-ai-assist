# “Proof, Not Pitch” submission video

Target runtime: **2:40**. Hard rule: the published video must remain under three minutes and be
viewable while signed out on YouTube, Vimeo, or Youku.

This is a filming plan, not evidence. Do not record the final cut until the protected release,
production Gemini/Google Cloud path, judge credentials, and exact release identifiers pass the
acceptance journey. A fixture or local run may be labeled as such, but it cannot stand in for a
production claim.

## Story spine

The video answers the same four questions as Judge Mode:

1. Does the draft follow the assignment and rubric?
2. Can it point to evidence in the paper?
3. Does it stop when the work should not be graded?
4. Can the teacher revise every margin note before approval?

The creative rule is simple: **show the decision, then show its receipt**. Keep brand animation under
two seconds. Use live product footage for the core workflow, not a narrated slideshow.

## Timed script

| Time | Picture | Narration | Evidence gate / burned-in caption |
|---|---|---|---|
| 0:00–0:12 | Founder on camera or voice over the clearly labeled fictional essay stack. | “Mr Selby was the kind of teacher who made the assignment, the margin note, and the grade feel like parts of the same lesson. This product is named for that standard.” | Use only if this wording is personally accurate. Caption every spoken word. |
| 0:12–0:25 | `mrselby.app/judge`; all four Teacher's Test questions visible. | “Mr Selby makes the first pass through an essay stack. The teacher still makes the consequential decisions. Here are the four things that have to be true.” | Caption: `FICTIONAL DEMO WORK · NO REAL STUDENT DATA`. |
| 0:25–0:43 | Sign in to the disposable judge account and open `The Beacon Ledger`. Show the visible synthetic marker. | “This is an original synthetic assignment and five fictional responses. Nothing here belongs to a real student or school.” | Judge account must work in a clean browser. Never show credentials. |
| 0:43–1:08 | Run the strong response in the live protected product. Keep the assignment, rubric, and response visible while the request completes. | “This is the core day-to-day service operation. The first question is whether the draft follows this assignment and this rubric—not a generic prompt.” | Show the exact deployed URL and identify the production agent/key decision. If the production request is not successful, stop filming. |
| 1:08–1:28 | Reveal criterion evidence and two anchored passages. Open the production workflow/trace disclosure. | “The draft points back to the paper. This passage supports the claim about uncertainty; this one supports responsibility that continues after a success.” | Burn in privacy-safe `[MODEL]`, `[GOOGLE_CLOUD_SERVICE]`, `[TRACE_LOCATOR]`, `[UTC]` only when reconciled to private logs. Otherwise: `Not captured for this release`. |
| 1:28–1:48 | Open the deliberately off-topic response. Show the withheld/no-score state. | “The third test is whether it stops. This response is about organizing a desk, not the assignment. Mr Selby should not manufacture a grade.” | The observed production state must show no proposed score. Do not stage the state with browser tools. |
| 1:48–2:16 | Return to the strong response. Accept one note, edit another, dismiss one if present, approve, then reload. | “The teacher can accept, rewrite, or dismiss the draft. Approval is a teacher decision. After reload, those decisions remain.” | Show save state before reload and the persisted state after reload. If persistence is not proven, show and narrate `Not captured for this release`; do not imply success. |
| 2:16–2:31 | Show one clean evidence card: actual users/sessions, actual or source-verified-zero monthly revenue, total expenses, and marketing spend. | “Business evidence uses the same standard: dated sources, complete denominators, and explicit zeros. No seed account or founder payment is counted as independent traction.” | Every number must map to the private manifest. If a value is missing, show `Not captured for this release`; never animate a placeholder into a number. |
| 2:31–2:40 | Return to the product and close on `mrselby.app`. | “The model makes a careful first pass. The teacher remains responsible for the work.” | End card: `Mr Selby · mrselby.app · Education & Human Potential`. |

## Capture list

- Clean-browser load of `mrselby.app`, `/judge`, and the protected judge journey
- Synthetic-data marker and assignment/rubric
- Strong response before, during, and after the production run
- Two exact evidence anchors
- Privacy-safe production trace disclosure
- The real day-to-day AI business operation, key decision, and human escalation point
- Off-topic response with no proposed score
- Accept, edit, dismiss, approve, save, and post-reload states
- Evidence card using actual or source-verified-zero business/user values
- Final release SHA, CI run, Worker/deployed version, and live URL

## Caption and accessibility checklist

- [ ] English captions match the final narration word for word.
- [ ] Important product state is narrated, not communicated by color or cursor movement alone.
- [ ] On-screen evidence text remains readable at 720p and is held long enough to inspect.
- [ ] Cursor movement is calm and keyboard focus is visible.
- [ ] No rapid flashes, decorative motion, or background music that competes with speech.
- [ ] A plain-text transcript accompanies the final evidence pack.
- [ ] Speaker, product, and synthetic-data context are clear without audio.

## Evidence safety gate

Before upload, review the video frame by frame and remove:

- credentials, browser autofill, email addresses, account or project identifiers not approved for
  publication;
- real student work, school names, customer details, or private correspondence;
- API keys, request headers, raw logs, storage paths, or dashboard URLs containing secrets;
- unlicensed music, third-party passages, third-party logos used as decoration, or unsupported claims;
- seed/demo personas described as customers; and
- model, Google Cloud, trace, user, revenue, time-saving, or persistence claims that do not match the
  exact final release evidence.

Upload to YouTube, Vimeo, or Youku early enough to verify captions, public visibility, signed-out
playback, resolution, and final runtime before entering the URL in Devpost.
