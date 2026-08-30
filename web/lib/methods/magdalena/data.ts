// ===========================================================================
// Banco de ítems del Test de Orientación Vocacional de la Alcaldía La
// Magdalena Contreras (adaptación de Lizarazo, 2024).
// Estructura y calificación tomadas de skills/knowledge/test-magdalena-contreras.md:
//   DOS cuestionarios paralelos sobre los MISMOS 10 campos de trabajo:
//     - Intereses: 60 ítems (10 campos x 6), escala 0-4.
//     - Aptitudes: 60 ítems (10 campos x 6), escala 0-4.
//   Total: 120 ítems. Cada campo acumula un máximo de 24 puntos por dimensión
//   (6 ítems x 4 puntos).
//
// NOTA: El documento fuente define la ESTRUCTURA y la CALIFICACIÓN del test
// (los 10 campos, las escalas 0-4 y las bandas de interpretación), pero NO
// contiene el banco de ítems textual. Por ello la redacción de los reactivos es
// una ADAPTACIÓN ORIGINAL Y FIEL, consistente con la descripción de cada campo
// en la fuente. No es la versión verbatim del instrumento municipal.
// Todo el texto permanece en español.
// ===========================================================================

import type { MethodDimension, MethodQuestion } from "@/lib/methods/types";

/** Códigos de los 10 campos de trabajo del test. */
export type MagdalenaField =
  | "SERVICIO_SOCIAL"
  | "EJECUTIVO_PERSUASIVO"
  | "VERBAL"
  | "ARTISTICO_PLASTICA"
  | "MUSICAL"
  | "ORGANIZACION"
  | "CIENTIFICA"
  | "CALCULO"
  | "MECANICO_CONSTRUCTIVA"
  | "AIRE_LIBRE";

/** Orden canónico de los 10 campos de trabajo. */
export const MAGDALENA_FIELDS: MagdalenaField[] = [
  "SERVICIO_SOCIAL",
  "EJECUTIVO_PERSUASIVO",
  "VERBAL",
  "ARTISTICO_PLASTICA",
  "MUSICAL",
  "ORGANIZACION",
  "CIENTIFICA",
  "CALCULO",
  "MECANICO_CONSTRUCTIVA",
  "AIRE_LIBRE",
];

/** Categorías de medición del test (dos cuestionarios paralelos). */
export type MagdalenaCategory = "INTERES" | "APTITUD";

/** Metadatos (título, descripción, color) de cada campo de trabajo. */
export const MAGDALENA_DIMENSIONS: Record<MagdalenaField, MethodDimension> = {
  SERVICIO_SOCIAL: {
    code: "SERVICIO_SOCIAL",
    title: "Servicio Social",
    shortDesc:
      "Actividades encaminadas al bienestar de otras personas, comprensión de problemas humanos y auxilio social.",
    color: "#16A34A",
  },
  EJECUTIVO_PERSUASIVO: {
    code: "EJECUTIVO_PERSUASIVO",
    title: "Ejecutivo-Persuasivo",
    shortDesc:
      "Planear, organizar o dirigir grupos, liderar proyectos y convencer mediante la argumentación.",
    color: "#E11D48",
  },
  VERBAL: {
    code: "VERBAL",
    title: "Verbal",
    shortDesc:
      "Expresarse oralmente y por escrito, gusto por la lectura, la literatura y la argumentación en público.",
    color: "#0EA5E9",
  },
  ARTISTICO_PLASTICA: {
    code: "ARTISTICO_PLASTICA",
    title: "Artístico-Plástica",
    shortDesc:
      "Actividades creativas visuales (dibujo, pintura, escultura, decoración) y apreciación de la estética.",
    color: "#9333EA",
  },
  MUSICAL: {
    code: "MUSICAL",
    title: "Musical",
    shortDesc:
      "Ejecución de instrumentos, canto, teoría musical y composición; destreza para reproducir y afinar tonalidades.",
    color: "#C026D3",
  },
  ORGANIZACION: {
    code: "ORGANIZACION",
    title: "Organización",
    shortDesc:
      "Orden, clasificación sistemática, archivo de documentos y estructuración de programas de oficina.",
    color: "#4F46E5",
  },
  CIENTIFICA: {
    code: "CIENTIFICA",
    title: "Científica",
    shortDesc:
      "Investigar las causas, factores y principios que explican los fenómenos de la naturaleza o la sociedad mediante experimentos.",
    color: "#0891B2",
  },
  CALCULO: {
    code: "CALCULO",
    title: "Cálculo",
    shortDesc:
      "Rapidez mental para cálculos matemáticos, operaciones aritméticas/algebraicas abstractas y manejo de datos cuantitativos.",
    color: "#F59E0B",
  },
  MECANICO_CONSTRUCTIVA: {
    code: "MECANICO_CONSTRUCTIVA",
    title: "Mecánico-Constructiva",
    shortDesc:
      "Manejo de herramientas, desarmar y rearmar mecanismos y proyectar/diseñar piezas móviles u objetos físicos.",
    color: "#EA580C",
  },
  AIRE_LIBRE: {
    code: "AIRE_LIBRE",
    title: "Trabajo al Aire Libre",
    shortDesc:
      "Actividades campestres, agrícolas, zootecnia o montañismo en espacios abiertos; incluye motricidad fina y precisión manual.",
    color: "#65A30D",
  },
};

