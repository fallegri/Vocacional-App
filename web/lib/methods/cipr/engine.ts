// ===========================================================================
// Motor de puntuación CIP-R. Funciones puras (sin E/S).
// Calificación según skills/knowledge/cuestionario-cip-r.md:
//   - Escala de opción única: Agrado (A) / Indiferencia (I) / Desagrado (D).
//   - Mapeo numérico (documentado): Agrado = 2, Indiferencia = 1, Desagrado = 0
//     (mayor valor = mayor atracción por la actividad).
//   - Se suma el valor mapeado de los ítems por escala; mayor suma = mayor
//     interés. El valor normalizado 0-100 = raw / (2 * cantidadDeItems) * 100.
// La redacción de los ítems (data.ts) es una adaptación original y fiel.
// Todo el texto de cara al usuario permanece en español.
// ===========================================================================

import type {
  MethodAnswer,
  MethodDimensionScore,
  MethodResult,
} from "@/lib/methods/types";
import {
  CIPR_DIMENSIONS,
  CIPR_SCALES_ORDER,
  CIPR_QUESTIONS,
  type CiprScale,
} from "@/lib/methods/cipr/data";

/** Valor máximo por ítem (Agrado). */
const MAX_PER_ITEM = 2;

/**
 * Mapeo de la opción única a valor numérico.
 * Agrado = 2, Indiferencia = 1, Desagrado = 0.
 */
export const CIPR_VALUE_MAPPING: Readonly<Record<string, number>> = {
  Agrado: 2,
  Indiferencia: 1,
  Desagrado: 0,
};

/** Número de ítems por escala (según el banco). */
export function itemsPerScale(): Record<CiprScale, number> {
  const counts = {} as Record<CiprScale, number>;
  for (const scale of CIPR_SCALES_ORDER) counts[scale] = 0;
  for (const q of CIPR_QUESTIONS) counts[q.dimension as CiprScale] += 1;
  return counts;
}

/** Suma cruda por escala (ítems sin responder cuentan como 0). */
export function sumByScale(answers: MethodAnswer[]): Record<CiprScale, number> {
  const answerMap = new Map<number, number>();
  for (const a of answers) answerMap.set(a.questionId, a.value);

  const sums = {} as Record<CiprScale, number>;
  for (const scale of CIPR_SCALES_ORDER) sums[scale] = 0;

  for (const q of CIPR_QUESTIONS) {
    const value = answerMap.get(q.id);
    if (value == null) continue;
    sums[q.dimension as CiprScale] += value;
  }
  return sums;
}

/** Calcula el resultado uniforme del CIP-R. */
export function scoreCipr(answers: MethodAnswer[]): MethodResult {
  const sums = sumByScale(answers);
  const counts = itemsPerScale();

  const dimensionScores: MethodDimensionScore[] = CIPR_SCALES_ORDER.map(
    (scale) => {
      const raw = sums[scale];
      const maxPossible = MAX_PER_ITEM * counts[scale];
      const value = maxPossible > 0 ? (raw / maxPossible) * 100 : 0;
      return {
        code: scale,
        title: CIPR_DIMENSIONS[scale].title,
        value,
        raw,
      };
    }
  );

  // Escalas dominantes por suma cruda (top 3), desempate por orden canónico.
  const ranked = [...CIPR_SCALES_ORDER]
    .map((scale, index) => ({ scale, raw: sums[scale], index }))
    .sort((x, y) => (y.raw !== x.raw ? y.raw - x.raw : x.index - y.index));

  const totalRaw = CIPR_SCALES_ORDER.reduce((acc, s) => acc + sums[s], 0);
  const dominantCodes = ranked.slice(0, 3).map((r) => r.scale);

  let dominantSummary: string;
  let interpretation: string;

  if (totalRaw === 0) {
    dominantSummary = "Sin respuestas registradas.";
    interpretation =
      "No se registraron respuestas con agrado, por lo que no es posible determinar tus intereses profesionales. Te sugerimos completar el cuestionario indicando qué actividades te generan agrado, indiferencia o desagrado.";
  } else {
    const titles = dominantCodes.map((s) => CIPR_DIMENSIONS[s].title);
    dominantSummary = titles.join(", ");
    interpretation =
      `Tus intereses profesionales más altos se concentran en las escalas de ${titles[0]}, ${titles[1]} y ${titles[2]}. ` +
      `Estas escalas reflejan las actividades académicas y laborales que más te agradan y hacia las que conviene orientar tu exploración vocacional.`;
  }

  return {
    methodId: "CIPR",
    dimensionScores,
    dominantCodes,
    dominantSummary,
    interpretation,
    raw: { sums, counts, valueMapping: CIPR_VALUE_MAPPING },
  };
}
