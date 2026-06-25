// Pure backend-selection + endpoint-construction logic for the Gemini client.
//
// Extracted from gemini.ts so the decision rules can be unit-tested under vitest WITHOUT importing
// the Deno-only transport (ratelimit.ts / Deno.env / fetch). These functions take plain values and
// return plain values — no globals, no I/O, no Deno APIs — so they run unchanged in Node.
//
// Two backends share the identical generateContent request/response JSON shape; only the endpoint
// URL and the auth mode differ:
//   - "studio"  (DEFAULT): generativelanguage.googleapis.com + per-request ?key= API-key rotation.
//   - "vertex"           : {region}-aiplatform.googleapis.com  + OAuth2 Bearer service-account token.

export const STUDIO_BASE = "https://generativelanguage.googleapis.com/v1beta/models";

export type GeminiBackend = "studio" | "vertex";
export type AuthMode = "api-key" | "bearer";

// Inputs to the backend decision, gathered from ENV by the caller (kept Deno-free here on purpose).
export interface BackendSelectionInput {
  // GEMINI_BACKEND, lower-cased/trimmed. "vertex" requests the Vertex transport.
  geminiBackend: string;
  // VERTEX_AI boolean toggle (either this OR geminiBackend==="vertex" requests Vertex).
  vertexAiEnabled: boolean;
  // VERTEX_PROJECT — required for the Vertex endpoint.
  vertexProject: string;
  // VERTEX_LOCATION — required for the Vertex endpoint (region).
  vertexLocation: string;
  // Whether a Google OAuth credential (passthrough token or service account) is configured.
  hasGoogleCredential: boolean;
}

// Vertex is selected ONLY when it is explicitly asked for AND every prerequisite is present:
// a project, a location, and a usable Google credential. Missing ANY prerequisite ⇒ false ⇒ the
// caller stays on the default studio API-key path, so the flag can be flipped on before the GCP
// config is complete without breaking grading. Default (nothing set) ⇒ false ⇒ studio.
export function selectVertex(i: BackendSelectionInput): boolean {
  const wantsVertex = i.geminiBackend === "vertex" || i.vertexAiEnabled;
  if (!wantsVertex) return false;
  return Boolean(i.vertexProject && i.vertexLocation && i.hasGoogleCredential);
}

// Convenience: the resolved backend name.
export function resolveBackend(i: BackendSelectionInput): GeminiBackend {
  return selectVertex(i) ? "vertex" : "studio";
}

// The auth mode each backend uses. Studio authenticates with a URL ?key=; Vertex with a Bearer token.
export function authModeFor(backend: GeminiBackend): AuthMode {
  return backend === "vertex" ? "bearer" : "api-key";
}

// Build the Vertex regional generateContent endpoint for a model. Shape (confirmed against current
// Vertex AI REST docs):
//   https://{location}-aiplatform.googleapis.com/v1/projects/{project}/locations/{location}/publishers/google/models/{model}:generateContent
export function vertexEndpointUrl(project: string, location: string, modelId: string): string {
  return `https://${location}-aiplatform.googleapis.com/v1/projects/${project}/locations/${location}/publishers/google/models/${modelId}:generateContent`;
}

// Build the Studio (generativelanguage) generateContent endpoint for a model + API key. This is the
// EXISTING default path's URL, factored out so tests can assert it stays byte-for-byte unchanged.
export function studioEndpointUrl(modelId: string, apiKey: string): string {
  return `${STUDIO_BASE}/${modelId}:generateContent?key=${apiKey}`;
}
