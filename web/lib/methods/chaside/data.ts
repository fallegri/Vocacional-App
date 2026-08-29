// ===========================================================================
// Banco de ítems del método CHASIDE.
// Estructura y calificación tomadas de skills/knowledge/metodo-chaside.md:
//   98 ítems dicotómicos (Sí/No) = 70 Interés (10 por área) + 28 Aptitud
//   (4 por área) sobre las 7 áreas del acrónimo C, H, A, S, I, D, E.
//
// NOTA: El documento fuente define la ESTRUCTURA y la CALIFICACIÓN del test,
// pero NO contiene el banco de ítems textual. Por ello la redacción de los
// reactivos es una ADAPTACIÓN ORIGINAL Y FIEL, consistente con los intereses
// y aptitudes descritos para cada área en la fuente. No es la versión verbatim
// del instrumento clásico.
// Todo el texto permanece en español.
// ===========================================================================

import type { MethodDimension, MethodQuestion } from "@/lib/methods/types";

/** Códigos de las 7 áreas CHASIDE. */
export type ChasideArea = "C" | "H" | "A" | "S" | "I" | "D" | "E";

/** Orden canónico del acrónimo CHASIDE. */
export const CHASIDE_AREAS: ChasideArea[] = ["C", "H", "A", "S", "I", "D", "E"];

/** Categorías de medición del test. */
export type ChasideCategory = "INTERES" | "APTITUD";

/** Metadatos (título, descripción, color) de cada área CHASIDE. */
export const CHASIDE_DIMENSIONS: Record<ChasideArea, MethodDimension> = {
  C: {
    code: "C",
    title: "Administrativo-Contable",
    shortDesc:
      "Planificación, organización, control contable y sistematización de datos en empresas.",
    color: "#4F46E5",
  },
  H: {
    code: "H",
    title: "Humanísticas, Sociales y Jurídicas",
    shortDesc:
      "Estudio de la evolución humana, defensa de derechos, bienestar social y comunicación.",
    color: "#0EA5E9",
  },
  A: {
    code: "A",
    title: "Artísticas",
    shortDesc:
      "Creación estética, visual, teatral, musical y decorativa; valoración de la sensibilidad.",
    color: "#9333EA",
  },
  S: {
    code: "S",
    title: "Medicina y Ciencias de la Salud",
    shortDesc:
      "Cuidado de enfermos, asistencia física y psicológica, investigación biológica aplicada.",
    color: "#16A34A",
  },
  I: {
    code: "I",
    title: "Enseñanzas Técnicas (Ingeniería)",
    shortDesc:
      "Armar, reparar y proyectar mecanismos, diseñar sistemas y programar computadores.",
    color: "#EA580C",
  },
  D: {
    code: "D",
    title: "Defensa y Seguridad",
    shortDesc:
      "Resguardo del orden público, operaciones de rescate, estrategia y protección civil.",
    color: "#DC2626",
  },
  E: {
    code: "E",
    title: "Ciencias Exactas y Orgánicas",
    shortDesc:
      "Investigación básica, física, astronomía, experimentación química y medio ambiente.",
    color: "#0891B2",
  },
};

