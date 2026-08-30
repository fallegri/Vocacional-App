import { describe, it, expect } from "vitest";
import {
  CHASIDE_AREAS,
  CHASIDE_QUESTIONS,
  type ChasideArea,
} from "@/lib/methods/chaside/data";
import {
  countAffirmatives,
  scoreChaside,
  topTwoAreas,
} from "@/lib/methods/chaside/engine";
import type { MethodAnswer } from "@/lib/methods/types";

function idsFor(area: ChasideArea, category: "INTERES" | "APTITUD"): number[] {
  return CHASIDE_QUESTIONS.filter(
    (q) => q.dimension === area && q.category === category
  ).map((q) => q.id);
}

function answerYes(ids: number[]): MethodAnswer[] {
  return ids.map((id) => ({ questionId: id, value: 1 }));
}

describe("CHASIDE item bank", () => {
  it("has exactly 98 items", () => {
    expect(CHASIDE_QUESTIONS).toHaveLength(98);
  });

  it("has 7 areas with 10 Interés + 4 Aptitud each", () => {
    expect(CHASIDE_AREAS).toHaveLength(7);
    for (const area of CHASIDE_AREAS) {
      expect(idsFor(area, "INTERES")).toHaveLength(10);
      expect(idsFor(area, "APTITUD")).toHaveLength(4);
    }
  });

  it("uses only the areas C,H,A,S,I,D,E", () => {
    const dims = new Set(CHASIDE_QUESTIONS.map((q) => q.dimension));
    expect([...dims].sort()).toEqual(["A", "C", "D", "E", "H", "I", "S"]);
  });

  it("has unique correlative ids 1..98", () => {
    const ids = CHASIDE_QUESTIONS.map((q) => q.id);
    expect(new Set(ids).size).toBe(98);
    expect(Math.min(...ids)).toBe(1);
    expect(Math.max(...ids)).toBe(98);
  });
});

describe("CHASIDE scoring", () => {
  it("counts 'Sí' per area separately for Interés and Aptitud", () => {
    // Answer all 10 Interés + all 4 Aptitud of area S with 'Sí'.
    const answers = answerYes([
      ...idsFor("S", "INTERES"),
      ...idsFor("S", "APTITUD"),
    ]);
    const counts = countAffirmatives(answers);
    expect(counts.interes.S).toBe(10);
    expect(counts.aptitud.S).toBe(4);
    // Untouched areas stay at zero.
    expect(counts.interes.C).toBe(0);
    expect(counts.aptitud.A).toBe(0);
  });

  it("ignores 'No' (value 0) answers", () => {
    const noAnswers = idsFor("H", "INTERES").map((id) => ({
      questionId: id,
      value: 0,
    }));
    const counts = countAffirmatives(noAnswers);
    expect(counts.interes.H).toBe(0);
  });

  it("selects the two highest-scoring areas per dimension", () => {
    // Interés: S=10, I=8, C=3, rest 0. Aptitud: I=4, S=2.
    const answers: MethodAnswer[] = [
      ...answerYes(idsFor("S", "INTERES")), // 10
      ...answerYes(idsFor("I", "INTERES").slice(0, 8)), // 8
      ...answerYes(idsFor("C", "INTERES").slice(0, 3)), // 3
      ...answerYes(idsFor("I", "APTITUD")), // 4
      ...answerYes(idsFor("S", "APTITUD").slice(0, 2)), // 2
    ];
    const counts = countAffirmatives(answers);
    expect(topTwoAreas(counts.interes)).toEqual(["S", "I"]);
    expect(topTwoAreas(counts.aptitud)).toEqual(["I", "S"]);

    const result = scoreChaside(answers);
    expect(result.methodId).toBe("CHASIDE");
    expect(result.dominantCodes).toEqual(["S", "I"]);
  });

  it("normalizes dimension value against 14 items per area", () => {
    const answers = answerYes([
      ...idsFor("A", "INTERES"), // 10
      ...idsFor("A", "APTITUD"), // 4
    ]);
    const result = scoreChaside(answers);
    const areaA = result.dimensionScores.find((d) => d.code === "A")!;
    expect(areaA.raw).toBe(14);
    expect(areaA.value).toBeCloseTo(100, 5);
  });

  it("yields zero counts and a neutral message for an all-'No' set", () => {
    const answers: MethodAnswer[] = CHASIDE_QUESTIONS.map((q) => ({
      questionId: q.id,
      value: 0,
    }));
    const result = scoreChaside(answers);
    for (const d of result.dimensionScores) {
      expect(d.raw).toBe(0);
      expect(d.value).toBe(0);
    }
    expect(result.interpretation).toContain("No se registraron");
  });

  it("mentions the dominant Interés area in the interpretation", () => {
    const answers = answerYes(idsFor("E", "INTERES"));
    const result = scoreChaside(answers);
    expect(result.dominantCodes[0]).toBe("E");
    expect(result.interpretation).toContain("Ciencias Exactas y Orgánicas");
  });

  it("exposes per-area Interés and Aptitud counts in raw for the results view", () => {
    // Interés S=10, I=6; Aptitud S=4, I=1. Estos conteos deben poder graficarse
    // por separado en el panel "Interés vs. Aptitud".
    const answers: MethodAnswer[] = [
      ...answerYes(idsFor("S", "INTERES")), // 10
      ...answerYes(idsFor("I", "INTERES").slice(0, 6)), // 6
      ...answerYes(idsFor("S", "APTITUD")), // 4
      ...answerYes(idsFor("I", "APTITUD").slice(0, 1)), // 1
    ];
    const result = scoreChaside(answers);
    const raw = result.raw as {
      interes: Record<ChasideArea, number>;
      aptitud: Record<ChasideArea, number>;
    };
    expect(raw.interes.S).toBe(10);
    expect(raw.interes.I).toBe(6);
    expect(raw.aptitud.S).toBe(4);
    expect(raw.aptitud.I).toBe(1);
    // Interés y Aptitud NO coinciden por área: el panel debe poder mostrar la
    // diferencia (aquí ambos coinciden en S como top, pero difieren en conteos).
    expect(raw.interes.C).toBe(0);
    expect(raw.aptitud.C).toBe(0);

    // El dato sobrevive la serialización JSON usada por la persistencia
    // (method_scores JSONB) sin perder los conteos por área.
    const roundTripped = JSON.parse(JSON.stringify(raw)) as typeof raw;
    expect(roundTripped.interes.S).toBe(10);
    expect(roundTripped.aptitud.S).toBe(4);
  });
});
