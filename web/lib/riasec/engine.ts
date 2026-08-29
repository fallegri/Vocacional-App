// ===========================================================================
// Motor psicométrico RIASEC - portado verbatim desde
// app/src/main/java/com/example/domain/PsychometricEngine.kt
// Funciones puras. Todo el texto de cara al usuario permanece en español.
// ===========================================================================

import {
  DIMENSION_ORDER,
  type AssessmentAnswer,
  type AssessmentQuestion,
  type Career,
  type CareerMatch,
  type DimensionCode,
  type PsychometricScores,
  type QualityMetric,
} from "@/lib/riasec/types";

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function getScore(scores: PsychometricScores, code: DimensionCode): number {
  switch (code) {
    case "R":
      return scores.r;
    case "I":
      return scores.i;
    case "A":
      return scores.a;
    case "S":
      return scores.s;
    case "E":
      return scores.e;
    case "C":
      return scores.c;
  }
}

/** Devuelve los pares (dimensión, puntaje) ordenados de mayor a menor. */
function scoresSortedDesc(
  scores: PsychometricScores
): Array<[DimensionCode, number]> {
  const list: Array<[DimensionCode, number]> = DIMENSION_ORDER.map((code) => [
    code,
    getScore(scores, code),
  ]);
  // Ordenamiento estable descendente (equivalente a sortedByDescending de Kotlin).
  return list
    .map((entry, index) => ({ entry, index }))
    .sort((x, y) => {
      if (y.entry[1] !== x.entry[1]) return y.entry[1] - x.entry[1];
      return x.index - y.index;
    })
    .map((wrapped) => wrapped.entry);
}

/** Top-N dimensiones dominantes ordenadas de mayor a menor. */
export function getDominantDimensions(
  scores: PsychometricScores,
  topCount = 3
): Array<[DimensionCode, number]> {
  return scoresSortedDesc(scores).slice(0, topCount);
}

/** Código dominante: letras de las top-N dimensiones concatenadas. */
export function getDominantCode(
  scores: PsychometricScores,
  topCount = 3
): string {
  return getDominantDimensions(scores, topCount)
    .map(([code]) => code)
    .join("");
}

/**
 * Calcula los puntajes normalizados (0 - 100) de las 6 dimensiones RIASEC.
 */
export function calculateScores(
  answers: Map<number, AssessmentAnswer>,
  questions: AssessmentQuestion[]
): PsychometricScores {
  const questionsByDimension = new Map<DimensionCode, AssessmentQuestion[]>();
  for (const q of questions) {
    const bucket = questionsByDimension.get(q.dimension);
    if (bucket) bucket.push(q);
    else questionsByDimension.set(q.dimension, [q]);
  }

  const calculateDimensionScore = (dimension: DimensionCode): number => {
    const dimQuestions = questionsByDimension.get(dimension);
    if (!dimQuestions) return 0;
    const totalQuestions = dimQuestions.length;
    if (totalQuestions === 0) return 0;

    let sumShifted = 0;
    let answeredCount = 0;

    for (const q of dimQuestions) {
      const ans = answers.get(q.id);
      if (ans != null) {
        sumShifted += clamp(ans.score - 1, 0, 4);
        answeredCount++;
      }
    }

    if (answeredCount === 0) return 0;
    // Escala según los ítems respondidos (máximo 4 por ítem).
    const maxPossible = 4 * answeredCount;
    return clamp((sumShifted / maxPossible) * 100, 0, 100);
  };

  return {
    r: calculateDimensionScore("R"),
    i: calculateDimensionScore("I"),
    a: calculateDimensionScore("A"),
    s: calculateDimensionScore("S"),
    e: calculateDimensionScore("E"),
    c: calculateDimensionScore("C"),
  };
}

/**
 * Validación heurística de calidad: speed trap, straight-lining y consistencia
 * de pares espejo.
 */