/** Ítems del cuestionario de INTERESES: 6 por campo (escala 0-4). */
const INTERES: Record<MagdalenaField, string[]> = {
  SERVICIO_SOCIAL: [
    "Ayudar a personas que atraviesan una situación difícil.",
    "Participar en programas de bienestar y apoyo comunitario.",
    "Escuchar y comprender los problemas de los demás.",
    "Colaborar como voluntario en causas sociales.",
    "Acompañar y orientar a quienes lo necesitan.",
    "Organizar actividades solidarias para tu comunidad.",
  ],
  EJECUTIVO_PERSUASIVO: [
    "Dirigir y coordinar el trabajo de un grupo de personas.",
    "Planear y organizar las actividades de un proyecto.",
    "Convencer a otros mediante argumentos bien fundados.",
    "Liderar equipos hacia una meta común.",
    "Negociar acuerdos entre distintas partes.",
    "Tomar decisiones que orienten a una organización.",
  ],
  VERBAL: [
    "Escribir textos, ensayos o relatos con soltura.",
    "Leer libros, artículos y obras literarias.",
    "Expresar tus ideas en público con claridad.",
    "Debatir y argumentar sobre distintos temas.",
    "Corregir y mejorar la redacción de un texto.",
    "Aprender el uso preciso de las palabras.",
  ],
  ARTISTICO_PLASTICA: [
    "Dibujar, pintar o ilustrar de forma creativa.",
    "Modelar esculturas o figuras con distintos materiales.",
    "Decorar espacios cuidando la estética y el color.",
    "Diseñar objetos visualmente atractivos.",
    "Apreciar y comentar obras de arte visual.",
    "Combinar formas, proporciones y colores con armonía.",
  ],
  MUSICAL: [
    "Tocar un instrumento musical.",
    "Cantar o interpretar canciones.",
    "Estudiar teoría musical y solfeo.",
    "Componer o arreglar piezas musicales.",
    "Reproducir y afinar tonalidades con precisión.",
    "Asistir a conciertos y analizar la música.",
  ],
  ORGANIZACION: [
    "Ordenar y clasificar documentos e información.",
    "Llevar registros y archivos de forma sistemática.",
    "Estructurar los procesos de una oficina.",
    "Planificar agendas y calendarios de trabajo.",
    "Controlar que las tareas se cumplan con orden.",
    "Diseñar sistemas para organizar datos.",
  ],
  CIENTIFICA: [
    "Investigar las causas de los fenómenos naturales.",
    "Realizar experimentos para comprobar una hipótesis.",
    "Estudiar los principios que explican la naturaleza o la sociedad.",
    "Observar y registrar datos de un proceso científico.",
    "Analizar resultados para extraer conclusiones.",
    "Buscar explicaciones a preguntas del mundo que te rodea.",
  ],
  CALCULO: [
    "Resolver operaciones y problemas matemáticos.",
    "Trabajar con números y datos cuantitativos.",
    "Aplicar fórmulas y ecuaciones algebraicas.",
    "Hacer cálculos mentales con rapidez.",
    "Analizar estadísticas y porcentajes.",
    "Manipular información numérica para tomar decisiones.",
  ],
  MECANICO_CONSTRUCTIVA: [
    "Armar y desarmar aparatos y mecanismos.",
    "Reparar máquinas o dispositivos.",
    "Manejar herramientas para construir objetos.",
    "Diseñar y proyectar piezas móviles.",
    "Comprender cómo funcionan las máquinas por dentro.",
    "Construir estructuras a partir de un plano.",
  ],
  AIRE_LIBRE: [
    "Realizar actividades campestres o agrícolas.",
    "Cuidar animales de granja o silvestres.",
    "Explorar y hacer montañismo en lugares abiertos.",
    "Trabajar la tierra y cultivar plantas.",
    "Realizar labores que requieren precisión manual.",
    "Pasar tiempo trabajando al aire libre.",
  ],
};

