// ===========================================================================
// Motor de puntuación CHASIDE. Funciones puras (sin E/S).
// Calificación según skills/knowledge/metodo-chaside.md:
//   - Cada respuesta "Sí" (valor 1) suma 1 a su área, contabilizando por
//     separado la dimensión de Interés (máx. 10 por área) y la de Aptitud
//     (máx. 4 por área).
//   - El perfil se forma con las DOS áreas más altas en CADA dimensión.
// La redacción de los ítems (data.ts) es una adaptación original y fiel.
// Todo el texto de cara al usuario permanece en español.
// ===========================================================================

import type {
  MethodAnswer,
  MethodDimensionScore,
  MethodResult,
} from "@/lib/methods/types";
import {
  CHASIDE_AREAS,
  CHASIDE_DIMENSIONS,
  CHASIDE_QUESTIONS,
  type ChasideArea,
} from "@/lib/methods/chaside/data";

/** Conteos crudos de "Sí" por área en cada dimensión. */
export interface ChasideCounts {
  interes: Record<ChasideArea, number>;
  aptitud: Record<ChasideArea, number>;
}

const INTERES_MAX = 10;
const APTITUD_MAX = 4;

function emptyCounts(): ChasideCounts {
  const interes = {} as Record<ChasideArea, number>;
  const aptitud = {} as Record<ChasideArea, number>;
  for (const area of CHASIDE_AREAS) {
    interes[area] = 0;
    aptitud[area] = 0;
  }
  return { interes, aptitud };
}

/** Cuenta las respuestas "Sí" por área, separando Interés y Aptitud. */
export function countAffirmatives(answers: MethodAnswer[]): ChasideCounts {
  const counts = emptyCounts();
  const answerMap = new Map<number, number>();
  for (const a of answers) answerMap.set(a.questionId, a.value);

  for (const q of CHASIDE_QUESTIONS) {
    const value = answerMap.get(q.id);
    if (value == null || value <= 0) continue; // sólo "Sí" (1) suma
    const area = q.dimension as ChasideArea;
    if (q.category === "APTITUD") counts.aptitud[area] += 1;
    else counts.interes[area] += 1;
  }
  return counts;
}

/**
 * Devuelve las dos áreas con mayor conteo (orden de mayor a menor,
 * desempate por orden canónico CHASIDE).
 */
export function topTwoAreas(
  scores: Record<ChasideArea, number>
): ChasideArea[] {
  return [...CHASIDE_AREAS]
    .map((area, index) => ({ area, value: scores[area], index }))
    .sort((x, y) => (y.value !== x.value ? y.value - x.value : x.index - y.index))
    .slice(0, 2)
    .map((entry) => entry.area);
}

/**
 * Calcula el resultado uniforme de CHASIDE.
 * El valor normalizado (0-100) combina Interés y Aptitud proporcionalmente
 * a su peso relativo dentro del área (14 ítems por área en total).
 */
export function scoreChaside(answers: MethodAnswer[]): MethodResult {
  const counts = countAffirmatives(answers);

  const dimensionScores: MethodDimensionScore[] = CHASIDE_AREAS.map((area) => {
    const interes = counts.interes[area];
    const aptitud = counts.aptitud[area];
    const raw = interes + aptitud;
    const value = ((interes + aptitud) / (INTERES_MAX + APTITUD_MAX)) * 100;
    return {
      code: area,
      title: CHASIDE_DIMENSIONS[area].title,
      value,
      raw,
    };
  });

  const topInteres = topTwoAreas(counts.interes);
  const topAptitud = topTwoAreas(counts.aptitud);

  const dominantCodes = topInteres;

  const totalInteres = CHASIDE_AREAS.reduce(
    (acc, a) => acc + counts.interes[a],
    0
  );

  let dominantSummary: string;
  let interpretation: string;

  if (totalInteres === 0) {
    dominantSummary = "Sin respuestas afirmativas registradas.";
    interpretation =
      "No se registraron respuestas afirmativas, por lo que no es posible determinar un perfil de intereses. Te sugerimos volver a responder el cuestionario reflexionando sobre las actividades que realmente disfrutas.";
  } else {
    const primary = CHASIDE_DIMENSIONS[topInteres[0]];
    const secondary = CHASIDE_DIMENSIONS[topInteres[1]];
    dominantSummary = `${primary.title} y ${secondary.title}`;

    const alignment = topInteres[0] === topAptitud[0];
    const alignmentText = alignment
      ? `Además, tu área de mayor aptitud coincide con tu principal interés (${primary.title}), lo que indica una fuerte congruencia entre lo que te gusta y aquello para lo que muestras habilidad.`
      : `Tu área de mayor aptitud (${CHASIDE_DIMENSIONS[topAptitud[0]].title}) difiere de tu principal interés (${primary.title}); conviene reflexionar sobre cómo alinear tus gustos con tus habilidades.`;

    interpretation =
      `Tus intereses dominantes se orientan hacia las áreas ${primary.title} y ${secondary.title}. ` +
      `En cuanto a las aptitudes, destacan ${CHASIDE_DIMENSIONS[topAptitud[0]].title} y ${CHASIDE_DIMENSIONS[topAptitud[1]].title}. ` +
      alignmentText;
  }

  return {
    methodId: "CHASIDE",
    dimensionScores,
    dominantCodes,
    dominantSummary,
    interpretation,
    raw: {
      interes: counts.interes,
      aptitud: counts.aptitud,
      topInteres,
      topAptitud,
    },
  };
}
