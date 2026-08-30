// ===========================================================================
// Motor de puntuación del Test Magdalena Contreras. Funciones puras (sin E/S).
// Calificación según skills/knowledge/test-magdalena-contreras.md:
//   - Cada ítem se responde con la escala 0-4 (Interés: "Me desagrada mucho"(0)
//     .. "Me gusta mucho"(4); Aptitud: "Incompetente"(0) .. "Muy competente"(4)).
//   - Se suma el valor por campo POR SEPARADO en Interés y Aptitud (6 ítems x 4
//     = máx. 24 por campo y dimensión).
//   - Cada total 0-24 se mapea a una banda de interpretación:
//       Interés: 0-6 Falta de Motivación, 7-12 Intereses Comunes,
//                13-18 Intereses Subprofesionales, 19-24 Intereses Profesionales.
//       Aptitud: 0-6 Falta de Práctica, 7-12 Aptitudes Comunes,
//                13-18 Aptitudes Normales, 19-24 Aptitudes Desarrolladas.
//   - El perfil dominante se forma con los campos de mayor Interés (top 3).
// La redacción de los ítems (data.ts) es una adaptación original y fiel.
// Todo el texto de cara al usuario permanece en español.
// ===========================================================================

import type {
  MethodAnswer,
  MethodDimensionScore,
  MethodResult,
} from "@/lib/methods/types";
import {
  MAGDALENA_DIMENSIONS,
  MAGDALENA_FIELDS,
  MAGDALENA_QUESTIONS,
  type MagdalenaField,
} from "@/lib/methods/magdalena/data";

/** Puntaje máximo por campo y dimensión (6 ítems x 4 puntos). */
export const MAGDALENA_FIELD_MAX = 24;

/** Sumas crudas por campo en cada dimensión (0-24). */
export interface MagdalenaTotals {
  interes: Record<MagdalenaField, number>;
  aptitud: Record<MagdalenaField, number>;
}

function emptyTotals(): MagdalenaTotals {
  const interes = {} as Record<MagdalenaField, number>;
  const aptitud = {} as Record<MagdalenaField, number>;
  for (const field of MAGDALENA_FIELDS) {
    interes[field] = 0;
    aptitud[field] = 0;
  }
  return { interes, aptitud };
}

/** Suma el valor 0-4 de cada ítem por campo, separando Interés y Aptitud. */
export function sumByField(answers: MethodAnswer[]): MagdalenaTotals {
  const totals = emptyTotals();
  const answerMap = new Map<number, number>();
  for (const a of answers) answerMap.set(a.questionId, a.value);

  for (const q of MAGDALENA_QUESTIONS) {
    const value = answerMap.get(q.id);
    if (value == null || value <= 0) continue;
    const field = q.dimension as MagdalenaField;
    if (q.category === "APTITUD") totals.aptitud[field] += value;
    else totals.interes[field] += value;
  }
  return totals;
}

/**
 * Mapea un total 0-24 a su banda de INTERÉS (español) en los cortes
 * documentados: 0-6, 7-12, 13-18, 19-24.
 */
export function interestBand(score: number): string {
  if (score <= 6) return "Falta de Motivación";
  if (score <= 12) return "Intereses Comunes";
  if (score <= 18) return "Intereses Subprofesionales";
  return "Intereses Profesionales";
}

/**
 * Mapea un total 0-24 a su banda de APTITUD (español) en los cortes
 * documentados: 0-6, 7-12, 13-18, 19-24.
 */
export function aptitudeBand(score: number): string {
  if (score <= 6) return "Falta de Práctica";
  if (score <= 12) return "Aptitudes Comunes";
  if (score <= 18) return "Aptitudes Normales";
  return "Aptitudes Desarrolladas";
}

/**
 * Devuelve los campos ordenados de mayor a menor puntaje (desempate por orden
 * canónico), tomando los `count` primeros.
 */
