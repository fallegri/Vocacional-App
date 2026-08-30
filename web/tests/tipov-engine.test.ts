import { describe, it, expect } from "vitest";
import {
  TIPOV_DIMENSIONS_ORDER,
  TIPOV_QUESTIONS,
  type TipovDimension,
} from "@/lib/methods/tipov/data";
import {
  itemsPerDimension,
  scoreTipov,
  sumByDimension,
} from "@/lib/methods/tipov/engine";
import type { MethodAnswer } from "@/lib/methods/types";

function idsFor(dim: TipovDimension): number[] {
  return TIPOV_QUESTIONS.filter((q) => q.dimension === dim).map((q) => q.id);
}

describe("TIPOV item bank", () => {
  it("has exactly 66 items", () => {
    expect(TIPOV_QUESTIONS).toHaveLength(66);
  });

  it("has 13 dimensions", () => {
    expect(TIPOV_DIMENSIONS_ORDER).toHaveLength(13);
    const dims = new Set(TIPOV_QUESTIONS.map((q) => q.dimension));
    expect(dims.size).toBe(13);
  });

  it("distributes 5 items per dimension with Tecnología holding 6", () => {
    const counts = itemsPerDimension();
    expect(counts.TECNOLOGIA).toBe(6);
    for (const dim of TIPOV_DIMENSIONS_ORDER) {
      if (dim === "TECNOLOGIA") continue;
      expect(counts[dim]).toBe(5);
    }
  });

  it("has unique correlative ids 1..66", () => {
    const ids = TIPOV_QUESTIONS.map((q) => q.id);
    expect(new Set(ids).size).toBe(66);
    expect(Math.min(...ids)).toBe(1);
    expect(Math.max(...ids)).toBe(66);
  });
});

describe("TIPOV scoring", () => {
  it("sums raw values per dimension", () => {
    // ARTE (5 items) all 'Me agrada' (3) => 15; CALCULO (5) all 'Me desagrada' (1) => 5.
    const answers: MethodAnswer[] = [
      ...idsFor("ARTE").map((id) => ({ questionId: id, value: 3 })),
      ...idsFor("CALCULO").map((id) => ({ questionId: id, value: 1 })),
    ];
    const sums = sumByDimension(answers);
    expect(sums.ARTE).toBe(15);
    expect(sums.CALCULO).toBe(5);
    expect(sums.SALUD).toBe(0);
  });

  it("normalizes value = raw / (3 * itemCount) * 100", () => {
    const answers: MethodAnswer[] = idsFor("SALUD").map((id) => ({
      questionId: id,
      value: 3,
    }));
    const result = scoreTipov(answers);
    const salud = result.dimensionScores.find((d) => d.code === "SALUD")!;
    expect(salud.raw).toBe(15); // 5 items * 3
    expect(salud.value).toBeCloseTo((15 / (3 * 5)) * 100, 5); // 100
  });

  it("selects the top dimensions by raw sum", () => {
    const answers: MethodAnswer[] = [
      ...idsFor("LEYES").map((id) => ({ questionId: id, value: 3 })), // 15
      ...idsFor("EMPRESA").map((id) => ({ questionId: id, value: 3 })), // 15 (EMPRESA earlier in order)
      ...idsFor("IDIOMAS").map((id) => ({ questionId: id, value: 2 })), // 10
    ];
    const result = scoreTipov(answers);
    // EMPRESA and LEYES both 15; EMPRESA precedes LEYES in canonical order.
    expect(result.dominantCodes.slice(0, 2)).toEqual(["EMPRESA", "LEYES"]);
    expect(result.dominantCodes[2]).toBe("IDIOMAS");
    expect(result.methodId).toBe("TIPOV");
  });

  it("handles the all-'Me desagrada' extreme (min) and all-'Me agrada' extreme (max)", () => {
    const allMin: MethodAnswer[] = TIPOV_QUESTIONS.map((q) => ({
      questionId: q.id,
      value: 1,
    }));
    const minResult = scoreTipov(allMin);
    for (const d of minResult.dimensionScores) {
      const count = itemsPerDimension()[d.code as TipovDimension];
      expect(d.raw).toBe(count * 1);
      expect(d.value).toBeCloseTo((1 / 3) * 100, 5);
    }

    const allMax: MethodAnswer[] = TIPOV_QUESTIONS.map((q) => ({
      questionId: q.id,
      value: 3,
    }));
    const maxResult = scoreTipov(allMax);
    for (const d of maxResult.dimensionScores) {
      expect(d.value).toBeCloseTo(100, 5);
    }
  });

  it("returns a neutral message when there are no answers", () => {
    const result = scoreTipov([]);
    expect(result.interpretation).toContain("No se registraron");
  });

  it("names the top interest areas in the interpretation", () => {
    const answers: MethodAnswer[] = idsFor("MUSICA_ARTES_ESCENICAS").map(
      (id) => ({ questionId: id, value: 3 })
    );
    const result = scoreTipov(answers);
    expect(result.dominantCodes[0]).toBe("MUSICA_ARTES_ESCENICAS");
    expect(result.interpretation).toContain("Música y Artes Escénicas");
  });
});
