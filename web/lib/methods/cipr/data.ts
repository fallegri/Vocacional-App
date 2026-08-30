// ===========================================================================
// Banco de ítems del método CIP-R (Cuestionario de Intereses Profesionales
// Revisado; Fogliatto, 1991/1993; revisado por Fogliatto, Pérez, Olaz y
// Parodi, 2003).
// Estructura y calificación tomadas de skills/knowledge/cuestionario-cip-r.md:
//   114 reactivos distribuidos en 15 escalas primarias de interés; escala de
//   respuesta de opción única: Agrado (A) / Indiferencia (I) / Desagrado (D).
//   La puntuación es la suma cruda por escala (mayor = mayor atracción).
//
// NOTA: El documento fuente define la ESTRUCTURA y la CALIFICACIÓN del
// instrumento, pero NO contiene el banco de ítems verbatim ni una versión
// licenciable de los reactivos. Por ello la redacción de los reactivos es una
// ADAPTACIÓN ORIGINAL Y FIEL, consistente con las actividades descritas para
// cada escala en la fuente. No es la versión verbatim del instrumento.
//
// Distribución de los 114 reactivos (documentada): las primeras 9 escalas del
// orden canónico llevan 8 ítems (9 x 8 = 72) y las últimas 6 llevan 7 ítems
// (6 x 7 = 42); 72 + 42 = 114.
// Todo el texto permanece en español.
// ===========================================================================

import type { MethodDimension, MethodQuestion } from "@/lib/methods/types";

/** Códigos de las 15 escalas primarias del CIP-R. */
export type CiprScale =
  | "CALCULO"
  | "CIENTIFICA"
  | "DISENO"
  | "TECNOLOGICA"
  | "GEOASTRONOMICA"
  | "NATURALISTA"
  | "SANITARIA"
  | "ASISTENCIAL"
  | "JURIDICA"
  | "ECONOMICA"
  | "COMUNICACIONAL"
  | "HUMANISTICA"
  | "ARTISTICA"
  | "MUSICAL"
  | "LINGUISTICA";

/** Orden canónico de las 15 escalas CIP-R. */
export const CIPR_SCALES_ORDER: CiprScale[] = [
  "CALCULO",
  "CIENTIFICA",
  "DISENO",
  "TECNOLOGICA",
  "GEOASTRONOMICA",
  "NATURALISTA",
  "SANITARIA",
  "ASISTENCIAL",
  "JURIDICA",
  "ECONOMICA",
  "COMUNICACIONAL",
  "HUMANISTICA",
  "ARTISTICA",
  "MUSICAL",
  "LINGUISTICA",
];

/** Metadatos (título, descripción, color) de cada escala CIP-R. */
export const CIPR_DIMENSIONS: Record<CiprScale, MethodDimension> = {
  CALCULO: {
    code: "CALCULO",
    title: "Cálculo",
    shortDesc:
      "Gusto por la resolución de problemas abstractos mediante operaciones cuantitativas y lógica matemática.",
    color: "#4F46E5",
  },
  CIENTIFICA: {
    code: "CIENTIFICA",
    title: "Científica",
    shortDesc:
      "Interés en la investigación básica, la experimentación de laboratorio y el descubrimiento de leyes físicas y químicas.",
    color: "#0891B2",
  },
  DISENO: {
    code: "DISENO",
    title: "Diseño",
    shortDesc:
      "Atracción por la proyección y configuración estética de espacios, indumentaria, objetos u obras civiles.",
    color: "#DB2777",
  },
  TECNOLOGICA: {
    code: "TECNOLOGICA",
    title: "Tecnológica",
    shortDesc:
      "Preferencia por la aplicación práctica de la ciencia a la construcción, el mantenimiento de maquinarias, la informática y los sistemas.",
    color: "#EA580C",
  },
  GEOASTRONOMICA: {
    code: "GEOASTRONOMICA",
    title: "Geoastronómica",
    shortDesc:
      "Interés por el estudio de los astros, la geología, la cartografía, los sismos y la atmósfera.",
    color: "#2563EB",
  },
  NATURALISTA: {
    code: "NATURALISTA",
    title: "Naturalista",
    shortDesc:
      "Inclinación hacia el trabajo al aire libre, la veterinaria, la agricultura, la botánica y la preservación de la flora y la fauna.",
    color: "#65A30D",
  },
  SANITARIA: {
    code: "SANITARIA",
    title: "Sanitaria",
    shortDesc:
      "Orientación al diagnóstico, tratamiento y prevención de patologías de la salud humana y cuidado clínico.",
    color: "#059669",
  },
  ASISTENCIAL: {
    code: "ASISTENCIAL",
    title: "Asistencial",
    shortDesc:
      "Enfoque en la ayuda comunitaria, el trabajo social, la psicoterapia y la asistencia a grupos vulnerables o con carencias.",
    color: "#16A34A",
  },
  JURIDICA: {
    code: "JURIDICA",
    title: "Jurídica",
    shortDesc:
      "Atracción por la defensa de derechos, el orden legislativo, la resolución de juicios y la aplicación de las leyes.",
    color: "#7C3AED",
  },
  ECONOMICA: {
    code: "ECONOMICA",
    title: "Económica",
    shortDesc:
      "Gusto por la administración de negocios, las finanzas, la comercialización, la auditoría contable y el análisis económico.",
    color: "#E11D48",
  },
  COMUNICACIONAL: {
    code: "COMUNICACIONAL",
    title: "Comunicacional",
    shortDesc:
      "Preferencia por la producción de medios de comunicación, televisión, cine, periodismo digital o radio.",
    color: "#0EA5E9",
  },
  HUMANISTICA: {
    code: "HUMANISTICA",
    title: "Humanística",
    shortDesc:
      "Interés en la historia, la filosofía, la literatura, la antropología y el estudio del comportamiento social humano.",
    color: "#B45309",
  },
  ARTISTICA: {
    code: "ARTISTICA",
    title: "Artística",
    shortDesc:
      "Inclinación hacia las artes plásticas, la escultura, la pintura, el diseño gráfico independiente y la expresión plástica.",
    color: "#9333EA",
  },
  MUSICAL: {
    code: "MUSICAL",
    title: "Musical",
    shortDesc:
      "Atracción por aprender a tocar instrumentos, la composición, los arreglos armónicos, el canto y la musicología.",
    color: "#C026D3",
  },
  LINGUISTICA: {
    code: "LINGUISTICA",
    title: "Lingüística",
    shortDesc:
      "Interés por aprender, hablar, traducir o escribir en idiomas extranjeros.",
    color: "#0D9488",
  },
};

