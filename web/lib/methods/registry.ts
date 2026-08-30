// ===========================================================================
// Registro central de métodos vocacionales (fuente única de verdad).
// Expone RIASEC (por defecto), CHASIDE y TIPOV como objetos VocationalMethod,
// además de helpers para obtenerlos y normalizar el identificador recibido.
// Todo el texto de cara al usuario permanece en español.
// ===========================================================================

import type {
  MethodId,
  ResponseScale,
  VocationalMethod,
} from "@/lib/methods/types";
import { RIASEC_METHOD } from "@/lib/methods/riasec-adapter";
import {
  CHASIDE_DIMENSIONS,
  CHASIDE_AREAS,
  CHASIDE_QUESTIONS,
} from "@/lib/methods/chaside/data";
import { scoreChaside } from "@/lib/methods/chaside/engine";
import {
  TIPOV_DIMENSIONS,
  TIPOV_DIMENSIONS_ORDER,
  TIPOV_QUESTIONS,
} from "@/lib/methods/tipov/data";
import { scoreTipov } from "@/lib/methods/tipov/engine";
import {
  CIPR_DIMENSIONS,
  CIPR_SCALES_ORDER,
  CIPR_QUESTIONS,
} from "@/lib/methods/cipr/data";
import { scoreCipr } from "@/lib/methods/cipr/engine";
import {
  MAGDALENA_DIMENSIONS,
  MAGDALENA_FIELDS,
  MAGDALENA_QUESTIONS,
} from "@/lib/methods/magdalena/data";
import { scoreMagdalena } from "@/lib/methods/magdalena/engine";

const CHASIDE_SCALE: ResponseScale = {
  kind: "DICHOTOMOUS",
  options: [
    { value: 1, label: "Sí" },
    { value: 0, label: "No" },
  ],
};

const TIPOV_SCALE: ResponseScale = {
  kind: "LIKERT_3",
  options: [
    { value: 3, label: "Me agrada" },
    { value: 2, label: "Me es indiferente" },
    { value: 1, label: "Me desagrada" },
  ],
};

// Opciones ordenadas de mayor a menor atracción para que coincidan con el
// mapeo del motor (Agrado = 2, Indiferencia = 1, Desagrado = 0).
const CIPR_SCALE: ResponseScale = {
  kind: "LIKERT_3",
  options: [
    { value: 2, label: "Agrado" },
    { value: 1, label: "Indiferencia" },
    { value: 0, label: "Desagrado" },
  ],
};

const CHASIDE_METHOD: VocationalMethod = {
  id: "CHASIDE",
  name: "CHASIDE",
  shortDescription:
    "Instrumento de autorreporte que evalúa por separado los intereses y las aptitudes en siete áreas profesionales (C, H, A, S, I, D, E).",
  origin:
    "Basado en el modelo hexagonal de Holland; instrumento ampliamente aplicado y validado en América Latina.",
  dimensions: CHASIDE_AREAS.map((area) => CHASIDE_DIMENSIONS[area]),
  questions: CHASIDE_QUESTIONS,
  scale: CHASIDE_SCALE,
  score: scoreChaside,
};

const TIPOV_METHOD: VocationalMethod = {
  id: "TIPOV",
  name: "TIPOV",
  shortDescription:
    "Test de Intereses Profesionales para la Orientación Vocacional que mide 13 dimensiones de interés mediante una escala de agrado de tres puntos.",
  origin:
    "Desarrollado por Carrasco, Zúñiga y Asún (Universidad de Chile, 2021) sobre la Teoría Sociocognitiva de Carrera y el inventario CIP-4.",
  dimensions: TIPOV_DIMENSIONS_ORDER.map((dim) => TIPOV_DIMENSIONS[dim]),
  questions: TIPOV_QUESTIONS,
  scale: TIPOV_SCALE,
  score: scoreTipov,
};

// Escala 0-4 (5 opciones) usada por el Test Magdalena Contreras. Se ordena de
// mayor a menor para que la leyenda izquierda/derecha del AssessmentClient
// muestre el extremo alto y el bajo de forma consistente. Las etiquetas usan la
// redacción de INTERÉS como primaria; la vista de resultados distingue
// Interés vs. Aptitud.
const MAGDALENA_SCALE: ResponseScale = {
  kind: "LIKERT_0_4",
  options: [
    { value: 0, label: "Me desagrada mucho" },
    { value: 1, label: "Me desagrada algo" },
    { value: 2, label: "Me es indiferente" },
    { value: 3, label: "Me gusta algo" },
    { value: 4, label: "Me gusta mucho" },
  ],
};

const CIPR_METHOD: VocationalMethod = {
  id: "CIPR",
  name: "CIP-R",
  shortDescription:
    "Cuestionario de Intereses Profesionales Revisado que mide 15 escalas primarias de interés mediante una escala de opción única de agrado (Agrado / Indiferencia / Desagrado).",
  origin:
    "Diseñado por Hermelinda Fogliatto (1991, 1993) y revisado por Fogliatto, Pérez, Olaz y Parodi (2003) en Argentina; instrumento local del Cono Sur para jóvenes desde los 15-17 años.",
  dimensions: CIPR_SCALES_ORDER.map((scale) => CIPR_DIMENSIONS[scale]),
  questions: CIPR_QUESTIONS,
  scale: CIPR_SCALE,
  score: scoreCipr,
};

const MAGDALENA_METHOD: VocationalMethod = {
  id: "MAGDALENA",
  name: "Test Magdalena Contreras",
  shortDescription:
    "Instrumento de doble medición que evalúa por separado el Interés y la Aptitud autopercibida en 10 campos de trabajo, mediante dos cuestionarios paralelos con escala 0-4.",
  origin:
    "Test de Orientación Vocacional de la Alcaldía La Magdalena Contreras (Ciudad de México, 2021), adaptado por Lizarazo (2024, UNICISO); evalúa Interés y Aptitud sobre 10 campos con bandas de interpretación.",
  dimensions: MAGDALENA_FIELDS.map((field) => MAGDALENA_DIMENSIONS[field]),
  questions: MAGDALENA_QUESTIONS,
  scale: MAGDALENA_SCALE,
  score: scoreMagdalena,
};

/** Método por defecto de la aplicación. */
export const DEFAULT_METHOD_ID: MethodId = "RIASEC";

/** Registro de todos los métodos disponibles. */
export const METHODS: Record<MethodId, VocationalMethod> = {
  RIASEC: RIASEC_METHOD,
  CHASIDE: CHASIDE_METHOD,
  TIPOV: TIPOV_METHOD,
  CIPR: CIPR_METHOD,
  MAGDALENA: MAGDALENA_METHOD,
};

/** Devuelve el método por su identificador. */
export function getMethod(id: MethodId): VocationalMethod {
  return METHODS[id];
}

/** Lista todos los métodos disponibles. */
export function listMethods(): VocationalMethod[] {
  return Object.values(METHODS);
}

/**
 * Normaliza un valor arbitrario a un MethodId válido.
 * Cualquier valor desconocido o ausente vuelve al método por defecto (RIASEC).
 */
export function normalizeMethodId(value: unknown): MethodId {
  if (typeof value === "string") {
    const upper = value.toUpperCase();
    if (
      upper === "RIASEC" ||
      upper === "CHASIDE" ||
      upper === "TIPOV" ||
      upper === "CIPR" ||
      upper === "MAGDALENA"
    ) {
      return upper as MethodId;
    }
  }
  return DEFAULT_METHOD_ID;
}