/** Ítems de INTERÉS: 10 por área. */
const INTERES: Record<ChasideArea, string[]> = {
  C: [
    "¿Te gusta organizar y clasificar la información contable de una empresa?",
    "¿Disfrutas planificar presupuestos y controlar los gastos de un proyecto?",
    "¿Te interesa supervisar que los procesos administrativos se cumplan con orden?",
    "¿Te agrada llevar registros detallados de ingresos, egresos e inventarios?",
    "¿Te gustaría analizar estados financieros para tomar decisiones económicas?",
    "¿Disfrutas ordenar archivos, documentos y bases de datos de una oficina?",
    "¿Te atrae calcular costos, impuestos y rendimientos de una inversión?",
    "¿Te interesa coordinar el trabajo de un equipo administrativo?",
    "¿Te gusta colaborar en auditorías y verificaciones de cuentas?",
    "¿Disfrutas diseñar sistemas para sistematizar tareas repetitivas de gestión?",
  ],
  H: [
    "¿Te gusta debatir sobre derechos humanos, justicia y problemas sociales?",
    "¿Disfrutas leer y analizar textos sobre historia, filosofía o política?",
    "¿Te interesa defender los derechos de personas que enfrentan injusticias?",
    "¿Te agrada expresarte con precisión de forma oral y escrita?",
    "¿Te gustaría mediar en conflictos buscando acuerdos justos entre las partes?",
    "¿Disfrutas estudiar cómo evolucionan las sociedades y las culturas?",
    "¿Te atrae participar en proyectos de bienestar social y comunitario?",
    "¿Te interesa interpretar leyes y normas para asesorar a las personas?",
    "¿Te gusta comunicar ideas para persuadir e informar a un público?",
    "¿Disfrutas investigar el comportamiento humano y las relaciones sociales?",
  ],
  A: [
    "¿Te gusta crear obras visuales como pinturas, ilustraciones o esculturas?",
    "¿Disfrutas actuar, dirigir o participar en obras de teatro?",
    "¿Te interesa componer, interpretar o producir música?",
    "¿Te agrada diseñar espacios, vestuarios o ambientes con estilo propio?",
    "¿Te gustaría escribir cuentos, poesías o guiones creativos?",
    "¿Disfrutas fotografiar o realizar producciones audiovisuales originales?",
    "¿Te atrae decorar y armonizar los elementos visuales de un espacio?",
    "¿Te interesa expresar emociones e ideas a través del arte?",
    "¿Te gusta explorar nuevas técnicas y materiales para crear?",
    "¿Disfrutas apreciar y criticar obras artísticas con sensibilidad estética?",
  ],
  S: [
    "¿Te gusta cuidar y asistir a personas enfermas o convalecientes?",
    "¿Disfrutas investigar las causas biológicas de las enfermedades?",
    "¿Te interesa brindar auxilio y primeros auxilios en emergencias?",
    "¿Te agrada acompañar psicológicamente a quienes atraviesan una crisis?",
    "¿Te gustaría estudiar el funcionamiento del cuerpo humano en detalle?",
    "¿Disfrutas orientar a las personas sobre hábitos de salud y nutrición?",
    "¿Te atrae analizar muestras clínicas para diagnosticar enfermedades?",
    "¿Te interesa rehabilitar a pacientes que han sufrido lesiones?",
    "¿Te gusta ayudar de forma solidaria a quienes lo necesitan?",
    "¿Disfrutas prevenir enfermedades mediante campañas de salud pública?",
  ],
  I: [
    "¿Te gusta armar, desarmar y reparar aparatos y mecanismos?",
    "¿Disfrutas diseñar y proyectar máquinas, estructuras o sistemas?",
    "¿Te interesa programar computadores y desarrollar aplicaciones?",
    "¿Te agrada resolver problemas técnicos aplicando cálculos exactos?",
    "¿Te gustaría planificar la construcción de infraestructuras y edificaciones?",
    "¿Disfrutas experimentar con circuitos, robots o dispositivos electrónicos?",
    "¿Te atrae optimizar procesos industriales para hacerlos más eficientes?",
    "¿Te interesa comprender cómo funcionan las tecnologías por dentro?",
    "¿Te gusta fabricar prototipos a partir de planos y especificaciones técnicas?",
    "¿Disfrutas aplicar principios científicos al diseño de soluciones prácticas?",
  ],
  D: [
    "¿Te gusta participar en actividades que resguardan el orden público?",
    "¿Disfrutas trabajar en operaciones de rescate y protección civil?",
    "¿Te interesa liderar equipos en situaciones de riesgo o emergencia?",
    "¿Te agrada planificar estrategias de defensa y seguridad?",
    "¿Te gustaría vigilar y proteger a las personas y sus bienes?",
    "¿Disfrutas participar en actividades físicas exigentes y disciplinadas?",
    "¿Te atrae colaborar con espíritu de equipo en misiones arriesgadas?",
    "¿Te interesa hacer cumplir la justicia y la equidad en la comunidad?",
    "¿Te gusta actuar con valentía frente a situaciones de peligro?",
    "¿Disfrutas coordinar operativos de auxilio ante catástrofes?",
  ],
  E: [
    "¿Te gusta investigar fenómenos de la física, la química o la biología?",
    "¿Disfrutas realizar experimentos controlados en un laboratorio?",
    "¿Te interesa estudiar los astros, el universo y sus leyes?",
    "¿Te agrada clasificar y ordenar datos de una investigación científica?",
    "¿Te gustaría analizar la composición química de las sustancias?",
    "¿Disfrutas estudiar el medio ambiente y los ecosistemas?",
    "¿Te atrae formular hipótesis y comprobarlas con el método científico?",
    "¿Te interesa realizar cálculos numéricos precisos en tus indagaciones?",
    "¿Te gusta observar con paciencia los procesos naturales para entenderlos?",
    "¿Disfrutas sintetizar información compleja en conclusiones claras?",
  ],
};

