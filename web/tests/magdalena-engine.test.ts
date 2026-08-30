import { describe, it, expect } from "vitest";
import {
  MAGDALENA_FIELDS,
  MAGDALENA_QUESTIONS,
  type MagdalenaField,
} from "@/lib/methods/magdalena/data";
import {
  aptitudeBand,
  interestBand,
  MAGDALENA_FIELD_MAX,
  scoreMagdalena,
  sumByField,
  topFields,
} from "@/lib/methods/magdalena/engine";
import type { MethodAnswer } from "@/lib/methods/types";

function idsFor(
  field: MagdalenaField,
  category: "INTERES" | "APTITUD"
): number[] {
  return MAGDALENA_QUESTIONS.filter(
    (q) => q.dimension === field && q.category === category
  ).map((q) => q.id);
}

/** Responde una lista de ítems con un valor 0-4 fijo. */
function answerWith(ids: number[], value: number): MethodAnswer[] {
  return ids.map((id) => ({ questionId: id, value }));
}

describe("Magdalena item bank", () => {
  it("has exactly 120 items", () => {
    expect(MAGDALENA_QUESTIONS).toHaveLength(120);
  });

  it("has 10 fields with 6 INTERES + 6 APTITUD each", () => {
    expect(MAGDALENA_FIELDS).toHaveLength(10);
    for (const field of MAGDALENA_FIELDS) {
      expect(idsFor(field, "INTERES")).toHaveLength(6);
      expect(idsFor(field, "APTITUD")).toHaveLength(6);
    }
  });

  it("splits into 60 INTERES + 60 APTITUD", () => {
    const interes = MAGDALENA_QUESTIONS.filter((q) => q.category === "INTERES");
    const aptitud = MAGDALENA_QUESTIONS.filter((q) => q.category === "APTITUD");
    expect(interes).toHaveLength(60);
    expect(aptitud).toHaveLength(60);
  });

  it("has unique correlative ids 1..120", () => {
    const ids = MAGDALENA_QUESTIONS.map((q) => q.id);
    expect(new Set(ids).size).toBe(120);
    expect(Math.min(...ids)).toBe(1);
    expect(Math.max(...ids)).toBe(120);
  });
});

describe("Magdalena band mapping", () => {
  it("maps interest scores to the documented bands at the cut points", () => {
    expect(interestBand(0)).toBe("Falta de Motivación");
    expect(interestBand(6)).toBe("Falta de Motivación");
    expect(interestBand(7)).toBe("Intereses Comunes");
    expect(interestBand(12)).toBe("Intereses Comunes");
    expect(interestBand(13)).toBe("Intereses Subprofesionales");
    expect(interestBand(18)).toBe("Intereses Subprofesionales");
    expect(interestBand(19)).toBe("Intereses Profesionales");
    expect(interestBand(24)).toBe("Intereses Profesionales");
  });

  it("maps aptitude scores to the documented bands at the cut points", () => {
    expect(aptitudeBand(0)).toBe("Falta de Práctica");
    expect(aptitudeBand(6)).toBe("Falta de Práctica");
    expect(aptitudeBand(7)).toBe("Aptitudes Comunes");
    expect(aptitudeBand(12)).toBe("Aptitudes Comunes");
    expect(aptitudeBand(13)).toBe("Aptitudes Normales");
    expect(aptitudeBand(18)).toBe("Aptitudes Normales");
    expect(aptitudeBand(19)).toBe("Aptitudes Desarrolladas");
    expect(aptitudeBand(24)).toBe("Aptitudes Desarrolladas");
  });
});

