// ===========================================================================
// Contrato genérico de "método vocacional" (pluggable).
// Permite exponer distintos instrumentos (RIASEC, CHASIDE, TIPOV) de manera
// uniforme para la UI y la persistencia, sin acoplar el código de RIASEC.
// Funciones puras de puntuación: sin E/S ni efectos secundarios en import.
// Todo el texto de cara al usuario permanece en español.
// ===========================================================================

/** Identificadores de los métodos vocacionales disponibles. */
export type MethodId = "RIASEC" | "CHASIDE" | "TIPOV" | "CIPR";

/** Una dimensión (o escala/área) de un método vocacional. */
export interface MethodDimension {
  /** Código corto de la dimensión (p. ej. "R", "C", "TECNOLOGIA"). */
  code: string;
  /** Título legible en español. */
  title: string;
  /** Descripción breve en español. */
  shortDesc?: string;
  /** Color semántico opcional (hex) para la visualización. */
  color?: string;
}

/**
 * Un ítem/reactivo del cuestionario.
 * `category`/`subScale` permiten instrumentos con doble medición como CHASIDE
 * (ítems de Interés vs Aptitud dentro de la misma área).
 */
export interface MethodQuestion {
  id: number;
  /** Código de la dimensión/área a la que pertenece el ítem. */
  dimension: string;
  text: string;
  /** Categoría del ítem (p. ej. "INTERES" | "APTITUD" en CHASIDE). */
  category?: string;
  /** Subescala opcional para agrupaciones adicionales. */
  subScale?: string;
}

/** Descriptor de la escala de respuesta del instrumento. */
export interface ResponseScale {
  kind: "LIKERT_5" | "LIKERT_3" | "DICHOTOMOUS";
  options: Array<{ value: number; label: string }>;
}

/** Puntaje de una dimensión en el resultado de un método. */
export interface MethodDimensionScore {
  code: string;
  title: string;
  /** Valor normalizado 0-100 para visualización uniforme. */
  value: number;
  /** Puntaje crudo (conteo o suma) según el método. */
  raw?: number;
}

/** Resultado uniforme de la puntuación de un método. */
export interface MethodResult {
  methodId: MethodId;
  dimensionScores: MethodDimensionScore[];
  /** Códigos de las dimensiones dominantes (orden de mayor a menor). */
  dominantCodes: string[];
  /** Resumen corto del perfil dominante (español). */
  dominantSummary: string;
  /** Interpretación extendida (español). */
  interpretation: string;
  /**
   * Datos específicos del método para persistencia/vistas especializadas.
   * P. ej. RIASEC expone aquí sus PsychometricScores (r/i/a/s/e/c).
   */
  raw?: Record<string, unknown>;
}

/**
 * Una respuesta genérica del usuario a un ítem.
 * `value` está en la escala numérica del instrumento
 * (Likert 1-5, Likert 1-3, o dicotómica 0/1).
 */
export interface MethodAnswer {
  questionId: number;
  value: number;
}

/** Contrato que cada método vocacional debe implementar. */
export interface VocationalMethod {
  id: MethodId;
  /** Nombre legible en español. */
  name: string;
  /** Descripción breve en español. */
  shortDescription: string;
  /** Origen/fundamentación en español. */
  origin: string;
  dimensions: MethodDimension[];
  questions: MethodQuestion[];
  scale: ResponseScale;
  /** Función pura que calcula el resultado a partir de las respuestas. */
  score(answers: MethodAnswer[]): MethodResult;
}
