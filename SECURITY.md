# Security Policy

We take the security and privacy of student data seriously. If you discover a vulnerability, please report it responsibly.

## Reporting a vulnerability

- **Pre-launch status:** a private reporting channel is not configured yet. The repository owner must enable GitHub private vulnerability reporting or publish a monitored security address before deployment.
- Please include steps to reproduce, affected components, and any relevant logs.
- Do **not** open a public issue containing exploit details, credentials, student data, or other sensitive information.

We aim to acknowledge reports promptly and will keep you updated on remediation progress.

## Secrets

The current working tree is scanned for secrets before release. Older history contains Supabase anonymous client identifiers and a Firebase browser API key, all intended as public client configuration; the active release no longer supplies fallback values. Restrict or rotate those identifiers where supported before deployment and verify that database row-level security is effective.

Server credentials must be managed through Supabase function secrets or Google Cloud Secret Manager. Only public, client-safe values belong in a local `.env` (see `.env.example`), and `.env` itself must remain untracked.
