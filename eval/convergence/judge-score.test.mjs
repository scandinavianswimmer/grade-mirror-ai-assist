import { describe, it, expect } from "vitest";
import {
  JUDGE_RUBRIC_VERSION,
  JUDGE_DIMENSIONS,
  JUDGE_SYSTEM_PROMPT,
  JUDGE_RESPONSE_SCHEMA,
  TOTAL_MAX,
  DIM_MAX,
  buildJudgeUserContent,
  normalizeJudgeResult,
  scoreCandidate,
  aggregateFidelity,
  holdoutComparison,
  fidelityTrajectory,
  evaluateKillCriterion,
  VERDICT,
  makeMockScorer,
  luarAggregateCosine,
  makeStubLuarEmbedder,
  lz77NormalizedDistance,
} from "./judge-score.mjs";

// ── Frozen rubric contract ───────────────────────────────────────────────────────────────────
describe("frozen judge-rubric v1.0 contract (judge-rubric.md is the single source of truth)", () => {
  it("locks the version, 5 dimensions in order, and the 0–100 scale", () => {
    expect(JUDGE_RUBRIC_VERSION).toBe("1.0");
    expect(JUDGE_DIMENSIONS).toEqual([
      "lexical_register",
      "sentence_structure",
      "hedging_directness",
      "praise_critique_tone",
      "formatting_habits",
    ]);
    expect(DIM_MAX).toBe(20);
    expect(TOTAL_MAX).toBe(100);
  });

  it("uses the verbatim frozen judge system prompt (blinded forensic stylometry, voice not correctness)", () => {
    expect(JUDGE_SYSTEM_PROMPT).toContain("blinded forensic stylometry judge");
    expect(JUDGE_SYSTEM_PROMPT).toContain("voice, not correctness");
    expect(JUDGE_SYSTEM_PROMPT).toContain("reserve 18–20");
  });

  it("response schema requires all five dimensions + total + rationale", () => {
    expect(JUDGE_RESPONSE_SCHEMA.required).toEqual(["dimensions", "total", "rationale"]);
    expect(JUDGE_RESPONSE_SCHEMA.properties.dimensions.required).toEqual([...JUDGE_DIMENSIONS]);
  });
});

// ── Prompt assembly + blinding ─────────────────────────────────────────────────────────────────
describe("buildJudgeUserContent — assembles REFERENCE + CANDIDATE, never leaks condition/batch", () => {
  it("embeds every reference sample and the candidate", () => {
    const content = buildJudgeUserContent(["Notice how X.", "Push this further—Y."], "Notice the imagery.");
    expect(content).toContain("REFERENCE SAMPLE 1");
    expect(content).toContain("REFERENCE SAMPLE 2");
    expect(content).toContain("Notice how X.");
    expect(content).toContain("CANDIDATE");
    expect(content).toContain("Notice the imagery.");
    // Blinding: the assembled prompt must not carry condition/batch/teacher labels.
    expect(content.toLowerCase()).not.toContain("with-profile");
    expect(content.toLowerCase()).not.toContain("holdout");
    expect(content.toLowerCase()).not.toContain("batch");
  });

  it("rejects empty reference corpus or empty candidate (boundary validation)", () => {
    expect(() => buildJudgeUserContent([], "x")).toThrow();
    expect(() => buildJudgeUserContent(["ref"], "")).toThrow();
  });
});

// ── normalizeJudgeResult — total is ALWAYS recomputed from the dimensions ────────────────────────
describe("normalizeJudgeResult", () => {
  it("recomputes total from dimensions even when the judge returns a wrong total", () => {
    const out = normalizeJudgeResult({
      dimensions: { lexical_register: 20, sentence_structure: 20, hedging_directness: 20, praise_critique_tone: 20, formatting_habits: 20 },
      total: 3, // deliberately wrong — must be ignored
      rationale: "r",
    });
    expect(out.total).toBe(100);
  });

  it("clamps out-of-range dimension scores to [0,20]", () => {
    const out = normalizeJudgeResult({
      dimensions: { lexical_register: 99, sentence_structure: -5, hedging_directness: 10, praise_critique_tone: 10, formatting_habits: 10 },
    });
    expect(out.dimensions.lexical_register).toBe(20);
    expect(out.dimensions.sentence_structure).toBe(0);
    expect(out.total).toBe(50);
  });

  it("throws when a dimension is missing (fail fast, do not silently zero)", () => {
    expect(() => normalizeJudgeResult({ dimensions: { lexical_register: 10 } })).toThrow(/missing dimension/);
    expect(() => normalizeJudgeResult({})).toThrow(/missing dimensions/);
  });
});