/**
 * Ítems por escala. Las primeras 9 escalas del orden canónico llevan 8 ítems y
 * las últimas 6 llevan 7 ítems, totalizando 114 reactivos. La redacción es una
 * adaptación original y fiel a las actividades descritas para cada escala.
 */
const ITEMS: Record<CiprScale, string[]> = {
  CALCULO: [
    "Resolver problemas abstractos mediante operaciones matemáticas.",
    "Aplicar razonamientos lógicos para llegar a una conclusión.",
    "Trabajar con ecuaciones, funciones y modelos numéricos.",
    "Analizar grandes conjuntos de datos con métodos estadísticos.",
    "Calcular probabilidades y estimaciones cuantitativas.",
    "Demostrar teoremas y comprobar resultados matemáticos.",
    "Diseñar algoritmos para resolver problemas de cálculo.",
    "Encontrar patrones numéricos en información compleja.",
  ],
  CIENTIFICA: [
    "Investigar las causas básicas de los fenómenos naturales.",
    "Experimentar en un laboratorio con sustancias químicas.",
    "Descubrir y formular leyes físicas o químicas.",
    "Observar reacciones y registrar los resultados con rigor.",
    "Estudiar la estructura de la materia y la energía.",
    "Diseñar experimentos para poner a prueba una hipótesis.",
    "Analizar los resultados de una investigación científica.",
    "Comprender los principios fundamentales de las ciencias exactas.",
  ],
  DISENO: [
    "Proyectar la forma y la estética de objetos o espacios.",
    "Diseñar indumentaria o accesorios con criterio estético.",
    "Configurar el aspecto visual de una obra civil o edificio.",
    "Crear planos y bocetos de productos u ambientes.",
    "Combinar funcionalidad y belleza en un diseño.",
    "Elegir colores, materiales y texturas para un proyecto.",
    "Rediseñar un espacio para hacerlo más armónico.",
    "Idear la presentación estética de un producto nuevo.",
  ],
  TECNOLOGICA: [
    "Aplicar la ciencia a la construcción de maquinarias.",
    "Reparar y mantener equipos mecánicos o eléctricos.",
    "Desarrollar sistemas informáticos y programas.",
    "Instalar y configurar redes o dispositivos técnicos.",
    "Automatizar procesos industriales con tecnología.",
    "Diseñar soluciones prácticas a problemas de ingeniería.",
    "Optimizar el funcionamiento de máquinas y sistemas.",
    "Aprender el manejo de nuevas herramientas tecnológicas.",
  ],
  GEOASTRONOMICA: [
    "Estudiar el movimiento y la composición de los astros.",
    "Analizar la estructura geológica de la Tierra.",
    "Elaborar mapas y cartografía de un territorio.",
    "Investigar el origen y la actividad de los sismos.",
    "Observar y predecir los fenómenos atmosféricos.",
    "Explorar la formación de montañas, rocas y minerales.",
    "Interpretar imágenes satelitales del planeta.",
    "Comprender los ciclos del clima y la atmósfera.",
  ],
  NATURALISTA: [
    "Trabajar al aire libre en contacto con la naturaleza.",
    "Cuidar y tratar la salud de los animales.",
    "Cultivar la tierra y mejorar la producción agrícola.",
    "Estudiar las plantas y su clasificación botánica.",
    "Preservar la flora y la fauna en peligro de extinción.",
    "Proteger los ecosistemas y el medio ambiente.",
    "Criar y manejar animales de granja o silvestres.",
    "Investigar la biodiversidad de una región natural.",
  ],
  SANITARIA: [
    "Diagnosticar enfermedades en pacientes.",
    "Aplicar tratamientos para restablecer la salud.",
    "Prevenir patologías mediante campañas sanitarias.",
    "Cuidar y acompañar a personas enfermas.",
    "Estudiar el funcionamiento del cuerpo humano.",
    "Asistir en procedimientos clínicos y de enfermería.",
    "Orientar a la población sobre hábitos saludables.",
    "Realizar controles y análisis médicos.",
  ],
  ASISTENCIAL: [
    "Ayudar a comunidades con problemas sociales.",
    "Acompañar a grupos vulnerables o con carencias.",
    "Brindar contención psicológica a quien lo necesita.",
    "Diseñar programas de trabajo social.",
    "Mediar para mejorar la convivencia de un grupo.",
    "Orientar a personas en situación de dificultad.",
    "Promover la inclusión de sectores desfavorecidos.",
    "Colaborar en tareas de asistencia comunitaria.",
  ],
  JURIDICA: [
    "Defender los derechos de una persona ante la ley.",
    "Interpretar y aplicar las normas jurídicas.",
    "Analizar y resolver conflictos legales.",
    "Participar en la resolución de juicios.",
    "Estudiar códigos, leyes y reglamentos.",
    "Asesorar legalmente a personas o empresas.",
    "Redactar contratos y documentos legales.",
    "Velar por el cumplimiento del orden legislativo.",
  ],
  ECONOMICA: [
    "Administrar los recursos financieros de una empresa.",
    "Analizar el comportamiento de los mercados.",
    "Llevar la contabilidad y la auditoría de un negocio.",
    "Planificar estrategias comerciales y de venta.",
    "Estudiar indicadores económicos como el PIB.",
    "Gestionar inversiones y presupuestos.",
    "Evaluar la rentabilidad de un proyecto.",
  ],
  COMUNICACIONAL: [
    "Producir contenidos para televisión, cine o radio.",
    "Escribir noticias y reportajes periodísticos.",
    "Difundir información a través de medios digitales.",
    "Realizar entrevistas y coberturas informativas.",
    "Gestionar la comunicación de una organización.",
    "Crear campañas de comunicación audiovisual.",
    "Editar y producir material para medios masivos.",
  ],
  HUMANISTICA: [
    "Estudiar la historia de las civilizaciones.",
    "Reflexionar sobre problemas filosóficos y éticos.",
    "Analizar obras literarias y su significado.",
    "Investigar las culturas desde la antropología.",
    "Comprender el comportamiento social del ser humano.",
    "Interpretar textos clásicos del pensamiento humano.",
    "Debatir ideas sobre la sociedad y la cultura.",
  ],
  ARTISTICA: [
    "Pintar cuadros o crear obras plásticas.",
    "Modelar esculturas con distintos materiales.",
    "Diseñar piezas de arte gráfico de forma independiente.",
    "Expresar ideas y emociones mediante el arte.",
    "Apreciar y analizar la belleza de las obras plásticas.",
    "Experimentar con técnicas y estilos artísticos.",
    "Crear ilustraciones originales y creativas.",
  ],
  MUSICAL: [
    "Aprender a tocar un instrumento musical.",
    "Componer canciones y piezas musicales.",
    "Realizar arreglos armónicos de una obra.",
    "Cantar o interpretar música ante el público.",
    "Estudiar la teoría y la historia de la música.",
    "Analizar composiciones desde la musicología.",
    "Practicar y perfeccionar la ejecución musical.",
  ],
  LINGUISTICA: [
    "Aprender a hablar con fluidez idiomas extranjeros.",
    "Traducir textos de un idioma a otro.",
    "Escribir correctamente en una lengua extranjera.",
    "Estudiar la gramática y el vocabulario de otras lenguas.",
    "Interpretar conversaciones entre distintos idiomas.",
    "Comunicarte con personas de otras culturas en su lengua.",
    "Comparar la estructura de diferentes idiomas.",
  ],
};

/**
 * Construye el banco completo de 114 ítems con IDs correlativos, en el orden
 * canónico de las 15 escalas.
 */
function buildQuestions(): MethodQuestion[] {
  const questions: MethodQuestion[] = [];
  let id = 1;
  for (const scale of CIPR_SCALES_ORDER) {
    for (const text of ITEMS[scale]) {
      questions.push({ id: id++, dimension: scale, text });
    }
  }
  return questions;
}

/** Banco completo de 114 ítems (opción única A/I/D) del CIP-R. */
export const CIPR_QUESTIONS: MethodQuestion[] = buildQuestions();
