# Devpost gallery brief — three proofs, one visual system

Create a dedicated **1500 × 1000 px (3:2)** PNG or JPG for the thumbnail and each gallery panel. Keep
each file below Devpost's 5 MB limit. Do not crop the existing 1200 × 630 social card into the Devpost
thumbnail; compose for 3:2 from the start.

The gallery must work as a silent, evidence-first summary. Use the Teacher's Desk visual system:
parchment, ink, pine, restrained ochre, Fraunces headings, Hanken Grotesk interface copy, thin rules,
small radii, and real product screenshots. No gradients, glow, decorative bento grid, invented
testimonials, or generic AI imagery.

## Thumbnail — The Teacher's Test

**Purpose:** identify the product and give judges a reason to open the entry.

- Heading: `Mr Selby`
- Subheading: `The first pass through the essay stack. The teacher still decides.`
- Visual: real Teacher's Desk review screenshot with a small, readable four-question margin:
  `Follows the rubric · Points to evidence · Stops when it should · Teacher can change it`
- Footer: `Education & Human Potential · mrselby.app`

Do not place user, revenue, time-saving, model, trace, or Google Cloud claims on the thumbnail.

## Panel 1 — Business Viability

**Question answered:** Is this a real, sustainable business?

**Layout:** report-card ledger, not a vanity-metric dashboard.

- Left: plain-language business model and the actual launch offer.
- Right: month-by-month May–August revenue, related-party revenue, total expenses, marketing/CAC
  spend, independent and paying users, and largest-customer concentration.
- Bottom rule: five-year goal and path to profitability, each in one evidenced sentence.

Every number must be actual or a source-verified zero and map to the private P&L/payment evidence. If
the source is not ready, the panel says **Not captured for this release**; it does not show an empty
chart with implied growth.

Suggested caption:

> Actual and source-verified-zero business evidence for the exact submitted release. Related-party
> revenue is separated from arms-length customer revenue.

## Panel 2 — AI-Native Operations

**Question answered:** Is AI live in production and making visible decisions?

**Layout:** strong fictional response on the left; production decision receipt on the right.

- Product screenshot: rubric-grounded draft with two evidence anchors.
- Decision receipt: release SHA, deployed version, Gemini model, Google Cloud service, UTC capture,
  trace/job locator, day-to-day business operation, key decision, human escalation, agent states,
  failures/skips, and final observed disposition.
- Boundary sentence: `The AI drafts and may withhold. The teacher can change the consequential result.`

Use the fictional response only as product content. The decision receipt must come from a real
production run of that fixture on the exact release. If any field is absent, show
**Not captured for this release**.

Suggested caption:

> A privacy-safe production run reconciled to the private execution log. Fixture content is fictional;
> runtime metadata is from the submitted release.

## Panel 3 — Category Impact

**Question answered:** Does this meaningfully improve teacher work while preserving judgment?

**Layout:** the strong/off-topic proof pair plus teacher controls.

- Strong side: evidence-linked draft note with Accept, Edit, and Dismiss visible.
- Off-topic side: `Needs a closer look · No score proposed`.
- Bottom ledger: actual qualifying teacher sessions, actual or absent Teacher Time Ledger result,
  changed/dismissed notes, withholding errors, and failures.

Do not claim student outcomes. Do not convert a fictional interaction into a user or impact result.
If no qualifying teacher session exists, say **Not captured for this release**.

Suggested caption:

> Mr Selby is designed to be useful when the work is gradeable and honest when it is not. Teacher
> impact values appear only when supported by the completed ledger.

## Export and accessibility checklist

- [ ] 1500 × 1000 px, 3:2, under 5 MB per asset.
- [ ] Product screenshots come from the exact final release.
- [ ] Body text remains readable in Devpost's reduced gallery view.
- [ ] Status uses icon and text, not color alone.
- [ ] Each panel has concise alt text and a matching written caption.
- [ ] Contrast meets WCAG AA for text and essential UI graphics.
- [ ] No credentials, private URLs, student data, customer contact details, or raw identifiers.
- [ ] No mock chart, illustrative number, hidden denominator, or unsupported “live” label.
- [ ] Release SHA/deployed version reconcile with `JUDGES.md` and the private manifest.
- [ ] A signed-out reviewer can understand all three panels without the video.

## Source ledger

Before export, record the source for every visible claim:

| Panel | Visible claim | Primary source | Release SHA | Captured at | Redaction owner | Verified by |
|---|---|---|---|---|---|---|
| Thumbnail | Product identity and submitted URL | Final public release | — | — | — | — |
| Business Viability | — | — | — | — | — | — |
| AI-Native Operations | — | — | — | — | — | — |
| Category Impact | — | — | — | — | — | — |