// ── scoreCandidate — averages N runs + reports inter-run SD ──────────────────────────────────────
describe("scoreCandidate (injected scorer; runs averaged per rubric)", () => {
  it("averages the configured number of runs and reports inter-run SD", async () => {
    let call = 0;
    const totals = [40, 60]; // two runs ⇒ mean 50, sample SD ~14.14
    const scorer = async () => {
      const t = totals[call++];
      const per = t / 5;
      return {
        dimensions: {
          lexical_register: per, sentence_structure: per, hedging_directness: per,
          praise_critique_tone: per, formatting_habits: per,
        },
        rationale: "",
      };
    };
    const r = await scoreCandidate(scorer, ["ref"], "cand", 2);
    expect(r.runs).toBe(2);
    expect(r.total).toBeCloseTo(50);
    expect(r.interRunSD).toBeCloseTo(14.142, 1);
  });

  it("a more voice-similar candidate scores higher than a dissimilar one (mock scorer)", async () => {
    const mock = makeMockScorer();
    const refs = [
      "Notice how the imagery builds tension here. Push this further—name the craft move.",
      "Notice how your thesis carries the whole essay. Push this further and explain why.",
    ];
    const similar = "Notice how this detail sets up the contrast. Push this further—anchor it to the text.";
    const different = "wow!!! amazing job!!! perfect!!! great!!! incredible work!!!";
    const sScore = await scoreCandidate(mock, refs, similar, 1);
    const dScore = await scoreCandidate(mock, refs, different, 1);
    expect(sScore.total).toBeGreaterThan(dScore.total);
    expect(sScore.total).toBeLessThanOrEqual(TOTAL_MAX);
  });
});

// ── aggregateFidelity ────────────────────────────────────────────────────────────────────────
describe("aggregateFidelity", () => {
  it("means the totals and per-dimension scores over many candidates", () => {
    const scored = [
      { total: 80, dimensions: { lexical_register: 16, sentence_structure: 16, hedging_directness: 16, praise_critique_tone: 16, formatting_habits: 16 } },
      { total: 60, dimensions: { lexical_register: 12, sentence_structure: 12, hedging_directness: 12, praise_critique_tone: 12, formatting_habits: 12 } },
    ];
    const agg = aggregateFidelity(scored);
    expect(agg.meanTotal).toBe(70);
    expect(agg.dimensions.lexical_register).toBe(14);
    expect(agg.n).toBe(2);
  });
});

// ── holdoutComparison (with-profile vs without-profile) ──────────────────────────────────────────
describe("holdoutComparison — within-teacher specificity control", () => {
  it("positive delta when with-profile fidelity exceeds the holdout", () => {
    const withP = [{ total: 80, dimensions: {} }, { total: 78, dimensions: {} }];
    const without = [{ total: 50, dimensions: {} }, { total: 52, dimensions: {} }];
    const cmp = holdoutComparison(withP, without);
    expect(cmp.delta).toBeCloseTo(28);
    expect(cmp.relativeGainPct).toBeCloseTo((28 / 51) * 100, 1);
  });

  it("negative delta when the profile HURTS held-out fidelity (honest regression)", () => {
    const cmp = holdoutComparison([{ total: 40, dimensions: {} }], [{ total: 60, dimensions: {} }]);
    expect(cmp.delta).toBe(-20);
  });
});

// ── fidelityTrajectory (does with-profile fidelity increase across batches?) ──────────────────────
describe("fidelityTrajectory", () => {
  it("reports the batch-1→N gain and increasing flag", () => {
    const t = fidelityTrajectory([50, 60, 70, 80]);
    expect(t.batchCount).toBe(4);
    expect(t.firstToLastGain).toBe(30);
    expect(t.relativeGainPct).toBeCloseTo(60);
    expect(t.increasing).toBe(true);
  });
  it("needs ≥2 batches", () => {
    expect(fidelityTrajectory([55]).increasing).toBe(false);
    expect(fidelityTrajectory([55]).firstToLastGain).toBeNull();
  });
});