export function evaluateQuality(
  answers: Map<number, AssessmentAnswer>,
  questions: AssessmentQuestion[]
): QualityMetric {
  const answerList = Array.from(answers.values());
  if (answerList.length === 0) {
    return {
      isValid: false,
      straightLiningDetected: false,
      averageResponseTimeMs: 0,
      speedTrapTriggered: false,
      mirrorConsistencyPercent: 100,
      reliabilityLevel: "Insuficiente",
      warningMessage: "No hay suficientes respuestas registradas.",
    };
  }

  // 1. Speed trap (< 1100 ms por pregunta).
  const validTimes = answerList
    .map((a) => a.timeSpentMs)
    .filter((t) => t > 0);
  const avgTime =
    validTimes.length > 0
      ? Math.trunc(
          validTimes.reduce((acc, t) => acc + t, 0) / validTimes.length
        )
      : 2500;
  const speedTrapTriggered = avgTime < 1100 && validTimes.length >= 10;

  // 2. Straight-lining (monotonía).
  const scoreCounts = new Map<number, number>();
  for (const a of answerList) {
    scoreCounts.set(a.score, (scoreCounts.get(a.score) ?? 0) + 1);
  }
  let maxScoreFrequency = 0;
  for (const count of scoreCounts.values()) {
    if (count > maxScoreFrequency) maxScoreFrequency = count;
  }
  const repetitionRatio = maxScoreFrequency / answerList.length;
  const straightLiningDetected =
    repetitionRatio >= 0.75 && answerList.length >= 15;

  // 3. Consistencia de pares espejo.
  const mirrorQuestions = questions.filter((q) => q.mirrorPairId != null);
  let consistencyPenalty = 0;

  for (const q of mirrorQuestions) {
    const pairId = q.mirrorPairId;
    if (pairId == null) continue;
    if (q.id < pairId) {
      // Cada par se revisa una sola vez.
      const ans1 = answers.get(q.id);
      const ans2 = answers.get(pairId);
      if (ans1 != null && ans2 != null) {
        const diff = Math.abs(ans1.score - ans2.score);
        if (diff >= 3) {
          consistencyPenalty += 20;
        } else if (diff === 2) {
          consistencyPenalty += 10;
        }
      }
    }
  }

  const mirrorConsistencyPercent = clamp(100 - consistencyPenalty, 40, 100);

  const isValid =
    !straightLiningDetected &&
    !(speedTrapTriggered && mirrorConsistencyPercent < 60);

  let reliabilityLevel: string;
  if (!isValid || mirrorConsistencyPercent < 60) {
    reliabilityLevel = "Baja";
  } else if (speedTrapTriggered || mirrorConsistencyPercent < 80) {
    reliabilityLevel = "Moderada";
  } else {
    reliabilityLevel = "Alta";
  }

  let warning: string | null;
  if (straightLiningDetected) {
    warning =
      "Se detectó un patrón de respuestas monótono. Se recomienda reflexionar con mayor variabilidad para un diagnóstico preciso.";
  } else if (speedTrapTriggered) {
    warning = `El tiempo promedio por pregunta fue muy rápido (${avgTime} ms). Verifica si las respuestas fueron reflexivas.`;
  } else if (mirrorConsistencyPercent < 75) {
    warning =
      "Existen algunas ligeras discrepancias en preguntas de control, pero los resultados son utilizables.";
  } else {
    warning = null;
  }

  return {
    isValid,
    straightLiningDetected,
    averageResponseTimeMs: avgTime,
    speedTrapTriggered,
    mirrorConsistencyPercent,
    reliabilityLevel,
    warningMessage: warning,
  };
}

function vectorMagnitude(v: number[]): number {
  let sumSq = 0;
  for (const x of v) sumSq += x * x;
  return Math.sqrt(sumSq);
}

function careerIdealScores(career: Career): PsychometricScores {
  return {
    r: career.idealR,
    i: career.idealI,
    a: career.idealA,
    s: career.idealS,
    e: career.idealE,
    c: career.idealC,
  };
}

/**
 * Calcula la similitud entre el vector del usuario y los vectores ideales de
 * cada carrera (70% coseno + 30% proximidad euclidiana).
 */
export function matchCareers(
  userScores: PsychometricScores,
  catalog: Career[]
): CareerMatch[] {
  const u = [
    userScores.r,
    userScores.i,
    userScores.a,
    userScores.s,
    userScores.e,
    userScores.c,
  ];
  const uNorm = vectorMagnitude(u);

  if (uNorm === 0) {
    return catalog.map((career) => ({
      career,
      affinityPercentage: 50,
      matchLevel: "Moderada",
      primaryDimensionMatch: false,
    }));
  }

  const userDominant = getDominantDimensions(userScores, 1)[0]?.[0];

  const matches = catalog.map((career) => {
    const c = [
      career.idealR,
      career.idealI,
      career.idealA,
      career.idealS,
      career.idealE,
      career.idealC,
    ];
    const cNorm = vectorMagnitude(c);

    let dotProduct = 0;
    for (let k = 0; k < 6; k++) {
      dotProduct += u[k] * c[k];
    }

    const cosineSim = cNorm > 0 ? dotProduct / (uNorm * cNorm) : 0.5;

    // Proximidad euclidiana en [0, 1].
    let euclideanDistanceSq = 0;
    for (let k = 0; k < 6; k++) {
      const diff = (u[k] - c[k]) / 100;
      euclideanDistanceSq += diff * diff;
    }
    const euclideanDistance = Math.sqrt(euclideanDistanceSq); // máx ≈ sqrt(6) ≈ 2.45
    const euclideanProximity = clamp(1 - euclideanDistance / 2.45, 0, 1);

    // Afinidad combinada: 70% coseno + 30% proximidad euclidiana.
    let affinity = (cosineSim * 0.7 + euclideanProximity * 0.3) * 100;

    // Compatibilidad de dimensión principal.
    const careerDominant = getDominantDimensions(
      careerIdealScores(career),
      1
    )[0]?.[0];
    const primaryMatch = userDominant != null && userDominant === careerDominant;

    if (primaryMatch) {
      affinity = Math.min(affinity * 1.05, 99.5);
    }

    const finalAffinity = clamp(affinity, 30, 99);

    let matchLevel: string;
    if (finalAffinity >= 88) {
      matchLevel = "Compatibilidad Excelente";
    } else if (finalAffinity >= 78) {
      matchLevel = "Alta Afinidad";
    } else if (finalAffinity >= 68) {
      matchLevel = "Buena Afinidad";
    } else {
      matchLevel = "Afinidad Moderada";
    }

    const match: CareerMatch = {
      career,
      affinityPercentage: finalAffinity,
      matchLevel,
      primaryDimensionMatch: primaryMatch,
    };
    return match;
  });

  return matches
    .map((entry, index) => ({ entry, index }))
    .sort((x, y) => {
      if (y.entry.affinityPercentage !== x.entry.affinityPercentage) {
        return y.entry.affinityPercentage - x.entry.affinityPercentage;
      }
      return x.index - y.index;
    })
    .map((wrapped) => wrapped.entry);
}

