# aiTA (Grade Mirror) — STATUS

**What it is:** AI teaching-assistant grading app — grades student submissions against the teacher's real prompt + rubric, with a reproducible voice-convergence measurement.

**Current state:** Full production build is **merged to main**. Recent commits land the launch push: paywall wired at grading gates, annual pricing + plan-limit gating, analytics funnel, Firebase Hosting / Cloud Run path, Vertex AI grading, and an M3 GCS storage-adapter sketch. Grading now runs against the teacher's real prompt + rubric and fails closed on missing context. See `HANDOFF.md` and `PHASE-12-NOTES.md`. Remaining work is mostly founder-config-gated (keys, billing, GCS bucket).

**▶ Next action:** Work the founder-config checklist in `HANDOFF.md` — provision the production GCS bucket + Vertex/Firebase keys and flip the paywall live, then smoke-test one real grading run end-to-end against billing.

**Last touched:** 2026-06-03 (production merge); STATUS written 2026-06-08.
