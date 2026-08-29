// ===========================================================================
// Banco de ítems del método TIPOV (Test de Intereses Profesionales para la
// Orientación Vocacional, Carrasco, Zúñiga y Asún, 2021).
// Estructura y calificación tomadas de skills/knowledge/test-tipov.md:
//   66 ítems en 13 dimensiones, escala Likert de 3 puntos:
//     Me agrada (3) / Me es indiferente (2) / Me desagrada (1).
//   La puntuación es la suma cruda por dimensión (mayor = más interés).
//
// NOTA: El documento fuente define la ESTRUCTURA y la CALIFICACIÓN, pero NO
// contiene el banco de ítems completo (sólo un ítem de ejemplo por dimensión).
// La redacción de los reactivos es una ADAPTACIÓN ORIGINAL Y FIEL, usando el
// ítem de ejemplo del documento como semilla de cada dimensión. No es la
// versión verbatim del instrumento.
// Distribución: 5 ítems por dimensión y 6 en "Tecnología" para totalizar 66.
// Todo el texto permanece en español.
// ===========================================================================

import type { MethodDimension, MethodQuestion } from "@/lib/methods/types";

/** Códigos de las 13 dimensiones TIPOV. */
export type TipovDimension =
  | "TECNOLOGIA"
  | "EMPRESA"
  | "CALCULO"
  | "ARTE"
  | "CIENCIAS_SOCIALES"
  | "MUSICA_ARTES_ESCENICAS"
  | "COMUNICACION"
  | "HUMANIDADES"
  | "IDIOMAS"
  | "NATURALEZA"
  | "SALUD"
  | "LEYES"
  | "CIENCIAS_BASICAS";

/** Orden canónico de las 13 dimensiones TIPOV. */
export const TIPOV_DIMENSIONS_ORDER: TipovDimension[] = [
  "TECNOLOGIA",
  "EMPRESA",
  "CALCULO",
  "ARTE",
  "CIENCIAS_SOCIALES",
  "MUSICA_ARTES_ESCENICAS",
  "COMUNICACION",
  "HUMANIDADES",
  "IDIOMAS",
  "NATURALEZA",
  "SALUD",
  "LEYES",
  "CIENCIAS_BASICAS",
];

/** Metadatos (título, descripción, color) de cada dimensión TIPOV. */
export const TIPOV_DIMENSIONS: Record<TipovDimension, MethodDimension> = {
  TECNOLOGIA: {
    code: "TECNOLOGIA",
    title: "Tecnología",
    shortDesc:
      "Aplicación de principios científicos al diseño y uso de técnica industrial e informática.",
    color: "#EA580C",
  },
  EMPRESA: {
    code: "EMPRESA",
    title: "Empresa",
    shortDesc:
      "Elaboración, planificación y administración financiera de organizaciones.",
    color: "#E11D48",
  },
  CALCULO: {
    code: "CALCULO",
    title: "Cálculo",
    shortDesc:
      "Resolución de problemas lógicos, análisis numérico y ecuaciones matemáticas complejas.",
    color: "#4F46E5",
  },
  ARTE: {
    code: "ARTE",
    title: "Arte",
    shortDesc:
      "Actividad creativa plástica, pintura, apreciación estética y crítica artística.",
    color: "#9333EA",
  },
  CIENCIAS_SOCIALES: {
    code: "CIENCIAS_SOCIALES",
    title: "Ciencias Sociales",
    shortDesc:
      "Ayuda comunitaria, docencia e investigación de dinámicas y problemas sociales.",
    color: "#16A34A",
  },
  MUSICA_ARTES_ESCENICAS: {
    code: "MUSICA_ARTES_ESCENICAS",
    title: "Música y Artes Escénicas",
    shortDesc:
      "Interpretación y composición musical; incluye actuación y danza.",
    color: "#C026D3",
  },
  COMUNICACION: {
    code: "COMUNICACION",
    title: "Comunicación",
    shortDesc:
      "Producción y difusión de mensajes en medios, periodismo y relaciones públicas.",
    color: "#0EA5E9",
  },
  HUMANIDADES: {
    code: "HUMANIDADES",
    title: "Humanidades",
    shortDesc:
      "Estudio de la historia, la filosofía, la literatura y el pensamiento humano.",
    color: "#B45309",
  },
  IDIOMAS: {
    code: "IDIOMAS",
    title: "Idiomas",
    shortDesc:
      "Aprendizaje y traducción de lenguas extranjeras y turismo internacional.",
    color: "#0D9488",
  },
  NATURALEZA: {
    code: "NATURALEZA",
    title: "Naturaleza",
    shortDesc:
      "Trabajo en espacios naturales, silvicultura, agronomía y cuidado agropecuario.",
    color: "#65A30D",
  },
  SALUD: {
    code: "SALUD",
    title: "Salud",
    shortDesc:
      "Cuidado hospitalario, prevención médica, nutrición y rehabilitación física.",
    color: "#059669",
  },
  LEYES: {
    code: "LEYES",
    title: "Leyes",
    shortDesc:
      "Aplicación e interpretación del marco legal, litigios jurídicos y mediación.",
    color: "#7C3AED",
  },
  CIENCIAS_BASICAS: {
    code: "CIENCIAS_BASICAS",
    title: "Ciencias Básicas",
    shortDesc:
      "Investigación científica pura en física teórica, química y biología molecular.",
    color: "#0891B2",
  },
};

