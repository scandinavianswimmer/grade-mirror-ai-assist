import { describe, expect, it } from "vitest";

import { matchesConfiguredSecret, timingSafeEqual } from "./secret.ts";

describe("secret comparison", () => {
  it("never authenticates an unset or explicitly empty configured secret", () => {
    expect(matchesConfiguredSecret("", undefined)).toBe(false);
    expect(matchesConfiguredSecret("", "")).toBe(false);
  });

  it("accepts only an exact, non-empty match", () => {
    expect(matchesConfiguredSecret("expected-secret", "expected-secret")).toBe(true);
    expect(matchesConfiguredSecret("wrong-secret", "expected-secret")).toBe(false);
    expect(matchesConfiguredSecret("expected-secret-extra", "expected-secret")).toBe(false);
  });

  it("keeps the underlying equality helper exact", () => {
    expect(timingSafeEqual("same", "same")).toBe(true);
    expect(timingSafeEqual("same", "diff")).toBe(false);
    expect(timingSafeEqual("short", "longer")).toBe(false);
  });
});
