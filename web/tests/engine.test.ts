import { describe, it, expect } from "vitest";
import {
  calculateScores,
  evaluateQuality,
  matchCareers,
  getDominantCode,
  getDominantDimensions,
  getDominantProfileDescription,
} from "@/lib/riasec/engine";
import { QUESTIONS, CAREERS } from "@/data/seed";
import type { AssessmentAnswer, DimensionCode } from "@/lib/riasec/types";

function buildAnswers(
  entries: Array<{ id: number; score: number; timeSpentMs?: number }>
): Map<number, AssessmentAnswer> {
  const map = new Map<number, AssessmentAnswer>();
  for (const e of entries) {
    const question = QUESTIONS.find((q) => q.id === e.id)!;
    map.set(e.id, {
      questionId: e.id,
      dimension: question.dimension,
      score: e.score,
      timeSpentMs: e.timeSpentMs ?? 3000,
    });
  }
  return map;
}

function idsForDimension(dim: DimensionCode): number[] {
  return QUESTIONS.filter((q) => q.dimension === dim).map((q) => q.id);
}

describe("seed integrity", () => {
  it("contains exactly 60 questions and 16 careers", () => {
    expect(QUESTIONS).toHaveLength(60);
    expect(CAREERS).toHaveLength(16);
  });

  it("has correct mirror pairs (1<->7, 11<->17, 21<->27, 31<->37, 41<->47, 51<->57)", () => {
    const pairs: Array<[number, number]> = [
      [1, 7],
      [11, 17],
      [21, 27],
      [31, 37],
      [41, 47],
      [51, 57],
    ];
    for (const [a, b] of pairs) {
      expect(QUESTIONS.find((q) => q.id === a)?.mirrorPairId).toBe(b);
      expect(QUESTIONS.find((q) => q.id === b)?.mirrorPairId).toBe(a);
    }
  });
});

describe("calculateScores", () => {
  it("returns 100 for a dimension when all answers are 5", () => {
    const rIds = idsForDimension("R");
    const answers = buildAnswers(rIds.map((id) => ({ id, score: 5 })));
    const scores = calculateScores(answers, QUESTIONS);
    expect(scores.r).toBe(100);
  });

  it("returns 0 for a dimension when all answers are 1", () => {
    const rIds = idsForDimension("R");
    const answers = buildAnswers(rIds.map((id) => ({ id, score: 1 })));
    const scores = calculateScores(answers, QUESTIONS);
    expect(scores.r).toBe(0);
  });

  it("computes mixed answers as sum(score-1)/(4*answered)*100", () => {
    // Two R answers: scores 3 and 5 => shifted 2 and 4 => 6 / (4*2) * 100 = 75
    const answers = buildAnswers([
      { id: 1, score: 3 },
      { id: 2, score: 5 },
    ]);
    const scores = calculateScores(answers, QUESTIONS);
    expect(scores.r).toBeCloseTo(75, 5);
  });

  it("returns 0 for dimensions with no answers", () => {
    const scores = calculateScores(new Map(), QUESTIONS);
    expect(scores).toEqual({ r: 0, i: 0, a: 0, s: 0, e: 0, c: 0 });
  });
});

