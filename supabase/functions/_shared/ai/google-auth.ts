// Google OAuth2 access-token minting for the Vertex AI backend (additive — only used when Vertex is
// selected; the default generativelanguage path uses API keys and never touches this module).
//
// Two ways to obtain a bearer token, in priority order:
//   1. GOOGLE_OAUTH_TOKEN passthrough — a pre-minted access token (e.g. injected by an external
//      sidecar / `gcloud auth print-access-token`). Simple, no signing; the operator owns refresh.
//   2. GOOGLE_SERVICE_ACCOUNT_JSON — a full service-account key. We sign a JWT (RS256) with the SA
//      private key and exchange it at Google's token endpoint for a cloud-platform access token.
//      The minted token is cached in-isolate until shortly before its expiry.
//
// Web Crypto (crypto.subtle) does the RS256 signing — no third-party crypto dependency.

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const SCOPE = "https://www.googleapis.com/auth/cloud-platform";
// Mint a 1-hour token (Google's max for the JWT-bearer grant).
const TOKEN_LIFETIME_SECONDS = 3600;
// Refresh this many ms before the real expiry so an in-flight call never races a just-expired token.
const EXPIRY_SKEW_MS = 60_000;

interface ServiceAccount {
  client_email: string;
  private_key: string;
  token_uri?: string;
}

interface CachedToken {
  token: string;
  expiresAtMs: number;
}

// In-isolate token cache. Persists across grade requests within a warm function instance; refreshed
// lazily once it nears expiry. A recycled isolate simply re-mints on the next call.
let cached: CachedToken | null = null;
// Serialize concurrent mints so a burst of grades doesn't fire N token exchanges at once.
let inFlight: Promise<string> | null = null;

function base64UrlEncode(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlEncodeJson(obj: Record<string, unknown>): string {
  return base64UrlEncode(new TextEncoder().encode(JSON.stringify(obj)));
}

// Decode a PEM PKCS#8 private key ("-----BEGIN PRIVATE KEY-----…") into raw DER bytes.
function pemToDer(pem: string): ArrayBuffer {
  const body = pem
    .replace(/-----BEGIN [^-]+-----/g, "")
    .replace(/-----END [^-]+-----/g, "")
    .replace(/\s+/g, "");
  const der = atob(body);
  const bytes = new Uint8Array(der.length);
  for (let i = 0; i < der.length; i++) bytes[i] = der.charCodeAt(i);
  return bytes.buffer;
}

async function importPrivateKey(pem: string): Promise<CryptoKey> {
  return await crypto.subtle.importKey(
    "pkcs8",
    pemToDer(pem),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );
}

function parseServiceAccount(raw: string): ServiceAccount {
  let sa: ServiceAccount;
  try {
    sa = JSON.parse(raw) as ServiceAccount;
  } catch {
    throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON is not valid JSON");
  }
  if (!sa.client_email || !sa.private_key) {
    throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON missing client_email or private_key");
  }
  // Secrets stored via `supabase secrets set` often arrive with escaped newlines in the PEM.
  sa.private_key = sa.private_key.replace(/\\n/g, "\n");
  return sa;
}

// Sign the OAuth2 JWT assertion (RS256) for the service account.
async function signAssertion(sa: ServiceAccount): Promise<string> {
  const nowSec = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const claims = {
    iss: sa.client_email,
    scope: SCOPE,
    aud: sa.token_uri ?? TOKEN_URL,
    iat: nowSec,
    exp: nowSec + TOKEN_LIFETIME_SECONDS,
  };
  const unsigned = `${base64UrlEncodeJson(header)}.${base64UrlEncodeJson(claims)}`;
  const key = await importPrivateKey(sa.private_key);
  const sig = await crypto.subtle.sign(
    { name: "RSASSA-PKCS1-v1_5" },
    key,
    new TextEncoder().encode(unsigned),
  );
  return `${unsigned}.${base64UrlEncode(new Uint8Array(sig))}`;
}

// Exchange a signed JWT assertion for an access token at Google's token endpoint.
async function exchangeAssertion(sa: ServiceAccount, assertion: string): Promise<CachedToken> {
  const res = await fetch(sa.token_uri ?? TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Google token exchange failed HTTP ${res.status}: ${txt.slice(0, 200)}`);
  }
  const data = (await res.json()) as { access_token?: string; expires_in?: number };
  if (!data.access_token) throw new Error("Google token exchange returned no access_token");
  const lifetime = (data.expires_in ?? TOKEN_LIFETIME_SECONDS) * 1000;
  return { token: data.access_token, expiresAtMs: Date.now() + lifetime };
}

async function mintFromServiceAccount(raw: string): Promise<string> {
  const sa = parseServiceAccount(raw);
  const assertion = await signAssertion(sa);
  const fresh = await exchangeAssertion(sa, assertion);
  cached = fresh;
  return fresh.token;
}

// Returns a valid OAuth2 bearer token for Vertex AI, or null if no Google credential is configured
// (signals the caller to stay on the default API-key path). Caches the minted token by expiry.
export async function getGoogleAccessToken(): Promise<string | null> {
  // 1. Passthrough token wins when set — operator manages its lifecycle externally.
  const passthrough = Deno.env.get("GOOGLE_OAUTH_TOKEN");
  if (passthrough) return passthrough;

  const saJson = Deno.env.get("GOOGLE_SERVICE_ACCOUNT_JSON");
  if (!saJson) return null;

  // 2. Serve a still-valid cached token.
  if (cached && cached.expiresAtMs - EXPIRY_SKEW_MS > Date.now()) return cached.token;

  // 3. Coalesce concurrent mints into a single token exchange.
  if (!inFlight) {
    inFlight = mintFromServiceAccount(saJson).finally(() => {
      inFlight = null;
    });
  }
  return await inFlight;
}

// Whether a Google OAuth credential (passthrough or service account) is present.
export function hasGoogleCredential(): boolean {
  return Boolean(Deno.env.get("GOOGLE_OAUTH_TOKEN") || Deno.env.get("GOOGLE_SERVICE_ACCOUNT_JSON"));
}