export function topFields(
  scores: Record<MagdalenaField, number>,
  count: number
): MagdalenaField[] {
  return [...MAGDALENA_FIELDS]
    .map((field, index) => ({ field, value: scores[field], index }))
    .sort((x, y) => (y.value !== x.value ? y.value - x.value : x.index - y.index))
    .slice(0, count)
    .map((entry) => entry.field);
}

/**
 * Calcula el resultado uniforme del Test Magdalena Contreras.
 * El valor normalizado (0-100) por dimensión combina Interés y Aptitud del
 * campo respecto de su máximo conjunto (48 = 24 + 24).
 */
export function scoreMagdalena(answers: MethodAnswer[]): MethodResult {
  const totals = sumByField(answers);

  const dimensionScores: MethodDimensionScore[] = MAGDALENA_FIELDS.map(
    (field) => {
      const interes = totals.interes[field];
      const aptitud = totals.aptitud[field];
      const raw = interes + aptitud;
      const value = (raw / (MAGDALENA_FIELD_MAX * 2)) * 100;
      return {
        code: field,
        title: MAGDALENA_DIMENSIONS[field].title,
        value,
        raw,
      };
    }
  );

  // Bandas de interpretación por campo (para la vista de resultados).
  const interesBands = {} as Record<MagdalenaField, string>;
  const aptitudBands = {} as Record<MagdalenaField, string>;
  for (const field of MAGDALENA_FIELDS) {
    interesBands[field] = interestBand(totals.interes[field]);
    aptitudBands[field] = aptitudeBand(totals.aptitud[field]);
  }

  const topInteres = topFields(totals.interes, 3);
  const topAptitud = topFields(totals.aptitud, 3);
  const dominantCodes = topInteres;

  const totalInteres = MAGDALENA_FIELDS.reduce(
    (acc, f) => acc + totals.interes[f],
    0
  );

  let dominantSummary: string;
  let interpretation: string;

  if (totalInteres === 0) {
    dominantSummary = "Sin respuestas registradas.";
    interpretation =
      "No se registraron respuestas con interés, por lo que no es posible determinar tu perfil vocacional. Te sugerimos completar ambos cuestionarios (Intereses y Aptitudes) reflexionando sobre cuánto te gusta y qué tan competente te sientes en cada actividad.";
  } else {
    const primary = MAGDALENA_DIMENSIONS[topInteres[0]];
    const secondary = MAGDALENA_DIMENSIONS[topInteres[1]];
    const tertiary = MAGDALENA_DIMENSIONS[topInteres[2]];
    dominantSummary = `${primary.title}, ${secondary.title} y ${tertiary.title}`;

    const primaryInteresBand = interesBands[topInteres[0]];
    const primaryAptitudBand = aptitudBands[topInteres[0]];

    // Detecta un desajuste Interés-vs-Aptitud en el campo principal: alto
    // interés (>=13) pero baja aptitud (<=12).
    const mismatch =
      totals.interes[topInteres[0]] >= 13 &&
      totals.aptitud[topInteres[0]] <= 12;
    const mismatchText = mismatch
      ? ` Sin embargo, tu aptitud autopercibida en ${primary.title} es más baja (${primaryAptitudBand}); conviene reforzar la práctica y la formación en ese campo para nivelar tus habilidades con tu interés.`
      : ` Tu aptitud autopercibida en ${primary.title} se ubica en la banda de ${primaryAptitudBand}, lo que muestra una relación coherente entre lo que te gusta y aquello para lo que te sientes competente.`;

    interpretation =
      `Tus intereses más altos se orientan hacia los campos de ${primary.title}, ${secondary.title} y ${tertiary.title}. ` +
      `Tu interés principal (${primary.title}) se ubica en la banda de ${primaryInteresBand}.` +
      mismatchText;
  }

  return {
    methodId: "MAGDALENA",
    dimensionScores,
    dominantCodes,
    dominantSummary,
    interpretation,
    raw: {
      interes: totals.interes,
      aptitud: totals.aptitud,
      interesBands,
      aptitudBands,
      topInteres,
      topAptitud,
      fieldMax: MAGDALENA_FIELD_MAX,
    },
  };
}