/** Ítems de APTITUD: 4 por área. */
const APTITUD: Record<ChasideArea, string[]> = {
  C: [
    "¿Eres una persona ordenada y responsable con los detalles?",
    "¿Sueles ser objetivo y práctico al resolver situaciones?",
    "¿Te consideras tolerante y persuasivo al trabajar con otros?",
    "¿Eres ambicioso y constante para alcanzar tus metas?",
  ],
  H: [
    "¿Te consideras una persona justa y conciliadora?",
    "¿Eres responsable al asumir compromisos con los demás?",
    "¿Tienes facilidad para persuadir con argumentos sólidos?",
    "¿Eres sagaz e imaginativo para analizar situaciones sociales?",
  ],
  A: [
    "¿Eres una persona sensible e imaginativa?",
    "¿Te consideras creativo e innovador al proponer ideas?",
    "¿Eres detallista al elaborar tus trabajos?",
    "¿Sueles guiarte por la intuición al crear?",
  ],
  S: [
    "¿Eres una persona altruista y solidaria?",
    "¿Te consideras paciente y comprensivo con los demás?",
    "¿Eres respetuoso al tratar con personas vulnerables?",
    "¿Tienes capacidad para persuadir y tranquilizar a quien sufre?",
  ],
  I: [
    "¿Eres una persona precisa y práctica al trabajar?",
    "¿Te consideras crítico y analítico ante los problemas?",
    "¿Eres riguroso al seguir procedimientos técnicos?",
    "¿Tienes habilidad manual para manipular herramientas?",
  ],
  D: [
    "¿Eres una persona arriesgada y valiente?",
    "¿Te consideras solidario con tus compañeros de equipo?",
    "¿Eres decidido al actuar bajo presión?",
    "¿Tienes capacidad de persuasión para liderar a otros?",
  ],
  E: [
    "¿Eres una persona metódica y analítica?",
    "¿Te consideras observador y paciente?",
    "¿Eres seguro al defender tus conclusiones?",
    "¿Prefieres la reflexión introvertida antes de decidir?",
  ],
};

/**
 * Construye el banco completo de 98 ítems con IDs correlativos.
 * Bloques de 14 por área (10 Interés + 4 Aptitud), en orden C,H,A,S,I,D,E.
 */
function buildQuestions(): MethodQuestion[] {
  const questions: MethodQuestion[] = [];
  let id = 1;
  for (const area of CHASIDE_AREAS) {
    for (const text of INTERES[area]) {
      questions.push({ id: id++, dimension: area, text, category: "INTERES" });
    }
    for (const text of APTITUD[area]) {
      questions.push({ id: id++, dimension: area, text, category: "APTITUD" });
    }
  }
  return questions;
}

/** Banco completo de 98 ítems dicotómicos de CHASIDE. */
export const CHASIDE_QUESTIONS: MethodQuestion[] = buildQuestions();
