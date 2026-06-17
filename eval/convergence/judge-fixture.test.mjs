import { describe, it, expect } from "vitest";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { parseJudgeFixture } from "./judge-fixture.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function baseFixture() {
  return {
    teacher: "t",
    assignmentPrompt: "Write an essay.",
    rubric: { totalPoints: 100, criteria: [] },
    batches: [
      {
        seq: 1,
        essays: [
          { id: "e1", text: "essay one", reference: [{ comment: "Notice how A." }, { comment: "Push B further." }] },
          { id: "e2", text: "essay two", reference: [{ comment: "Notice how C." }] },
        ],
      },
    ],
    heldOut: {
      essays: [{ id: "h1", text: "held one", reference: [{ comment: "Notice how D." }] }],
    },
  };
}

describe("parseJudgeFixture — boundary validation + corpus extraction", () => {
  it("collects the teacher reference-voice corpus from every reference comment", () => {
    const parsed = parseJudgeFixture(baseFixture(), "base.json");
    expect(parsed.referenceCorpus).toContain("Notice how A.");
    expect(parsed.referenceCorpus).toContain("Push B further.");
    expect(parsed.referenceCorpus).toContain("Notice how D."); // held-out comments count too
    expect(parsed.referenceCorpus.length).toBe(4);
    expect(parsed.batchCount).toBe(1);
    expect(parsed.heldOut[0].id).toBe("h1");
  });

  it("throws when the reference corpus is below the ≥4 floor", () => {
    const fx = baseFixture();
    fx.batches[0].essays = [{ id: "e1", text: "x", reference: [{ comment: "only one" }] }];
    fx.heldOut.essays = [{ id: "h1", text: "y", reference: [] }];
    expect(() => parseJudgeFixture(fx, "thin.json")).toThrow(/need ≥4/);
  });

  it("throws on missing required fields (fail fast)", () => {
    expect(() => parseJudgeFixture({}, "empty.json")).toThrow(/missing teacher/);
    const noHeld = baseFixture();
    delete noHeld.heldOut;
    expect(() => parseJudgeFixture(noHeld, "noheld.json")).toThrow(/heldOut/);
  });

  it("parses the real shipped holes-voice.json fixture", async () => {
    const raw = await readFile(path.join(__dirname, "holes-voice.json"), "utf8");
    const parsed = parseJudgeFixture(JSON.parse(raw), "holes-voice.json");
    expect(parsed.teacher).toBe("ref-holes-teacher");
    expect(parsed.batchCount).toBe(3);
    expect(parsed.referenceCorpus.length).toBeGreaterThanOrEqual(8); // 8–10 sample target met
    expect(parsed.heldOut.length).toBe(2);
  });
});
