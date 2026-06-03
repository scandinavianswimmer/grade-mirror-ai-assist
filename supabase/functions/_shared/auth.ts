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

// Gate for service-role / cron-only functions. Requires the shared CRON_SECRET header.
export function requireCronSecret(req: Request): void {
  const provided = req.headers.get("x-cron-secret") ?? "";
  if (!provided || provided !== ENV.cronSecret()) {
    throw new AppError(403, "auth", "Forbidden: invalid cron secret");
  }
}