/** Descripción del perfil dominante según el mapa de 2 letras (español). */
export function getDominantProfileDescription(dominantCode: string): string {
  const key = dominantCode.slice(0, 2);
  switch (key) {
    case "IR":
    case "RI":
      return "Perfil Tecnológico e Investigativo. Destacas por combinar la rigurosidad científica y el análisis con la aplicación práctica y técnica en sistemas complejos.";
    case "IA":
    case "AI":
      return "Perfil Científico-Creativo e Innovador. Te impulsa explorar nuevas ideas, resolver problemas abstractos y formular soluciones visuales o conceptuales disruptivas.";
    case "IS":
    case "SI":
      return "Perfil Humanístico-Científico. Interés profundo en comprender el comportamiento humano, la salud, la psicología y la educación a través del rigor del método científico.";
    case "IE":
    case "EI":
      return "Perfil Estratégico y de Desarrollo. Combina la capacidad analítica de datos con visión de liderazgo, innovación tecnológica y desarrollo de modelos de negocio.";
    case "IC":
    case "CI":
      return "Perfil de Arquitectura de Información y Precisión. Enfoque meticuloso en el análisis cuantitativo, la computación, las finanzas cuantitativas y la investigación estructurada.";
    case "AS":
    case "SA":
      return "Perfil Social-Artístico y Comunicacional. Gran empatía, talento para la comunicación interpersonal, artes expresivas, diseño de impacto social y docencia creativa.";
    case "AE":
    case "EA":
      return "Perfil Emprendedor Creativo. Talento para el marketing, publicidad, dirección de arte, diseño de marcas y generación de proyectos innovadores con alta visibilidad.";
    case "AC":
    case "CA":
      return "Perfil de Diseño Metódico. Capacidad para traducir conceptos estéticos en documentación técnica, diseño arquitectónico, UX estructurado y producción digital.";
    case "SE":
    case "ES":
      return "Perfil de Liderazgo Social y Gestión Humana. Habilidad nata para liderar equipos, relaciones públicas, derecho, recursos humanos y dirección institucional.";
    case "SC":
    case "CS":
      return "Perfil de Apoyo Operativo y Organizacional. Compromiso con el servicio estructurado, administración de salud, trabajo social protocolizado y pedagogía metódica.";
    case "ER":
    case "RE":
      return "Perfil de Gestión Industrial y Operaciones. Liderazgo en el terreno de la ingeniería civil, logística, agronomía, construcción y dirección de plantas industriales.";
    case "EC":
    case "CE":
      return "Perfil Corporativo y de Finanzas. Visión estratégica enfocada en resultados, administración de empresas, finanzas corporativas, auditoría y comercio internacional.";
    case "RC":
    case "CR":
      return "Perfil Técnico-Especializado y Logístico. Destreza en el mantenimiento de infraestructuras, telecomunicaciones, ciberseguridad operativa y gestión de calidad técnica.";
    case "RA":
    case "AR":
      return "Perfil de Diseño Industrial y Artesanal. Combinación de destrezas manuales con sensibilidad artística, diseño de producto, escenografía y animación.";
    case "RS":
    case "SR":
      return "Perfil de Entrenamiento y Acción Social. Interés en fisioterapia, terapia ocupacional, rescate, deporte y capacitación práctica comunitaria.";
    default:
      return `Perfil Multifacético con fortalezas equilibradas en ${dominantCode}. Cuentas con versatilidad para desenvolverte en campos interdisciplinarios.`;
  }
}