/** Ítems del cuestionario de APTITUDES: 6 por campo (escala 0-4). */
const APTITUD: Record<MagdalenaField, string[]> = {
  SERVICIO_SOCIAL: [
    "Me considero competente para ayudar a personas en dificultades.",
    "Tengo facilidad para comprender los problemas de los demás.",
    "Sé escuchar con atención y empatía.",
    "Soy capaz de organizar actividades de apoyo social.",
    "Puedo acompañar y orientar a otras personas.",
    "Manejo bien el trato con gente que necesita ayuda.",
  ],
  EJECUTIVO_PERSUASIVO: [
    "Me considero competente para dirigir a un grupo.",
    "Tengo habilidad para planear y organizar actividades.",
    "Sé convencer a otros con argumentos.",
    "Soy capaz de coordinar equipos de trabajo.",
    "Puedo negociar acuerdos entre distintas partes.",
    "Manejo bien la toma de decisiones de liderazgo.",
  ],
  VERBAL: [
    "Me considero competente para redactar textos.",
    "Tengo facilidad para leer y comprender lo que leo.",
    "Sé expresarme con claridad ante un público.",
    "Soy capaz de argumentar y debatir con solidez.",
    "Puedo corregir y mejorar la redacción de un escrito.",
    "Manejo un vocabulario amplio y preciso.",
  ],
  ARTISTICO_PLASTICA: [
    "Me considero competente para dibujar o pintar.",
    "Tengo habilidad para modelar o esculpir.",
    "Sé combinar colores y formas con buen gusto.",
    "Soy capaz de diseñar objetos atractivos.",
    "Puedo apreciar y valorar obras de arte visual.",
    "Manejo bien las proporciones y la composición.",
  ],
  MUSICAL: [
    "Me considero competente para tocar un instrumento.",
    "Tengo habilidad para cantar afinadamente.",
    "Sé leer o seguir una partitura musical.",
    "Soy capaz de componer o arreglar música.",
    "Puedo reproducir tonalidades con precisión.",
    "Manejo bien el ritmo y la melodía.",
  ],
  ORGANIZACION: [
    "Me considero competente para ordenar y clasificar información.",
    "Tengo habilidad para llevar registros ordenados.",
    "Sé estructurar los procesos de un trabajo.",
    "Soy capaz de planificar agendas y calendarios.",
    "Puedo controlar que las tareas se cumplan.",
    "Manejo bien los sistemas para organizar datos.",
  ],
  CIENTIFICA: [
    "Me considero competente para investigar fenómenos.",
    "Tengo habilidad para realizar experimentos.",
    "Sé aplicar el método científico.",
    "Soy capaz de observar y registrar datos con rigor.",
    "Puedo analizar resultados y sacar conclusiones.",
    "Manejo bien la formulación de hipótesis.",
  ],
  CALCULO: [
    "Me considero competente para resolver problemas matemáticos.",
    "Tengo habilidad para trabajar con números.",
    "Sé aplicar fórmulas y ecuaciones.",
    "Soy capaz de hacer cálculos mentales rápidos.",
    "Puedo interpretar estadísticas y porcentajes.",
    "Manejo bien los datos cuantitativos.",
  ],
  MECANICO_CONSTRUCTIVA: [
    "Me considero competente para armar y desarmar mecanismos.",
    "Tengo habilidad para reparar máquinas o aparatos.",
    "Sé usar herramientas para construir objetos.",
    "Soy capaz de diseñar piezas móviles.",
    "Puedo entender cómo funcionan las máquinas.",
    "Manejo bien la construcción a partir de un plano.",
  ],
  AIRE_LIBRE: [
    "Me considero competente para labores campestres o agrícolas.",
    "Tengo habilidad para cuidar animales.",
    "Sé desenvolverme en actividades al aire libre.",
    "Soy capaz de cultivar y trabajar la tierra.",
    "Puedo realizar tareas de precisión manual.",
    "Manejo bien las actividades físicas en espacios abiertos.",
  ],
};

/**
 * Construye el banco completo de 120 ítems con IDs correlativos 1..120.
 * Para cada campo (en orden canónico) se emiten primero sus 6 ítems de
 * INTERÉS y luego sus 6 ítems de APTITUD.
 */
function buildQuestions(): MethodQuestion[] {
  const questions: MethodQuestion[] = [];
  let id = 1;
  for (const field of MAGDALENA_FIELDS) {
    for (const text of INTERES[field]) {
      questions.push({ id: id++, dimension: field, text, category: "INTERES" });
    }
    for (const text of APTITUD[field]) {
      questions.push({ id: id++, dimension: field, text, category: "APTITUD" });
    }
  }
  return questions;
}

/** Banco completo de 120 ítems (60 Interés + 60 Aptitud) escala 0-4. */
export const MAGDALENA_QUESTIONS: MethodQuestion[] = buildQuestions();
