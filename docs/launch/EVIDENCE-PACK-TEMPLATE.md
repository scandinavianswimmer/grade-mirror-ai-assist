# Private XPRIZE evidence pack template

Do not place real receipts, organizer correspondence, user details, judge credentials,
or unredacted logs in this public repository. Copy this structure into the ignored
`.submission-evidence/` directory and replace every bracketed token with primary evidence
or an explicit zero/not-yet-available statement.

Official requirement source: [Build with Gemini XPRIZE rules](https://xprize.devpost.com/rules).

## Manifest

| Field | Value |
|---|---|
| Evidence cutoff | `[YYYY-MM-DD HH:MM TZ]` |
| Release commit/tag | `[FULL_SHA_AND_TAG]` |
| Public URL | `https://mrselby.app` |
| Cloudflare Worker version | `[WORKER_VERSION]` |
| CI run | `[GITHUB_ACTIONS_RUN_URL]` |
| Backend project | `[REDACTED_PROJECT_LABEL]` |
| Gemini model/path | `[MODEL_AND_GEMINI_OR_VERTEX_PATH]` |

## Recommended private folder layout

```text
.submission-evidence/
├── 00-manifest.md
├── 01-organizer-ruling/
├── 02-release-and-ci/
├── 03-product-running/
├── 04-users/
├── 05-financials/
├── 06-video-and-captions/
└── 07-judge-instructions/
```

## Eligibility and release

- [ ] Complete organizer ruling and every condition are archived privately.
- [ ] Repository history and any reused pre-existing work are described honestly.
- [ ] Release SHA/tag matches the source judges receive.
- [ ] CI export proves the exact release passed the quality gate.
- [ ] Worker/backend deployment exports identify the same release window.

## Product-running evidence

- [ ] Timestamped, redacted Gemini request or trace proves at least one deployed Gemini call.
- [ ] Timestamped Google Cloud dashboard/log proves the named Google Cloud product is live.
- [ ] Screenshots show the judge flow, refusal path, teacher review, and finalization controls.
- [ ] Logs include failures and denominators, not only successful examples.
- [ ] No student data, access tokens, API keys, or private account identifiers are visible.

## Users

| Evidence window | Individual users | High-level breakdown | Consented testimonials |
|---|---:|---|---:|
| `[START]` to `[END]` | `[ACTUAL_OR_0]` | `[ACTUAL_BREAKDOWN_OR_NONE]` | `[ACTUAL_OR_0]` |

Record the source export and exclusion rules. Synthetic/demo accounts are always excluded.

## Financials

| Month (2026) | Arms-length revenue | Related-party revenue | Total expenses | Marketing/CAC spend | Evidence |
|---|---:|---:|---:|---:|---|
| May | `[USD_OR_0]` | `[USD_OR_0]` | `[USD_OR_0]` | `[USD_OR_0]` | `[RECEIPT_OR_EXPORT]` |
| June | `[USD_OR_0]` | `[USD_OR_0]` | `[USD_OR_0]` | `[USD_OR_0]` | `[RECEIPT_OR_EXPORT]` |
| July | `[USD_OR_0]` | `[USD_OR_0]` | `[USD_OR_0]` | `[USD_OR_0]` | `[RECEIPT_OR_EXPORT]` |
| August | `[USD_OR_0]` | `[USD_OR_0]` | `[USD_OR_0]` | `[USD_OR_0]` | `[RECEIPT_OR_EXPORT]` |

Include the `mrselby.app` receipt, hosting/AI costs, contractor or labor expenses required by
the rules, and a short explanation of what each cost covers. A verified zero is valid evidence.

## Video and judge access

- [ ] Public YouTube, Vimeo, or Youku URL is under three minutes and viewable when signed out.
- [ ] Caption file and final transcript match the uploaded cut.
- [ ] Every product shot comes from the tagged release and uses original synthetic content.
- [ ] Judge credentials are delivered only through the private Devpost testing instructions.
- [ ] Free judge access remains available through the end of the judging period.
