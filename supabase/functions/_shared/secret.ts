// Pure secret-comparison helpers shared by Edge Function auth boundaries.
// Keep this module runtime-agnostic so the empty-secret invariant stays unit-testable.
export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export function matchesConfiguredSecret(
  provided: string,
  configured: string | undefined,
): configured is string {
  return typeof configured === "string" &&
    configured.length > 0 &&
    timingSafeEqual(provided, configured);
}