describe("evaluateQuality", () => {
  it("returns Insuficiente for empty answers", () => {
    const q = evaluateQuality(new Map(), QUESTIONS);
    expect(q.isValid).toBe(false);
    expect(q.reliabilityLevel).toBe("Insuficiente");
    expect(q.warningMessage).toBe("No hay suficientes respuestas registradas.");
  });

  it("detects straight-lining at >=15 monotone answers (ratio >= 0.75)", () => {
    const ids = QUESTIONS.slice(0, 16).map((q) => q.id);
    const answers = buildAnswers(ids.map((id) => ({ id, score: 4 })));
    const q = evaluateQuality(answers, QUESTIONS);
    expect(q.straightLiningDetected).toBe(true);
    expect(q.isValid).toBe(false);
    expect(q.warningMessage).toContain("patrón de respuestas monótono");
  });

  it("does NOT flag straight-lining with fewer than 15 answers", () => {
    const ids = QUESTIONS.slice(0, 10).map((q) => q.id);
    const answers = buildAnswers(ids.map((id) => ({ id, score: 4 })));
    const q = evaluateQuality(answers, QUESTIONS);
    expect(q.straightLiningDetected).toBe(false);
  });

  it("triggers the speed trap at avg<1100ms with >=10 timed answers", () => {
    // Use varied scores to avoid straight-lining; 12 answers, all fast.
    const ids = QUESTIONS.slice(0, 12).map((q) => q.id);
    const answers = buildAnswers(
      ids.map((id, idx) => ({ id, score: (idx % 5) + 1, timeSpentMs: 500 }))
    );
    const q = evaluateQuality(answers, QUESTIONS);
    expect(q.speedTrapTriggered).toBe(true);
    expect(q.averageResponseTimeMs).toBe(500);
    expect(q.warningMessage).toContain("muy rápido");
  });

  it("defaults average time to 2500 when there are no valid times", () => {
    const answers = buildAnswers([
      { id: 1, score: 4, timeSpentMs: 0 },
      { id: 2, score: 2, timeSpentMs: 0 },
    ]);
    const q = evaluateQuality(answers, QUESTIONS);
    expect(q.averageResponseTimeMs).toBe(2500);
    expect(q.speedTrapTriggered).toBe(false);
  });

  it("applies mirror-pair penalty +20 when diff>=3 and clamps to [40,100]", () => {
    // All 6 mirror pairs maximally inconsistent (diff = 4) => penalty 120 => clamp 40.
    const answers = buildAnswers([
      { id: 1, score: 5 }, { id: 7, score: 1 },
      { id: 11, score: 5 }, { id: 17, score: 1 },
      { id: 21, score: 5 }, { id: 27, score: 1 },
      { id: 31, score: 5 }, { id: 37, score: 1 },
      { id: 41, score: 5 }, { id: 47, score: 1 },
      { id: 51, score: 5 }, { id: 57, score: 1 },
    ]);
    const q = evaluateQuality(answers, QUESTIONS);
    expect(q.mirrorConsistencyPercent).toBe(40);
    expect(q.reliabilityLevel).toBe("Baja");
  });

  it("applies mirror-pair penalty +10 when diff==2", () => {
    // One pair with diff 2 => penalty 10 => 90.
    const answers = buildAnswers([
      { id: 1, score: 5 },
      { id: 7, score: 3 },
    ]);
    const q = evaluateQuality(answers, QUESTIONS);
    expect(q.mirrorConsistencyPercent).toBe(90);
  });

  it("keeps consistency at 100 (Alta) when mirror pairs agree", () => {
    const answers = buildAnswers([
      { id: 1, score: 4 }, { id: 7, score: 4 },
      { id: 11, score: 3 }, { id: 17, score: 3 },
    ]);
    const q = evaluateQuality(answers, QUESTIONS);
    expect(q.mirrorConsistencyPercent).toBe(100);
    expect(q.reliabilityLevel).toBe("Alta");
  });
});

describe("matchCareers", () => {
  it("returns the full catalog with 'Moderada' at 50% when the user vector is all zero", () => {
    const matches = matchCareers({ r: 0, i: 0, a: 0, s: 0, e: 0, c: 0 }, CAREERS);
    expect(matches).toHaveLength(CAREERS.length);
    expect(matches.every((m) => m.affinityPercentage === 50)).toBe(true);
    expect(matches.every((m) => m.matchLevel === "Moderada")).toBe(true);
  });

  it("produces results sorted descending and clamped to [30,99]", () => {
    const scores = calculateScores(
      buildAnswers(idsForDimension("I").map((id) => ({ id, score: 5 }))),
      QUESTIONS
    );
    const matches = matchCareers(scores, CAREERS);
    for (const m of matches) {
      expect(m.affinityPercentage).toBeGreaterThanOrEqual(30);
      expect(m.affinityPercentage).toBeLessThanOrEqual(99);
    }
    for (let k = 1; k < matches.length; k++) {
      expect(matches[k - 1].affinityPercentage).toBeGreaterThanOrEqual(
        matches[k].affinityPercentage
      );
    }
  });

  it("assigns the correct Spanish matchLevel labels by threshold", () => {
    // Strong Investigative profile should top with a research-heavy career.
    const scores = calculateScores(
      buildAnswers(idsForDimension("I").map((id) => ({ id, score: 5 }))),
      QUESTIONS
    );
    const matches = matchCareers(scores, CAREERS);
    const top = matches[0];
    const expectedLevel =
      top.affinityPercentage >= 88
        ? "Compatibilidad Excelente"
        : top.affinityPercentage >= 78
          ? "Alta Afinidad"
          : top.affinityPercentage >= 68
            ? "Buena Afinidad"
            : "Afinidad Moderada";
    expect(top.matchLevel).toBe(expectedLevel);
    // A dominant-I profile matches an I-dominant career (boost applied).
    expect(top.primaryDimensionMatch).toBe(true);
  });
});

describe("dominant helpers", () => {
  it("getDominantCode concatenates top-N dimension letters", () => {
    const scores = { r: 10, i: 90, a: 80, s: 30, e: 20, c: 5 };
    expect(getDominantCode(scores, 3)).toBe("IAS");
    expect(getDominantCode(scores, 1)).toBe("I");
    expect(getDominantDimensions(scores, 2).map(([c]) => c)).toEqual(["I", "A"]);
  });

  it("maps 'IRA' to the IR/RI branch text", () => {
    expect(getDominantProfileDescription("IRA")).toBe(
      "Perfil Tecnológico e Investigativo. Destacas por combinar la rigurosidad científica y el análisis con la aplicación práctica y técnica en sistemas complejos."
    );
  });

  it("falls back for a code with no 2-letter mapping", () => {
    // Same-letter prefixes are not in the 2-letter map and hit the fallback.
    const text = getDominantProfileDescription("RRC");
    expect(text).toContain("Perfil Multifacético");
    expect(text).toContain("RRC");
  });
});