/**
 * Ítems por dimensión. El primer ítem de cada dimensión toma como semilla el
 * ejemplo del documento fuente. "Tecnología" incluye 6 para totalizar 66.
 */
const ITEMS: Record<TipovDimension, string[]> = {
  TECNOLOGIA: [
    "Construir obras, como casas, puentes y edificios.",
    "Diseñar y mejorar máquinas o herramientas industriales.",
    "Reparar equipos electrónicos o computacionales.",
    "Aplicar avances tecnológicos para resolver problemas prácticos.",
    "Desarrollar programas y aplicaciones informáticas.",
    "Automatizar procesos de una fábrica o taller.",
  ],
  EMPRESA: [
    "Dirigir una empresa y supervisar condiciones de trabajo.",
    "Planificar la estrategia comercial de una organización.",
    "Analizar la situación financiera de un negocio.",
    "Administrar los recursos económicos de una institución.",
    "Emprender y poner en marcha un negocio propio.",
  ],
  CALCULO: [
    "Resolver ecuaciones matemáticas y juegos de ingenio.",
    "Analizar datos numéricos para encontrar patrones.",
    "Aplicar fórmulas lógicas a problemas complejos.",
    "Elaborar modelos matemáticos de fenómenos reales.",
    "Calcular probabilidades y estadísticas de un estudio.",
  ],
  ARTE: [
    "Hacer esculturas, analizar y criticar pinturas.",
    "Pintar cuadros o ilustrar de forma creativa.",
    "Diseñar objetos o espacios con sentido estético.",
    "Apreciar la belleza de las formas y los volúmenes.",
    "Crear obras visuales que expresen ideas y emociones.",
  ],
  CIENCIAS_SOCIALES: [
    "Dar clases a jóvenes e investigar costumbres antiguas.",
    "Ayudar a comunidades a resolver problemas sociales.",
    "Investigar las dinámicas de los grupos humanos.",
    "Diseñar programas de apoyo para poblaciones vulnerables.",
    "Estudiar el comportamiento de la sociedad.",
  ],
  MUSICA_ARTES_ESCENICAS: [
    "Participar en una obra de teatro y tocar en un grupo.",
    "Componer o arreglar piezas musicales.",
    "Interpretar un instrumento ante el público.",
    "Bailar o coreografiar una presentación de danza.",
    "Actuar y dar vida a personajes en escena.",
  ],
  COMUNICACION: [
    "Escribir cuentos, crónicas o artículos en prensa.",
    "Redactar noticias y reportajes para medios masivos.",
    "Producir contenidos audiovisuales para difusión.",
    "Gestionar la imagen pública de una organización.",
    "Entrevistar personas y difundir la información obtenida.",
  ],
  HUMANIDADES: [
    "Analizar textos históricos y leer obras clásicas de literatura.",
    "Reflexionar sobre problemas filosóficos y éticos.",
    "Investigar el origen y la evolución del pensamiento humano.",
    "Estudiar la historia de las civilizaciones.",
    "Interpretar el significado de las grandes obras literarias.",
  ],
  IDIOMAS: [
    "Traducir artículos científicos a otro idioma.",
    "Aprender a comunicarte con fluidez en lenguas extranjeras.",
    "Interpretar conversaciones entre personas de distintos países.",
    "Guiar a turistas internacionales en su idioma.",
    "Estudiar la gramática y el vocabulario de otras lenguas.",
  ],
  NATURALEZA: [
    "Preservar la flora y fauna en peligro de extinción.",
    "Trabajar al aire libre en bosques o campos.",
    "Cultivar la tierra y cuidar cultivos agrícolas.",
    "Criar y cuidar animales de granja o silvestres.",
    "Proteger los ecosistemas y el medio ambiente.",
  ],
  SALUD: [
    "Aprender anatomía e investigar tratamientos médicos.",
    "Atender y cuidar a pacientes en un hospital.",
    "Orientar a las personas sobre nutrición y hábitos saludables.",
    "Rehabilitar físicamente a quienes han sufrido lesiones.",
    "Prevenir enfermedades mediante campañas de salud.",
  ],
  LEYES: [
    "Asesorar a personas en juicios de divorcio.",
    "Interpretar y aplicar las leyes en un litigio.",
    "Defender los derechos de un cliente ante un tribunal.",
    "Mediar en conflictos legales entre las partes.",
    "Estudiar códigos y normas jurídicas.",
  ],
  CIENCIAS_BASICAS: [
    "Investigar en laboratorio y entender las causas del Universo.",
    "Experimentar con reacciones químicas puras.",
    "Estudiar las leyes fundamentales de la física teórica.",
    "Analizar la estructura molecular de los seres vivos.",
    "Formular teorías científicas y comprobarlas.",
  ],
};

/**
 * Construye el banco completo de 66 ítems con IDs correlativos, en el orden
 * canónico de las 13 dimensiones.
 */
function buildQuestions(): MethodQuestion[] {
  const questions: MethodQuestion[] = [];
  let id = 1;
  for (const dimension of TIPOV_DIMENSIONS_ORDER) {
    for (const text of ITEMS[dimension]) {
      questions.push({ id: id++, dimension, text });
    }
  }
  return questions;
}

/** Banco completo de 66 ítems Likert-3 de TIPOV. */
export const TIPOV_QUESTIONS: MethodQuestion[] = buildQuestions();
