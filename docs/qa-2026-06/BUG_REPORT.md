# BUG REPORT

Audit date: 2026-06-08  
Target: `http://127.0.0.1:8080`  
Evidence folder: `qa-artifacts/`  
Automation: `qa-scripts/audit.mjs`, `qa-scripts/auth-smoke.mjs`

## Route Map

Public routes:
- `/pitch`
- `/pricing`
- `/auth`
- `/auth?mode=signup`
- `/auth/callback`

Protected / app routes:
- `/`, `/dashboard`
- `/create-assignment`
- `/assignment/:id`
- `/submission/:id`
- `/upload-training`
- `/submit-assignment`
- `/training`
- `/lms`
- `/lms/callback`
- `/profile`
- `/billing`
- `/metrics`
- `/history`
- `/pdf/submission/:id`

Fallback route:
- `*`

## Major User Actions Map

- Visitor reviews pitch page, pricing, FAQ, and starts free signup.
- User signs up with email/password or Google.
- User verifies email outside the app.
- Authenticated teacher completes onboarding.
- Teacher creates class.
- Teacher creates assignment.
- Teacher uploads training examples.
- Teacher submits student work.
- Teacher reviews AI grading output and annotations.
- Teacher exports PDF feedback.
- Teacher reviews history and metrics.
- Teacher connects LMS.
- Teacher manages profile, privacy/data, billing, and logout.

---

## BUG-001: Auth Page Was Unreachable From `/auth`

Severity: Critical  
Status: Fixed and retested  
Location: `src/App.tsx`

Steps to Reproduce:
1. Open `/auth`.
2. Open `/auth?mode=signup`.
3. Attempt to reach the full-page auth experience.

Expected Result:
`/auth` renders the real auth page, and `/auth?mode=signup` renders the signup form.

Actual Result:
Before fix, both routes rendered the generic login overlay over a blurred dashboard. Signup mode was ignored.

Root Cause Analysis:
`AppContent` showed `LoginOverlay` for all unauthenticated routes before the router could render `/auth`.

Recommended Fix:
Treat `/auth` as a public route before the login overlay branch.

Screenshot:
Before: `qa-artifacts/route-auth-desktop.png` from initial run.  
After: `qa-artifacts/route-auth-desktop.png` from retest shows `Welcome back`.

---

## BUG-002: Signup Success Leaves User On Same Form With Weak Next-Step Feedback

Severity: High  
Status: Open  
Location: `src/pages/Auth.tsx`

Steps to Reproduce:
1. Open `/auth?mode=signup`.
2. Enter `QA Teacher`, a normal Gmail-style email, and a valid password.
3. Submit the form.

Expected Result:
The app shows a dedicated email-verification state with clear next steps, resend option, and path back to sign in.

Actual Result:
A toast says `Account created / Check your email to verify your account`, but the same signup form remains visible and still appears actionable.

Root Cause Analysis:
The signup flow only fires a toast and does not transition to a verification-pending state.

Recommended Fix:
After successful signup, replace the form with a verification-pending screen and include resend/change-email/sign-in actions.

Screenshot:
`qa-artifacts/auth-valid-signup.png`

---

## BUG-003: Password Reset Flow Is Missing

Severity: High  
Status: Open  
Location: `src/pages/Auth.tsx`, `src/components/LoginOverlay.tsx`

Steps to Reproduce:
1. Open `/auth`.
2. Look for password reset from the login form.

Expected Result:
User can start password reset from login.

Actual Result:
No forgot-password link or reset workflow exists.

Root Cause Analysis:
Auth UI only exposes sign in, sign up, and Google sign-in.

Recommended Fix:
Add a forgot-password view that calls Supabase `resetPasswordForEmail`, shows delivery feedback, and handles reset callback route.

Screenshot:
`qa-artifacts/route-auth-desktop.png`

---

## BUG-004: Marketing Hero H1 Is Hidden Behind Slow Typewriter Text

Severity: Medium  
Status: Open  
Location: `src/pages/Pitch.tsx`, `src/components/TypewriterText.tsx`

Steps to Reproduce:
1. Open `/pitch`.
2. Observe the first viewport immediately after load.

Expected Result:
The main value proposition is readable immediately.

Actual Result:
The H1 initially reads only `You're n`, making the page look broken or unfinished to first-time visitors, screen readers, and impatient users.

Root Cause Analysis:
The hero uses character-by-character typewriter animation for the primary H1.

Recommended Fix:
Render the full H1 text immediately. If animation is desired, animate opacity/position after the complete text is present.

Screenshot:
`qa-artifacts/route-pitch-desktop.png`

---

## BUG-005: Typewriter Component Injected CSS Inside H1

Severity: Medium  
Status: Fixed and retested  
Location: `src/components/TypewriterText.tsx`, `src/index.css`

Steps to Reproduce:
1. Open `/pitch`.
2. Inspect H1 accessible text.

Expected Result:
The H1 accessible name contains only the heading text.

Actual Result:
Before fix, the H1 included keyframe CSS text because a `<style>` tag was rendered inside the heading span.

Root Cause Analysis:
`TypewriterText` used `dangerouslySetInnerHTML` for a style tag inside the component output.

Recommended Fix:
Move keyframes to global CSS and apply animation classes.

Screenshot:
Retest JSON: `qa-artifacts/playwright-audit.json`, `/pitch` H1 is now only `You're n`.

---

## BUG-006: Unknown Routes Show Login Overlay Instead Of 404

