# Dependency audit — 2026-08-01

Runtime: Node 22.23.1 / npm 10.9.8

## Result

`npm audit` and `npm audit --omit=dev` each report **two high-severity package entries** (`react-router` and the direct `react-router-dom` dependency). Both entries trace to one root advisory: [GHSA-qwww-vcr4-c8h2](https://github.com/advisories/GHSA-qwww-vcr4-c8h2), a CSRF bypass in React Router's unstable React Server Components mode.

The sprint upgraded ESLint/TypeScript-ESLint, Vite, Vitest, the React SWC plugin, Lovable Tagger, Browserslist data, and React Router. This removed the original production advisories affecting declarative navigation and all older Vite/Vitest development-server advisories.

## Reachability assessment

The application imports `BrowserRouter`, `Routes`, and `Route` from `react-router-dom` and builds a client-side Vite SPA. It does not use React Server Components mode, server actions, React Router data actions, `RouterProvider`, or a server-side React Router request handler. The remaining advisory's vulnerable execution path is therefore not reachable in this release.

At audit time, `react-router-dom` 7.18.2 is the latest package available from npm. The advisory names 8.3.0 as the patched React Router line, but `react-router-dom@8.3.0` is not published in the npm registry. A forced upgrade cannot currently resolve the audit entry.

## Release condition

- Do not enable React Router RSC/unstable server-action mode on this dependency line.
- Re-run both audit commands before deployment and upgrade as soon as a compatible patched `react-router-dom` release is published.
- Treat the release as **audited with one non-reachable accepted advisory**, not as “zero vulnerabilities.”
- Revisit this assessment if routing mode, SSR/RSC architecture, or package versions change.
