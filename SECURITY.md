# Security Policy

We take the security and privacy of student data seriously. If you discover a vulnerability, please report it responsibly.

## Reporting a vulnerability

- **Email:** security@example.com _(placeholder — replace with a real contact before launch)_
- Please include steps to reproduce, affected components, and any relevant logs.
- Do **not** open a public issue for security reports, and do not share details publicly until a fix is released.

We aim to acknowledge reports promptly and will keep you updated on remediation progress.

## Secrets

Secrets are **never committed** to this repository. They are managed via **Supabase function secrets** and (post-migration) **Google Cloud Secret Manager**. Only public, client-safe values belong in `.env` (see `.env.example`).
