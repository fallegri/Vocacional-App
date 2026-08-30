import { describe, it, expect } from "vitest";
import {
  CIPR_SCALES_ORDER,
  CIPR_QUESTIONS,
  type CiprScale,
} from "@/lib/methods/cipr/data";
import {
  CIPR_VALUE_MAPPING,
  itemsPerScale,
  scoreCipr,
  sumByScale,
} from "@/lib/methods/cipr/engine";
import type { MethodAnswer } from "@/lib/methods/types";

function idsFor(scale: CiprScale): number[] {
  return CIPR_QUESTIONS.filter((q) => q.dimension === scale).map((q) => q.id);
}

describe("CIP-R item bank", () => {
  it("has exactly 114 items", () => {
    expect(CIPR_QUESTIONS).toHaveLength(114);
  });

  it("has exactly 15 scales with the correct codes", () => {
    expect(CIPR_SCALES_ORDER).toHaveLength(15);
    expect(CIPR_SCALES_ORDER).toEqual([
      "CALCULO",
      "CIENTIFICA",
      "DISENO",
      "TECNOLOGICA",
      "GEOASTRONOMICA",
      "NATURALISTA",
      "SANITARIA",
      "ASISTENCIAL",
      "JURIDICA",
      "ECONOMICA",
      "COMUNICACIONAL",
      "HUMANISTICA",
      "ARTISTICA",
      "MUSICAL",
      "LINGUISTICA",
    ]);
    const dims = new Set(CIPR_QUESTIONS.map((q) => q.dimension));
    expect(dims.size).toBe(15);
  });

  it("distributes items so per-scale counts sum to 114", () => {
    const counts = itemsPerScale();
    const total = CIPR_SCALES_ORDER.reduce((acc, s) => acc + counts[s], 0);
    expect(total).toBe(114);
    // First 9 scales carry 8 items, last 6 carry 7 items.
    CIPR_SCALES_ORDER.forEach((scale, index) => {
      expect(counts[scale]).toBe(index < 9 ? 8 : 7);
    });
  });

  it("has unique correlative ids 1..114", () => {
    const ids = CIPR_QUESTIONS.map((q) => q.id);
    expect(new Set(ids).size).toBe(114);
    expect(Math.min(...ids)).toBe(1);
    expect(Math.max(...ids)).toBe(114);
  });
});

describe("CIP-R scoring", () => {
  it("maps Agrado=2, Indiferencia=1, Desagrado=0", () => {
    expect(CIPR_VALUE_MAPPING.Agrado).toBe(2);
    expect(CIPR_VALUE_MAPPING.Indiferencia).toBe(1);
    expect(CIPR_VALUE_MAPPING.Desagrado).toBe(0);
  });

  it("sums mapped response values per scale", () => {
    // CALCULO (8 items) all Agrado (2) => 16; DISENO (8) all Indiferencia (1) => 8.
    const answers: MethodAnswer[] = [
      ...idsFor("CALCULO").map((id) => ({ questionId: id, value: 2 })),
      ...idsFor("DISENO").map((id) => ({ questionId: id, value: 1 })),
    ];
    const sums = sumByScale(answers);
    expect(sums.CALCULO).toBe(16);
    expect(sums.DISENO).toBe(8);
    expect(sums.SANITARIA).toBe(0);
  });

  it("normalizes value = raw / (2 * itemCount) * 100", () => {
    const answers: MethodAnswer[] = idsFor("MUSICAL").map((id) => ({
      questionId: id,
      value: 2,
    }));
    const result = scoreCipr(answers);
    const musical = result.dimensionScores.find((d) => d.code === "MUSICAL")!;
    expect(musical.raw).toBe(14); // 7 items * 2
    expect(musical.value).toBeCloseTo((14 / (2 * 7)) * 100, 5); // 100
  });

  it("selects the top scales by raw sum with canonical tie-break", () => {
    const answers: MethodAnswer[] = [
      // CIENTIFICA (8) all Agrado => 16
      ...idsFor("CIENTIFICA").map((id) => ({ questionId: id, value: 2 })),
      // TECNOLOGICA (8) all Agrado => 16 (TECNOLOGICA later in canonical order)
      ...idsFor("TECNOLOGICA").map((id) => ({ questionId: id, value: 2 })),
      // LINGUISTICA (7) all Agrado => 14
      ...idsFor("LINGUISTICA").map((id) => ({ questionId: id, value: 2 })),
    ];
    const result = scoreCipr(answers);
    // CIENTIFICA and TECNOLOGICA both 16; CIENTIFICA precedes TECNOLOGICA.
    expect(result.dominantCodes.slice(0, 2)).toEqual([
      "CIENTIFICA",
      "TECNOLOGICA",
    ]);
    expect(result.dominantCodes[2]).toBe("LINGUISTICA");
    expect(result.methodId).toBe("CIPR");
  });

  it("names the top scales in the interpretation", () => {
    const answers: MethodAnswer[] = idsFor("SANITARIA").map((id) => ({
      questionId: id,
      value: 2,
    }));
    const result = scoreCipr(answers);
    expect(result.dominantCodes[0]).toBe("SANITARIA");
    expect(result.interpretation).toContain("Sanitaria");
  });

  it("returns a neutral message when there are no answers", () => {
    const result = scoreCipr([]);
    expect(result.interpretation).toContain("No se registraron");
  });

  it("returns a neutral message when all responses are Desagrado (0)", () => {
    const answers: MethodAnswer[] = CIPR_QUESTIONS.map((q) => ({
      questionId: q.id,
      value: 0,
    }));
    const result = scoreCipr(answers);
    expect(result.interpretation).toContain("No se registraron");
    for (const d of result.dimensionScores) {
      expect(d.raw).toBe(0);
      expect(d.value).toBe(0);
    }
  });

  it("reaches the maximum when all responses are Agrado (2)", () => {
    const answers: MethodAnswer[] = CIPR_QUESTIONS.map((q) => ({
      questionId: q.id,
      value: 2,
    }));
    const result = scoreCipr(answers);
    for (const d of result.dimensionScores) {
      expect(d.value).toBeCloseTo(100, 5);
    }
  });

  it("exposes raw that survives a JSON round-trip", () => {
    const answers: MethodAnswer[] = idsFor("JURIDICA").map((id) => ({
      questionId: id,
      value: 2,
    }));
    const result = scoreCipr(answers);
    const roundTripped = JSON.parse(JSON.stringify(result.raw));
    expect(roundTripped).toEqual(result.raw);
    expect(roundTripped.sums.JURIDICA).toBe(16); // 8 items * 2
    expect(roundTripped.valueMapping.Agrado).toBe(2);
  });
});
