// Identity is ALWAYS derived from the verified JWT — never from the request body.
import { AppError } from "./http.ts";
import { userClient } from "./db.ts";
import { ENV } from "./env.ts";

export interface AuthedUser {
  userId: string;
  email: string | null;
}

export async function getUserFromJWT(req: Request): Promise<AuthedUser> {
  const authHeader = req.headers.get("Authorization") ?? "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!token) throw new AppError(401, "auth", "Missing bearer token");

  const { data, error } = await userClient(req).auth.getUser(token);
  if (error || !data?.user) throw new AppError(401, "auth", "Invalid or expired token");
  return { userId: data.user.id, email: data.user.email ?? null };
}

// Constant-time string compare so secret verification can't leak bytes via timing side-channels.
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

// Gate for service-role / cron-only functions. Requires the shared CRON_SECRET header.
export function requireCronSecret(req: Request): void {
  const provided = req.headers.get("x-cron-secret") ?? "";
  if (!provided || !timingSafeEqual(provided, ENV.cronSecret())) {
    throw new AppError(403, "auth", "Forbidden: invalid cron secret");
  }
}