Severity: Medium  
Status: Open  
Location: `src/App.tsx`

Steps to Reproduce:
1. Open `/not-real-route` while logged out.
2. Open an encoded suspicious path such as `/%3Cscript%3Ealert(1)%3C/script%3E`.

Expected Result:
Unknown public routes render a not-found page.

Actual Result:
The app shows the login overlay, making users think every bad URL is an auth problem.

Root Cause Analysis:
The unauthenticated overlay branch catches all non-public paths before the router fallback can render.

Recommended Fix:
Define a known protected route allowlist. If unauthenticated path is unknown, render `NotFound`; if known protected, redirect or show auth.

Screenshot:
`qa-artifacts/route-not_real_route-desktop.png`

---

## BUG-007: Protected Routes Leak App Navigation Behind Auth Overlay

Severity: Medium  
Status: Open  
Location: `src/App.tsx`, `src/pages/FreemiumDashboard.tsx`, `src/components/Navbar.tsx`

Steps to Reproduce:
1. Open `/dashboard` or `/billing` logged out.

Expected Result:
User sees a clean sign-in page or redirect with no confusing inactive app chrome.

Actual Result:
Hidden/background app navigation text appears in page extraction and can confuse automation, screen readers, and keyboard users.

Root Cause Analysis:
The app renders `FreemiumDashboard` behind the fixed login overlay instead of routing to a dedicated auth page.

Recommended Fix:
For protected routes, redirect to `/auth?next=<path>` or render only an auth screen.

Screenshot:
`qa-artifacts/route-dashboard-desktop.png`

---

## BUG-008: Critical And High Dependency Vulnerabilities

Severity: Critical  
Status: Open  
Location: `package.json`, `package-lock.json`

Steps to Reproduce:
1. Run `npm audit --json`.

Expected Result:
No critical or high vulnerabilities before production launch.

Actual Result:
25 vulnerabilities: 2 critical, 11 high, 10 moderate, 2 low.

Root Cause Analysis:
Several direct and transitive packages are outdated. Notable high-risk areas:
- `jspdf`: critical PDF injection/path traversal issues.
- `vitest`: critical arbitrary file read/execute issue in UI server.
- `react-router-dom`: high XSS/open redirect advisory.
- `mammoth`: directory traversal advisory in document parsing.

Recommended Fix:
Upgrade vulnerable packages, prioritize direct runtime dependencies used in upload/export paths, then rerun `npm audit` and regression tests.

Screenshot:
N/A. Evidence: `npm audit --json` command output.

---

## BUG-009: Slow Network Shows Generic `Loading...` With No Recovery

Severity: Medium  
Status: Open  
Location: `src/App.tsx`

Steps to Reproduce:
1. Throttle network with a 750ms delay per request.
2. Open `/pricing`.

Expected Result:
Public marketing/pricing pages render useful shell content quickly or show route-specific loading.

Actual Result:
The app shows only `Loading…` at DOMContentLoaded after about 7 seconds.

Root Cause Analysis:
Auth/session initialization and lazy route loading block the public route shell with a generic Suspense fallback.

Recommended Fix:
Short-circuit public routes before auth onboarding checks where possible, and use branded route-level skeletons with timeout/error states.

Screenshot:
`qa-artifacts/slow-pricing-domcontentloaded.png`

---

## BUG-010: Production Build Emits Security And Maintenance Warnings

Severity: Medium  
Status: Open  
Location: build output

Steps to Reproduce:
1. Run `npm run build`.

Expected Result:
Production build completes without security warnings.

Actual Result:
Build warns that Browserslist data is 21 months old and that `bluebird` uses `eval`.

Root Cause Analysis:
Outdated browser data and transitive dependency implementation.

Recommended Fix:
Update Browserslist database and investigate/remediate the dependency path pulling `bluebird`.

Screenshot:
N/A. Evidence: `npm run build` output.

---

## BUG-011: Large Lazy Chunks Will Hurt Slower Users

Severity: Medium  
Status: Open  
Location: build output, PDF/report flows

Steps to Reproduce:
1. Run `npm run build`.
2. Review chunk sizes.

Expected Result:
Large PDF/chart code is split only into workflows that need it and preloaded intentionally.

Actual Result:
Large chunks include `pdf` at 871 KB gzip source size, `charts` at 382 KB, and app `index` at 440 KB.

Root Cause Analysis:
PDF and chart libraries are heavy, and some shared app code remains in broad chunks.

Recommended Fix:
Audit imports, defer PDF/chart libraries until exact user action, and consider route-level prefetch for report/export paths.

Screenshot:
N/A. Evidence: `npm run build` output.

---

## BUG-012: No Full Authenticated Workflow Could Be Completed In This Run

Severity: High  
Status: Open / Blocked by email verification and lack of test credentials
Location: auth/onboarding/dashboard flows

Steps to Reproduce:
1. Create a new email/password account.
2. Attempt to continue into onboarding/dashboard.

Expected Result:
QA can complete signup, verification, onboarding, dashboard, project/report/export/billing paths in a test environment.

Actual Result:
Signup succeeds but requires email verification. No test mailbox, seeded verified user, local Supabase seed, or bypass was available in this environment.

Root Cause Analysis:
The repo does not provide QA credentials or a local e2e auth fixture.

Recommended Fix:
Add a documented QA seed user or local auth bypass for Playwright-only e2e runs. Never enable it in production.

Screenshot:
`qa-artifacts/auth-valid-signup.png`
