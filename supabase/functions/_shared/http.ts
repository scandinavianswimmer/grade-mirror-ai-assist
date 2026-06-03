// Typed JSON responses + a structured AppError so functions fail loud, never silent.
import { corsHeaders } from "./cors.ts";

export class AppError extends Error {
  status: number;
  stage: string;
  constructor(status: number, stage: string, message: string) {
    super(message);
    this.status = status;
    this.stage = stage;
  }
}

export function json(req: Request, status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(req), "Content-Type": "application/json" },
  });
}

export function ok(req: Request, body: unknown): Response {
  return json(req, 200, body);
}

// Wrap a handler so thrown AppErrors become structured JSON and unknown errors become 500s.
export async function withErrors(
  req: Request,
  handler: () => Promise<Response>,
): Promise<Response> {
  try {
    return await handler();
  } catch (err) {
    if (err instanceof AppError) {
      return json(req, err.status, { error: err.message, stage: err.stage });
    }
    console.error("Unhandled error:", err);
    return json(req, 500, { error: "Internal error", stage: "unknown" });
  }
}