// ── PRE-REGISTERED KILL CRITERION — the decision rule (most-tested logic) ─────────────────────────
describe("evaluateKillCriterion — pre-registered AND-of-two-clauses (judge flat AND LUAR flat ⇒ KILL)", () => {
  const X = 5; // pre-registered LUAR flat threshold (the {X%} brace) — supplied explicitly in tests

  it("PROVEN when the judge shows a significant gain over holdout (regardless of LUAR)", () => {
    const r = evaluateKillCriterion({ judgeSignificantGainOverHoldout: true, luarRelativeGainPct: 0, luarFlatThresholdPct: X });
    expect(r.verdict).toBe(VERDICT.PROVEN);
    expect(r.judgePass).toBe(true);
  });

  it("DISPROVEN (KILL) only when BOTH clauses hold: judge NOT significant AND LUAR flat (< X%)", () => {
    const r = evaluateKillCriterion({ judgeSignificantGainOverHoldout: false, luarRelativeGainPct: 2, luarFlatThresholdPct: X });
    expect(r.verdict).toBe(VERDICT.DISPROVEN);
    expect(r.judgePass).toBe(false);
    expect(r.luarFlat).toBe(true);
  });

  it("INCONCLUSIVE when judge is flat but LUAR is RISING (only one clause holds — not a KILL)", () => {
    const r = evaluateKillCriterion({ judgeSignificantGainOverHoldout: false, luarRelativeGainPct: 12, luarFlatThresholdPct: X });
    expect(r.verdict).toBe(VERDICT.INCONCLUSIVE);
    expect(r.luarFlat).toBe(false);
  });

  it("INCONCLUSIVE (honesty gate) when judge significance is unknown — never a silent PROVEN/DISPROVEN", () => {
    const r = evaluateKillCriterion({ judgeSignificantGainOverHoldout: null, luarRelativeGainPct: 0, luarFlatThresholdPct: X });
    expect(r.verdict).toBe(VERDICT.INCONCLUSIVE);
    expect(r.judgePass).toBeNull();
  });

  it("INCONCLUSIVE when judge is flat but LUAR is not yet wired (can't confirm KILL)", () => {
    const r = evaluateKillCriterion({ judgeSignificantGainOverHoldout: false, luarRelativeGainPct: null, luarFlatThresholdPct: X });
    expect(r.verdict).toBe(VERDICT.INCONCLUSIVE);
    expect(r.luarFlat).toBeNull();
  });

  it("THROWS rather than guess the pre-registered {X} kill threshold (no fabrication)", () => {
    expect(() => evaluateKillCriterion({ judgeSignificantGainOverHoldout: false, luarRelativeGainPct: 0 })).toThrow(/luarFlatThresholdPct is REQUIRED/);
  });

  it("threshold boundary: gain exactly at X is NOT flat (strict <)", () => {
    const r = evaluateKillCriterion({ judgeSignificantGainOverHoldout: false, luarRelativeGainPct: X, luarFlatThresholdPct: X });
    expect(r.luarFlat).toBe(false);
    expect(r.verdict).toBe(VERDICT.INCONCLUSIVE);
  });
});

// ── LUAR corroborator (STUB — real model not wired) ──────────────────────────────────────────────
describe("luarAggregateCosine — pluggable, honest about not being calibrated", () => {
  it("refuses < minSamples (LUAR degrades on short text)", async () => {
    const r = await luarAggregateCosine(makeStubLuarEmbedder(), ["a", "b"], ["x"], { minSamples: 4 });
    expect(r.cosine).toBeNull();
    expect(r.reason).toMatch(/≥4/);
  });

  it("with enough samples returns a cosine but flags it NOT in-domain calibrated", async () => {
    const samples = ["Notice how A.", "Notice how B.", "Push C further.", "Push D further."];
    const r = await luarAggregateCosine(makeStubLuarEmbedder(), samples, samples, { minSamples: 4 });
    expect(r.cosine).toBeGreaterThan(0.9); // identical corpora ⇒ near-1 on the stub
    expect(r.calibrated).toBe(false);
    expect(r.note).toMatch(/wire real LUAR/);
  });

  it("throws if no embedder is injected (none is wired in this env)", async () => {
    await expect(luarAggregateCosine(undefined, ["a", "b", "c", "d"], ["a"], {})).rejects.toThrow(/embedFn/);
  });
});

// ── LZ77 compression-distance corroborator ───────────────────────────────────────────────────────
describe("lz77NormalizedDistance", () => {
  it("is ~0 for identical text and higher for dissimilar text", () => {
    expect(lz77NormalizedDistance("Notice how the imagery builds tension here.", "Notice how the imagery builds tension here.")).toBeLessThan(0.2);
    const same = lz77NormalizedDistance("Notice how the imagery builds tension here.", "Notice how the imagery builds tension here.");
    const diff = lz77NormalizedDistance("Notice how the imagery builds tension here.", "qwerty zxcvbn asdfgh poiuyt mnbvcx lkjhgf");
    expect(diff).toBeGreaterThan(same);
  });
  it("stays in [0,1] and handles empty input", () => {
    expect(lz77NormalizedDistance("", "")).toBe(0);
    const d = lz77NormalizedDistance("abc", "abcabcabc");
    expect(d).toBeGreaterThanOrEqual(0);
    expect(d).toBeLessThanOrEqual(1);
  });
});