describe("Magdalena scoring", () => {
  it("sums Interés and Aptitud per field separately (max 24 each)", () => {
    // Servicio Social: todos los ítems de Interés y Aptitud en 4 (máx. 24 cada).
    const answers = [
      ...answerWith(idsFor("SERVICIO_SOCIAL", "INTERES"), 4),
      ...answerWith(idsFor("SERVICIO_SOCIAL", "APTITUD"), 4),
    ];
    const totals = sumByField(answers);
    expect(totals.interes.SERVICIO_SOCIAL).toBe(24);
    expect(totals.aptitud.SERVICIO_SOCIAL).toBe(24);
    expect(MAGDALENA_FIELD_MAX).toBe(24);
    // Campos sin responder quedan en cero.
    expect(totals.interes.CALCULO).toBe(0);
    expect(totals.aptitud.VERBAL).toBe(0);
  });

  it("ignores value 0 (no aporta puntos)", () => {
    const answers = answerWith(idsFor("MUSICAL", "INTERES"), 0);
    const totals = sumByField(answers);
    expect(totals.interes.MUSICAL).toBe(0);
  });

  it("normalizes dimension value against 48 (24+24) points", () => {
    const answers = [
      ...answerWith(idsFor("VERBAL", "INTERES"), 4), // 24
      ...answerWith(idsFor("VERBAL", "APTITUD"), 4), // 24
    ];
    const result = scoreMagdalena(answers);
    const verbal = result.dimensionScores.find((d) => d.code === "VERBAL")!;
    expect(verbal.raw).toBe(48);
    expect(verbal.value).toBeCloseTo(100, 5);
  });

  it("selects the highest-Interés fields as dominant (top 3)", () => {
    // Interés: CALCULO=24, CIENTIFICA=18, VERBAL=12, resto 0.
    const answers = [
      ...answerWith(idsFor("CALCULO", "INTERES"), 4), // 6*4 = 24
      ...answerWith(idsFor("CIENTIFICA", "INTERES"), 3), // 6*3 = 18
      ...answerWith(idsFor("VERBAL", "INTERES"), 2), // 6*2 = 12
    ];
    const totals = sumByField(answers);
    expect(totals.interes.CALCULO).toBe(24);
    expect(totals.interes.CIENTIFICA).toBe(18);
    expect(totals.interes.VERBAL).toBe(12);
    expect(topFields(totals.interes, 3)).toEqual([
      "CALCULO",
      "CIENTIFICA",
      "VERBAL",
    ]);

    const result = scoreMagdalena(answers);
    expect(result.methodId).toBe("MAGDALENA");
    expect(result.dominantCodes).toEqual(["CALCULO", "CIENTIFICA", "VERBAL"]);
    expect(result.interpretation).toContain("Cálculo");
  });

  it("maps extremes to the correct bands in raw", () => {
    // Un campo con 24 en ambos, otro con 0.
    const answers = [
      ...answerWith(idsFor("MECANICO_CONSTRUCTIVA", "INTERES"), 4), // 24
      ...answerWith(idsFor("MECANICO_CONSTRUCTIVA", "APTITUD"), 4), // 24
    ];
    const result = scoreMagdalena(answers);
    const raw = result.raw as {
      interesBands: Record<MagdalenaField, string>;
      aptitudBands: Record<MagdalenaField, string>;
    };
    expect(raw.interesBands.MECANICO_CONSTRUCTIVA).toBe(
      "Intereses Profesionales"
    );
    expect(raw.aptitudBands.MECANICO_CONSTRUCTIVA).toBe(
      "Aptitudes Desarrolladas"
    );
    // Un campo sin responder queda en las bandas más bajas.
    expect(raw.interesBands.MUSICAL).toBe("Falta de Motivación");
    expect(raw.aptitudBands.MUSICAL).toBe("Falta de Práctica");
  });

  it("reflects an Interés-vs-Aptitud mismatch in raw and interpretation", () => {
    // Alto interés (24) pero baja aptitud (6) en Cálculo.
    const answers = [
      ...answerWith(idsFor("CALCULO", "INTERES"), 4), // 24
      ...answerWith(idsFor("CALCULO", "APTITUD"), 1), // 6
    ];
    const result = scoreMagdalena(answers);
    const raw = result.raw as {
      interes: Record<MagdalenaField, number>;
      aptitud: Record<MagdalenaField, number>;
      interesBands: Record<MagdalenaField, string>;
      aptitudBands: Record<MagdalenaField, string>;
    };
    expect(raw.interes.CALCULO).toBe(24);
    expect(raw.aptitud.CALCULO).toBe(6);
    expect(raw.interesBands.CALCULO).toBe("Intereses Profesionales");
    expect(raw.aptitudBands.CALCULO).toBe("Falta de Práctica");
    expect(result.dominantCodes[0]).toBe("CALCULO");
    // La interpretación destaca el desajuste (baja aptitud).
    expect(result.interpretation).toContain("Falta de Práctica");
  });

  it("returns a neutral Spanish message for an empty/all-zero set", () => {
    const answers: MethodAnswer[] = MAGDALENA_QUESTIONS.map((q) => ({
      questionId: q.id,
      value: 0,
    }));
    const result = scoreMagdalena(answers);
    for (const d of result.dimensionScores) {
      expect(d.raw).toBe(0);
      expect(d.value).toBe(0);
    }
    expect(result.interpretation).toContain("No se registraron");
    expect(result.dominantSummary).toContain("Sin respuestas");
  });

  it("exposes per-field Interés and Aptitud totals in raw and round-trips as JSON", () => {
    const answers = [
      ...answerWith(idsFor("ORGANIZACION", "INTERES"), 4), // 24
      ...answerWith(idsFor("ORGANIZACION", "APTITUD"), 3), // 18
      ...answerWith(idsFor("AIRE_LIBRE", "INTERES"), 2), // 12
      ...answerWith(idsFor("AIRE_LIBRE", "APTITUD"), 1), // 6
    ];
    const result = scoreMagdalena(answers);
    const raw = result.raw as {
      interes: Record<MagdalenaField, number>;
      aptitud: Record<MagdalenaField, number>;
      fieldMax: number;
    };
    expect(raw.interes.ORGANIZACION).toBe(24);
    expect(raw.aptitud.ORGANIZACION).toBe(18);
    expect(raw.interes.AIRE_LIBRE).toBe(12);
    expect(raw.aptitud.AIRE_LIBRE).toBe(6);
    expect(raw.fieldMax).toBe(24);

    const roundTripped = JSON.parse(JSON.stringify(raw)) as typeof raw;
    expect(roundTripped.interes.ORGANIZACION).toBe(24);
    expect(roundTripped.aptitud.AIRE_LIBRE).toBe(6);
    expect(roundTripped.fieldMax).toBe(24);
  });
});
