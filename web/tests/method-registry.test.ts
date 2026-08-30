import { describe, it, expect } from "vitest";
import {
  DEFAULT_METHOD_ID,
  METHODS,
  getMethod,
  listMethods,
  normalizeMethodId,
} from "@/lib/methods/registry";
import { calculateScores, getDominantCode } from "@/lib/riasec/engine";
import { QUESTIONS } from "@/data/seed";
import type { AssessmentAnswer } from "@/lib/riasec/types";
import type { MethodAnswer } from "@/lib/methods/types";

describe("method registry", () => {
  it("contains RIASEC, CHASIDE, TIPOV, CIPR and MAGDALENA", () => {
    const ids = listMethods().map((m) => m.id).sort();
    expect(ids).toEqual(["CHASIDE", "CIPR", "MAGDALENA", "RIASEC", "TIPOV"]);
    expect(METHODS.RIASEC).toBeDefined();
    expect(METHODS.CHASIDE).toBeDefined();
    expect(METHODS.TIPOV).toBeDefined();
    expect(METHODS.CIPR).toBeDefined();
    expect(METHODS.MAGDALENA).toBeDefined();
  });

  it("uses RIASEC as the default method", () => {
    expect(DEFAULT_METHOD_ID).toBe("RIASEC");
  });

  it("exposes each method with dimensions, questions, scale and score()", () => {
    for (const method of listMethods()) {
      expect(method.dimensions.length).toBeGreaterThan(0);
      expect(method.questions.length).toBeGreaterThan(0);
      expect(method.scale.options.length).toBeGreaterThan(0);
      expect(typeof method.score).toBe("function");
    }
    expect(getMethod("RIASEC").questions).toHaveLength(60);
    expect(getMethod("CHASIDE").questions).toHaveLength(98);
    expect(getMethod("TIPOV").questions).toHaveLength(66);
    expect(getMethod("CIPR").questions).toHaveLength(114);
    expect(getMethod("MAGDALENA").questions).toHaveLength(120);
  });

  it("normalizeMethodId falls back to RIASEC for unknown/absent input", () => {
    expect(normalizeMethodId("CHASIDE")).toBe("CHASIDE");
    expect(normalizeMethodId("tipov")).toBe("TIPOV");
    expect(normalizeMethodId("cipr")).toBe("CIPR");
    expect(normalizeMethodId("magdalena")).toBe("MAGDALENA");
    expect(normalizeMethodId("riasec")).toBe("RIASEC");
    expect(normalizeMethodId("unknown")).toBe("RIASEC");
    expect(normalizeMethodId(undefined)).toBe("RIASEC");
    expect(normalizeMethodId(null)).toBe("RIASEC");
    expect(normalizeMethodId(42)).toBe("RIASEC");
  });

  it("RIASEC adapter reproduces the same dimension values as calculateScores", () => {
    // Craft a varied answer set across the 60 RIASEC items.
    const methodAnswers: MethodAnswer[] = QUESTIONS.map((q, index) => ({
      questionId: q.id,
      value: (index % 5) + 1, // 1..5
    }));

    const answerMap = new Map<number, AssessmentAnswer>();
    for (const q of QUESTIONS) {
      const ma = methodAnswers.find((a) => a.questionId === q.id)!;
      answerMap.set(q.id, {
        questionId: q.id,
        dimension: q.dimension,
        score: ma.value,
        timeSpentMs: 3000,
      });
    }
    const expectedScores = calculateScores(answerMap, QUESTIONS);
    const expectedDominant = getDominantCode(expectedScores, 3);

    const result = getMethod("RIASEC").score(methodAnswers);

    const byCode = new Map(result.dimensionScores.map((d) => [d.code, d.value]));
    expect(byCode.get("R")).toBeCloseTo(expectedScores.r, 10);
    expect(byCode.get("I")).toBeCloseTo(expectedScores.i, 10);
    expect(byCode.get("A")).toBeCloseTo(expectedScores.a, 10);
    expect(byCode.get("S")).toBeCloseTo(expectedScores.s, 10);
    expect(byCode.get("E")).toBeCloseTo(expectedScores.e, 10);
    expect(byCode.get("C")).toBeCloseTo(expectedScores.c, 10);
    expect(result.dominantSummary).toBe(expectedDominant);

    // The raw payload carries PsychometricScores for RIASEC persistence.
    const raw = result.raw as { scores: typeof expectedScores };
    expect(raw.scores).toEqual(expectedScores);
  });
});
