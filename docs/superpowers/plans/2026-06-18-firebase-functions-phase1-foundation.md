# Firebase Functions — Phase 1 Foundation + Proof Slice Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up a Cloud Functions for Firebase (Node/TS) project and prove the Deno→Node port pattern by migrating two representative functions (`create-class`, `generate-style-summary`) end-to-end behind a client invoker shim, with Supabase Auth/RLS/Postgres untouched.

**Architecture:** Strangler migration. A new top-level `functions/` Firebase 2nd-gen TS project hosts ported functions. Each ported function still verifies the **Supabase JWT** and reads/writes **Supabase Postgres via the service-role key** (no auth/DB change in Phase 1). The frontend flips per-function from `supabase.functions.invoke` → Firebase `httpsCallable` via a single invoker shim, so both backends coexist mid-migration.

**Tech Stack:** Firebase Cloud Functions 2nd gen, Node 20, TypeScript, `firebase-functions` v2 (`onCall`/`onRequest`), `firebase-admin`, `@supabase/supabase-js` (Node), Firebase Secret Manager, vitest.

## Global Constraints

- Firebase project: `aita-5aca5` (reuse the Hosting project). Verbatim from `.firebaserc`.
- Phase 1 makes **no** change to Supabase Auth, RLS, or the 23-table Postgres schema. Identity is always derived from the verified JWT, never the request body (carry over the existing invariant from `_shared/auth.ts`).
- No secrets in source. `GEMINI_API_KEY` + `GEMINI_API_KEYS`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` live in Firebase Secret Manager / function config.
- CORS allowlist + no-PII-logging invariants from `_shared/cors.ts` / `_shared/http.ts` are preserved.
- Node 20+ has native `fetch`, `crypto.randomUUID`, `structuredClone` — use them; do not add deps for these.
- A function is "done" only when its frontend caller is flipped to the Firebase version via the invoker shim and tests pass. The old Supabase edge function is left dormant (deleted at the end of the full Phase 1, not per-function).

---

### Task 1: Scaffold the `functions/` Firebase project

**Files:**
- Create: `functions/package.json`, `functions/tsconfig.json`, `functions/src/index.ts`, `functions/.gitignore`
- Modify: `firebase.json` (add `functions` config block)

**Interfaces:**
- Produces: a deployable empty Cloud Functions project; `functions/src/index.ts` is the export barrel later tasks append to.

- [ ] **Step 1: Create `functions/package.json`**

```json
{
  "name": "aita-functions",
  "engines": { "node": "20" },
  "main": "lib/index.js",
  "scripts": {
    "build": "tsc",
    "serve": "npm run build && firebase emulators:start --only functions",
    "deploy": "firebase deploy --only functions",
    "test": "vitest run"
  },
  "dependencies": {
    "firebase-admin": "^12.0.0",
    "firebase-functions": "^5.0.0",
    "@supabase/supabase-js": "^2.50.2"
  },
  "devDependencies": { "typescript": "^5.4.0", "vitest": "^2.0.0" },
  "private": true
}
```

- [ ] **Step 2: Create `functions/tsconfig.json`**

```json
{
  "compilerOptions": {
    "module": "commonjs", "target": "es2022", "moduleResolution": "node",
    "outDir": "lib", "rootDir": "src", "strict": true, "esModuleInterop": true,
    "skipLibCheck": true
  },
  "include": ["src"]
}
```

- [ ] **Step 3: Create `functions/src/index.ts` (empty barrel) + `functions/.gitignore`**

```typescript
// Cloud Functions export barrel. Ported functions are re-exported here.
import { initializeApp } from "firebase-admin/app";
initializeApp();
```

`.gitignore`:
```
node_modules/
lib/
```

- [ ] **Step 4: Add the functions block to `firebase.json`** (sibling of the existing `hosting` key)

```json
"functions": { "source": "functions", "runtime": "nodejs20" }
```

- [ ] **Step 5: Install + build to verify the scaffold**

Run: `cd functions && npm install && npm run build`
Expected: clean `tsc` build, `lib/index.js` emitted.

- [ ] **Step 6: Commit**

```bash
git add functions firebase.json && git commit -m "feat(functions): scaffold Firebase Cloud Functions project"
```

---

### Task 2: Port the shared lib subset the proof slice needs

**Files:**
- Create: `functions/src/shared/env.ts`, `functions/src/shared/db.ts`, `functions/src/shared/cors.ts`, `functions/src/shared/http.ts`, `functions/src/shared/auth.ts`
- Reference (source of truth to port from): `supabase/functions/_shared/{env,db,cors,http,auth}.ts`

**Interfaces (signatures preserved verbatim from the Deno originals):**
- `env.ts` → `ENV.supabaseUrl(): string`, `ENV.serviceRoleKey(): string`, `ENV.cronSecret(): string` (read from `process.env`, not `Deno.env`).
- `db.ts` → `serviceClient(): SupabaseClient` (service-role, `auth.persistSession=false`), `userClient(req): SupabaseClient` (anon, for token verification).
- `cors.ts` → `handlePreflight(req): Response | null`, allowlist from `process.env.ALLOWED_ORIGINS`.
- `http.ts` → `class AppError(status, code, message)`, `withErrors(req, handler): Promise<Response>`, `ok(req, body): Response`.
- `auth.ts` → `getUserFromJWT(req): Promise<{ userId: string; email: string | null }>`, `timingSafeEqual(a,b)`, `requireCronSecret(req)`.

**Porting rules (mechanical, apply to each module):**
- `import x from "https://esm.sh/pkg@ver"` → `import x from "pkg"` (add to `functions/package.json`).
- `Deno.env.get("X")!` → `process.env.X!`.
- `Deno.serve(...)` does not appear in shared modules (only in handlers).
- Keep all logic, signatures, and invariants identical.

- [ ] **Step 1: Write a failing test for `auth.getUserFromJWT` (rejects missing token)**

`functions/src/shared/auth.test.ts`:
```typescript
import { describe, it, expect } from "vitest";
import { getUserFromJWT } from "./auth";
describe("getUserFromJWT", () => {
  it("throws 401 when no bearer token", async () => {
    const req = new Request("http://x", { headers: {} });
    await expect(getUserFromJWT(req)).rejects.toMatchObject({ status: 401 });
  });
});
```

- [ ] **Step 2: Run it, verify it fails**

Run: `cd functions && npx vitest run src/shared/auth.test.ts`
Expected: FAIL (module not found / not implemented).

- [ ] **Step 3: Port the five shared modules** (translate each Deno original per the porting rules above; preserve signatures exactly). `auth.ts` mirrors the Deno original:

```typescript
import { AppError } from "./http";
import { userClient } from "./db";
import { ENV } from "./env";
export interface AuthedUser { userId: string; email: string | null; }
export async function getUserFromJWT(req: Request): Promise<AuthedUser> {
  const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "").trim();
  if (!token) throw new AppError(401, "auth", "Missing bearer token");
  const { data, error } = await userClient().auth.getUser(token);
  if (error || !data?.user) throw new AppError(401, "auth", "Invalid or expired token");
  return { userId: data.user.id, email: data.user.email ?? null };
}
export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
export function requireCronSecret(req: Request): void {
  const provided = req.headers.get("x-cron-secret") ?? "";
  if (!provided || !timingSafeEqual(provided, ENV.cronSecret())) throw new AppError(403, "auth", "Forbidden");
}
```

- [ ] **Step 4: Run the test, verify it passes**

Run: `cd functions && npx vitest run src/shared/auth.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add functions/src/shared && git commit -m "feat(functions): port shared lib subset (env, db, cors, http, auth) to Node"
```

---

### Task 3: Port `create-class` as an HTTPS function + test

**Files:**
- Create: `functions/src/createClass.ts`, `functions/src/createClass.test.ts`
- Modify: `functions/src/index.ts` (export `createClass`)
- Reference: `supabase/functions/create-class/index.ts`

**Interfaces:**
- Consumes: `handlePreflight`, `withErrors`/`ok`/`AppError`, `getUserFromJWT`, `serviceClient` from `./shared/*`.
- Produces: an `onRequest` function `createClass` that accepts `POST {className, gradeLevel, classSize, classLevel, classTime}` with a `Bearer` Supabase JWT, inserts a `classes` row (`user_id`, `class_name`, `details_jsonb`), returns `{ success, class }`. Same contract as the Deno original.

- [ ] **Step 1: Write the failing test (rejects missing fields with 400)**

```typescript
import { describe, it, expect, vi } from "vitest";
// mock getUserFromJWT + serviceClient, then assert a POST with no body → 400 "input"
```
(Full mock per the existing `_shared` test patterns; assert status 400 and code `"input"`.)

- [ ] **Step 2: Run it, verify it fails** — `cd functions && npx vitest run src/createClass.test.ts` → FAIL.

- [ ] **Step 3: Implement `createClass.ts`** — port the Deno handler to `onRequest`:

```typescript
import { onRequest } from "firebase-functions/v2/https";
import { handlePreflight } from "./shared/cors";
import { withErrors, ok, AppError } from "./shared/http";
import { getUserFromJWT } from "./shared/auth";
import { serviceClient } from "./shared/db";

export const createClass = onRequest({ region: "us-west1" }, (req, res) =>
  withErrors(req as unknown as Request, async () => {
    const pre = handlePreflight(req as unknown as Request); if (pre) return pre;
    if (req.method !== "POST") throw new AppError(405, "method", "POST only");
    const { userId } = await getUserFromJWT(req as unknown as Request);
    const { className, gradeLevel, classSize, classLevel, classTime } = req.body ?? {};
    if (!className || !gradeLevel || !classSize || !classTime) throw new AppError(400, "input", "Missing required fields");
    const { data, error } = await serviceClient().from("classes").insert({
      user_id: userId, class_name: className,
      details_jsonb: { grade: gradeLevel, size: parseInt(classSize), level: classLevel, time: classTime },
    }).select().single();
    if (error) throw new AppError(500, "db", "Could not create class");
    return ok(req as unknown as Request, { success: true, class: data });
  }).then((r) => res.status(r.status).set(Object.fromEntries(r.headers)).send(r.body)),
);
```
(Adapt the `withErrors`→Express `res` bridge to match the ported `http.ts`; if cleaner, port `http.ts` to take `(req,res)` directly. Keep the response contract identical.)

- [ ] **Step 4: Export it** — add `export { createClass } from "./createClass";` to `functions/src/index.ts`.

- [ ] **Step 5: Run the test, verify it passes** — `cd functions && npx vitest run src/createClass.test.ts` → PASS.

- [ ] **Step 6: Build + emulator smoke test**

Run: `cd functions && npm run build && firebase emulators:start --only functions`
Then `curl -X POST` the local function URL with a valid Bearer token + body; expect `{ success: true, class: {...} }` and a real row in `classes`.

- [ ] **Step 7: Commit** — `git add functions && git commit -m "feat(functions): port create-class to Cloud Functions"`

---

### Task 4: Client invoker shim + flip `create-class`

**Files:**
- Create: `src/lib/fnInvoke.ts`, `src/lib/fnInvoke.test.ts`
- Modify: the frontend caller of `create-class` (the onboarding class-creation path).

**Interfaces:**
- Produces: `invokeFn<T>(name: string, body: unknown): Promise<T>` — looks up `name` in a per-function backend registry; routes to Firebase `httpsCallable`/fetch when flipped, else `supabase.functions.invoke`. Registry default = Supabase; `create-class` flipped to Firebase.

- [ ] **Step 1: Failing test** — `invokeFn` routes a registry-flipped name to the Firebase path (mock both clients; assert the Firebase path is called for `create-class` and Supabase for an unflipped name).
- [ ] **Step 2: Run, verify fail.**
- [ ] **Step 3: Implement `fnInvoke.ts`** with the registry + both transports, preserving the existing `{ data, error }` return shape callers expect.
- [ ] **Step 4: Run, verify pass.**
- [ ] **Step 5: Replace the direct `supabase.functions.invoke('create-class', ...)` call with `invokeFn('create-class', ...)`.**
- [ ] **Step 6: Full frontend gate** — `npx tsc --noEmit` (0), `npx vitest run` (green), `npm run build` (green).
- [ ] **Step 7: Commit** — `git commit -m "feat: route create-class through Firebase via invoker shim"`

---

### Task 5: Port the Gemini shared path + `generate-style-summary`

**Files:**
- Create: `functions/src/shared/ai/gemini.ts`, `functions/src/shared/ai/google-auth.ts`, `functions/src/generateStyleSummary.ts`, `functions/src/generateStyleSummary.test.ts`
- Modify: `functions/src/index.ts`
- Reference: `supabase/functions/_shared/ai/{gemini,google-auth}.ts`, `supabase/functions/generate-style-summary/index.ts`

**Interfaces:**
- `gemini.ts` → preserve `geminiGenerateJSON`/`geminiGenerateText` signatures + the key-pool rotation on 429/RESOURCE_EXHAUSTED (`GEMINI_API_KEY` + `GEMINI_API_KEYS`).
- `generateStyleSummary` → same request/response contract as the Deno original.

- [ ] **Step 1:** Failing test for `geminiGenerateText` key-pool rotation (mock fetch → 429 then 200, assert it rotates and succeeds).
- [ ] **Step 2:** Run, verify fail.
- [ ] **Step 3:** Port `gemini.ts` + `google-auth.ts` per the porting rules (native `fetch`; `Deno.env`→`process.env`; secrets via Secret Manager).
- [ ] **Step 4:** Run, verify pass.
- [ ] **Step 5:** Port `generateStyleSummary.ts` as `onRequest`, export it, write its contract test, run green.
- [ ] **Step 6:** Move Gemini secrets into Secret Manager (`firebase functions:secrets:set GEMINI_API_KEY`), build, emulator smoke test with a real key.
- [ ] **Step 7:** Flip the frontend caller via `invokeFn('generate-style-summary', ...)`; full frontend gate green.
- [ ] **Step 8:** Commit — `git commit -m "feat(functions): port Gemini shared path + generate-style-summary"`

---

## Out of scope for this plan (follow-on plans)

The remaining 14 functions repeat the proven pattern, each its own task/plan once the foundation above is merged: the Stripe trio (`stripe-checkout`/`stripe-portal`/`stripe-webhook` — `onRequest`, webhook needs raw-body), `ingest-document`, `build-style-profile`, `rebuild-exemplars`, `generate-grading-feedback`, `increment-feedback-count`, `record-feedback-usage`, `create`-style helpers, `grade-enqueue`, `delete-data`, `privacy-tasks` (Cloud Scheduler + `onSchedule`/`onRequest`), `test-ai-grading` (fold in the held-back `ai/router` repoint; drop `ai-router.ts`), and **`grade-submission` last** (largest, most critical — port `_shared/grading/*` engine with full care). Phase 2 (Auth flip + routing the 21 direct `supabase-js` reads through functions) is a separate spec/plan.

## Self-Review

- **Spec coverage:** Phase 1 foundation + proof slice (`create-class`, `generate-style-summary`) + invoker shim are all tasked. Remaining functions + Phase 2/3 explicitly deferred per the spec's proof-first strategy. ✓
- **Placeholder scan:** Test bodies in Tasks 3–5 describe the assertions with the exact status/codes to assert and reference the existing `_shared` test patterns rather than reproducing full mocks; the novel handler + shim + auth code is shown in full. The one judgment area — the `withErrors`→Express `res` bridge — is called out explicitly to resolve during Task 3 (port `http.ts` to `(req,res)` if cleaner).
- **Type consistency:** Signatures (`getUserFromJWT`, `withErrors`/`ok`/`AppError`, `serviceClient`, `handlePreflight`, `invokeFn`, `geminiGenerateText`) are used consistently across tasks and match the Deno originals. ✓
