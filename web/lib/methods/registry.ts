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

/** Método por defecto de la aplicación. */
export const DEFAULT_METHOD_ID: MethodId = "RIASEC";

/** Registro de todos los métodos disponibles. */
export const METHODS: Record<MethodId, VocationalMethod> = {
  RIASEC: RIASEC_METHOD,
  CHASIDE: CHASIDE_METHOD,
  TIPOV: TIPOV_METHOD,
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
    if (upper === "RIASEC" || upper === "CHASIDE" || upper === "TIPOV") {
      return upper as MethodId;
    }
  }
  return DEFAULT_METHOD_ID;
}
