import { describe, it, expect } from "vitest";
import {
  computeFalseFinalizeRate,
  wouldAutoFinalize,
  normalizeThreshold,
  formatReport,
  FALSE_FINALIZE_BAR,
  DEFAULT_TOLERANCE,
  MIN_THRESHOLD,
} from "./false-finalize.mjs";

// A clean, eligible pair the teacher left essentially unchanged (true auto-finalize).
const agree = (over = {}) => ({ autoGrade: 90, teacherGrade: 90, confidence: 0.95, ...over });
// An eligible pair the teacher changed well beyond tolerance (false auto-finalize).
const disagree = (over = {}) => ({ autoGrade: 90, teacherGrade: 70, confidence: 0.95, ...over });

describe("wouldAutoFinalize — mirrors the auto-finalize gate's eligibility half", () => {
  it("eligible: graded, no flags, confidence ≥ threshold", () => {
    expect(wouldAutoFinalize({ confidence: 0.9 }, 0.85)).toBe(true);
  });

  it("ineligible below the (clamped) threshold", () => {
    expect(wouldAutoFinalize({ confidence: 0.7 }, 0.85)).toBe(false);
    // A teacher who set 0.2 still cannot make a 0.55 grade eligible — floor is 0.6.
    expect(wouldAutoFinalize({ confidence: 0.55 }, 0.2)).toBe(false);
  });

  it("ineligible on a needs_review disposition", () => {
    expect(wouldAutoFinalize({ confidence: 0.99, disposition: "needs_review" }, 0.85)).toBe(false);
  });

  it.each(["off_topic", "grade_withheld", "possible_injection", "likely_ai_generated", "low_confidence"])(
    "ineligible when carrying the blocking flag %s even at high confidence",
    (flag) => {
      expect(wouldAutoFinalize({ confidence: 0.99, flags: [flag] }, 0.85)).toBe(false);
    },
  );
});

describe("normalizeThreshold — same safe band as the gate", () => {
  it("clamps low to the floor and high to 1; NaN → default", () => {
    expect(normalizeThreshold(0.1)).toBe(MIN_THRESHOLD);
    expect(normalizeThreshold(1.5)).toBe(1);
    expect(normalizeThreshold(NaN)).toBe(0.85);
  });
});

describe("computeFalseFinalizeRate — the holdout false-auto-finalize measure", () => {
  it("is 0 when every eligible auto-grade matched the teacher", () => {
    const r = computeFalseFinalizeRate([agree(), agree(), agree()]);
    expect(r.eligible).toBe(3);
    expect(r.falseFinalizes).toBe(0);
    expect(r.rate).toBe(0);
    expect(r.withinBar).toBe(true);
  });

  it("counts a teacher change beyond tolerance as a false auto-finalize", () => {
    const r = computeFalseFinalizeRate([agree(), disagree()]);
    expect(r.eligible).toBe(2);
    expect(r.falseFinalizes).toBe(1);
    expect(r.rate).toBe(0.5);
    expect(r.withinBar).toBe(false);
    expect(r.offenders).toHaveLength(1);
    expect(r.offenders[0].delta).toBe(20);
  });

  it("does NOT count a change within tolerance (same grade)", () => {
    const r = computeFalseFinalizeRate([{ autoGrade: 90, teacherGrade: 92, confidence: 0.95 }], { tolerance: 2 });
    expect(r.falseFinalizes).toBe(0);
    expect(r.rate).toBe(0);
  });

  it("excludes ineligible pairs (flagged / low-confidence / needs_review) from the denominator", () => {
    const r = computeFalseFinalizeRate([
      agree(), // eligible, matches
      disagree({ flags: ["off_topic"] }), // big diff but NOT eligible → never a false auto-finalize
      disagree({ confidence: 0.5 }), // below floor → ineligible
      disagree({ disposition: "needs_review" }), // exception → ineligible
    ]);
    expect(r.total).toBe(4);
    expect(r.eligible).toBe(1);
    expect(r.falseFinalizes).toBe(0);
    expect(r.rate).toBe(0);
  });

  it("passes the bar at exactly under 5% and fails at exactly 5%", () => {
    // 1 false out of 21 eligible = 4.76% < 5% → PASS
    const pass = computeFalseFinalizeRate([disagree(), ...Array.from({ length: 20 }, () => agree())]);
    expect(pass.eligible).toBe(21);
    expect(pass.rate).toBeLessThan(FALSE_FINALIZE_BAR);
    expect(pass.withinBar).toBe(true);
    // 1 false out of 20 eligible = 5.0% → NOT < 5% → FAIL (bar is strict)
    const fail = computeFalseFinalizeRate([disagree(), ...Array.from({ length: 19 }, () => agree())]);
    expect(fail.eligible).toBe(20);
    expect(fail.rate).toBe(FALSE_FINALIZE_BAR);
    expect(fail.withinBar).toBe(false);
  });

  it("is INCONCLUSIVE (null) when no pair is eligible — can't certify a bar with no evidence", () => {
    const r = computeFalseFinalizeRate([disagree({ flags: ["off_topic"] }), disagree({ confidence: 0.4 })]);
    expect(r.eligible).toBe(0);
    expect(r.rate).toBeNull();
    expect(r.withinBar).toBeNull();
  });

  it("uses the default tolerance when none is given", () => {
    expect(DEFAULT_TOLERANCE).toBe(2);
    // a 3-point change exceeds the default ±2 tolerance
    const r = computeFalseFinalizeRate([{ autoGrade: 90, teacherGrade: 87, confidence: 0.95 }]);
    expect(r.falseFinalizes).toBe(1);
  });

  it("fails fast on malformed pairs (never trust holdout data)", () => {
    expect(() => computeFalseFinalizeRate([{ teacherGrade: 90, confidence: 0.9 }])).toThrow(/autoGrade/);
    expect(() => computeFalseFinalizeRate([{ autoGrade: 90, confidence: 0.9 }])).toThrow(/teacherGrade/);
    expect(() => computeFalseFinalizeRate([{ autoGrade: 90, teacherGrade: 90 }])).toThrow(/confidence/);
    expect(() => computeFalseFinalizeRate("nope")).toThrow(/array/);
  });

  it("renders a report with a PASS/FAIL verdict", () => {
    expect(formatReport(computeFalseFinalizeRate([agree()]))).toMatch(/PASS/);
    expect(formatReport(computeFalseFinalizeRate([disagree()]))).toMatch(/FAIL/);
    expect(formatReport(computeFalseFinalizeRate([]))).toMatch(/INCONCLUSIVE/);
  });
});
