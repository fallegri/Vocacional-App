// ===========================================================================
// Prompts del asesor vocacional (español), portados desde
// app/src/main/java/com/example/data/remote/AiService.kt:
//  - generateVocationalReport (informe de 4 secciones)
//  - buildOfflineFallbackAnalysis (fallback sin IA)
// El prompt del tutor conversacional refleja AiChatScreen.kt ("OrientApp AI
// Tutor") y transporta el contexto psicométrico del estudiante.
//
// Además se añaden helpers para inyectar la base de conocimiento (RAG) como un
// bloque delimitado "Fuentes de conocimiento" con instrucciones de citar.
// ===========================================================================

import type { ChatMessageDto } from "@/lib/ai/client";
import { getDominantDimensions } from "@/lib/riasec/engine";
import { DIMENSION_META } from "@/lib/riasec/types";
import type {
  CareerMatch,
  DimensionCode,
  PsychometricScores,
} from "@/lib/riasec/types";
import type { KnowledgePassage } from "@/lib/knowledge/retrieve";

/**
 * Construye el bloque "Fuentes de conocimiento" a partir de los pasajes
 * recuperados de la base de conocimiento. Devuelve "" si no hay pasajes.
 */
export function buildKnowledgeContextBlock(
  passages: KnowledgePassage[]
): string {
  if (!passages || passages.length === 0) return "";

  const sources = passages
    .map((p, idx) => {
      const ref = p.sourceReference ? ` — ${p.sourceReference}` : "";
      return `[Fuente ${idx + 1}] "${p.title}"${ref}\n${p.content.trim()}`;
    })
    .join("\n\n");

  return [
    "=== Fuentes de conocimiento (base documental verificada) ===",
    sources,
    "=== Fin de las fuentes de conocimiento ===",
    "",
    "INSTRUCCIÓN DE FUNDAMENTACIÓN: Basa tu respuesta en las fuentes anteriores cuando sean relevantes y cita explícitamente el título y la referencia de la fuente utilizada (por ejemplo: según \"Título\" — referencia). Si las fuentes no cubren la pregunta, respóndela con tu conocimiento general y acláralo brevemente.",
  ].join("\n");
}

function scoresLines(scores: PsychometricScores): string {
  return [
    `  * R (Realista): ${Math.trunc(scores.r)}%`,
    `  * I (Investigador): ${Math.trunc(scores.i)}%`,
    `  * A (Artístico): ${Math.trunc(scores.a)}%`,
    `  * S (Social): ${Math.trunc(scores.s)}%`,
    `  * E (Emprendedor): ${Math.trunc(scores.e)}%`,
    `  * C (Convencional): ${Math.trunc(scores.c)}%`,
  ].join("\n");
}

export interface VocationalReportContext {
  scores: PsychometricScores;
  dominantCode: string;
  topCareers: CareerMatch[];
  reliabilityLevel: string;
  studentName?: string | null;
  /** Bloque opcional de fuentes de conocimiento (RAG) ya formateado. */
  knowledgeBlock?: string;
}

/**
 * Genera los mensajes (system + user) para el informe vocacional profesional.
 * Portado de AiService.generateVocationalReport.
 */
export function buildVocationalReportMessages(
  ctx: VocationalReportContext
): ChatMessageDto[] {
  const greeting =
    ctx.studentName && ctx.studentName.trim().length > 0
      ? `para el estudiante ${ctx.studentName.trim()}`
      : "del usuario";

  const topThreeTitles = ctx.topCareers
    .slice(0, 3)
    .map((m) => m.career.title)
    .join(", ");

  const systemPrompt = [
    "Eres OrientApp AI, un psicólogo vocacional y asesor de carrera de élite.",
    `Analiza el perfil psicométrico RIASEC ${greeting} y genera un informe vocacional profesional, empático, estructurado y altamente accionable.`,
    "",
    "Usa el siguiente formato estructurado con subtítulos claros:",
    `1. 🌟 **Resumen de tu Identidad Vocacional**: Explica el significado de su código dominante ${ctx.dominantCode} y sus rasgos clave.`,
    "2. 🔬 **Análisis Dimensional Detallado**: Destaca sus 2-3 mayores fortalezas y cómo se complementan.",
    `3. 🚀 **Sinergia con Carreras Recomendadas**: Explica por qué carreras como ${topThreeTitles} encajan con su vector vocacional.`,
    "4. 💡 **Estrategia de Crecimiento & Habilidades**: 3 recomendaciones prácticas para su desarrollo preuniversitario o profesional.",
    "",
    "Mantén un tono inspirador, riguroso y personalizado.",
  ].join("\n");

  const topCareersLines = ctx.topCareers
    .slice(0, 4)
    .map(
      (m, idx) =>
        `${idx + 1}. ${m.career.title} (Afinidad: ${Math.trunc(m.affinityPercentage)}%) - Área: ${m.career.areaName}`
    )
    .join("\n  ");

  const userPromptParts = [
    "Resultados Psicométricos del Usuario:",
    `- Código RIASEC Dominante: ${ctx.dominantCode}`,
    "- Puntuaciones Normalizadas (0-100):",
    scoresLines(ctx.scores),
    `- Nivel de Confiabilidad de la Prueba: ${ctx.reliabilityLevel}`,
    "- Carreras con Mayor Afinidad:",
    `  ${topCareersLines}`,
  ];

  if (ctx.knowledgeBlock && ctx.knowledgeBlock.trim().length > 0) {
    userPromptParts.push("", ctx.knowledgeBlock);
  }

  return [
    { role: "system", content: systemPrompt },
    { role: "user", content: userPromptParts.join("\n") },
  ];
}

export interface TutorTurn {
  role: "user" | "assistant";
  content: string;
}

export interface TutorContext {
  scores?: PsychometricScores | null;
  dominantCode?: string | null;
  dominantSummary?: string | null;
  topCareers?: CareerMatch[] | null;
  reliabilityLevel?: string | null;
  studentName?: string | null;
  /** Bloque opcional de fuentes de conocimiento (RAG) ya formateado. */
  knowledgeBlock?: string;
}

/**
 * Prompt del tutor vocacional conversacional ("OrientApp AI Tutor").
 * Transporta el contexto psicométrico del estudiante (perfil RIASEC, carreras
 * afines) para respuestas personalizadas, tal como en AiChatScreen.kt.
 */
export function buildTutorSystemPrompt(ctx: TutorContext): string {
  const parts: string[] = [
    "Eres OrientApp AI Tutor, un tutor y asesor vocacional experto, cercano y motivador.",
    "Respondes siempre en español, con lenguaje claro, empático y orientado a la acción, adecuado para estudiantes preuniversitarios.",
    "Usa el perfil psicométrico RIASEC del estudiante para personalizar cada respuesta y ayúdale a explorar carreras, habilidades y decisiones vocacionales.",
    "Sé conciso y evita respuestas excesivamente largas; ofrece pasos concretos cuando sea útil.",
  ];

  if (ctx.dominantCode && ctx.scores) {
    parts.push("", "Contexto psicométrico del estudiante:");
    if (ctx.studentName && ctx.studentName.trim().length > 0) {
      parts.push(`- Nombre: ${ctx.studentName.trim()}`);
    }
    parts.push(`- Código RIASEC Dominante: ${ctx.dominantCode}`);
    if (ctx.dominantSummary) {
      parts.push(`- Perfil dominante: ${ctx.dominantSummary}`);
    }
    parts.push("- Puntuaciones Normalizadas (0-100):", scoresLines(ctx.scores));
    if (ctx.reliabilityLevel) {
      parts.push(`- Nivel de Confiabilidad de la Prueba: ${ctx.reliabilityLevel}`);
    }
    if (ctx.topCareers && ctx.topCareers.length > 0) {
      const careers = ctx.topCareers
        .slice(0, 4)
        .map(
          (m) =>
            `${m.career.title} (Afinidad: ${Math.trunc(m.affinityPercentage)}%)`
        )
        .join(", ");
      parts.push(`- Carreras con mayor afinidad: ${careers}`);
    }
  } else {
    parts.push(
      "",
      "El estudiante aún no ha completado el test RIASEC. Anímalo cordialmente a realizarlo para personalizar el diagnóstico y responde sus preguntas generales de orientación vocacional."
    );
  }

  if (ctx.knowledgeBlock && ctx.knowledgeBlock.trim().length > 0) {
    parts.push("", ctx.knowledgeBlock);
  }

  return parts.join("\n");
}

/** Construye la lista completa de mensajes del tutor (system + historial + turno actual). */
export function buildTutorMessages(
  ctx: TutorContext,
  history: TutorTurn[],
  userMessage: string
): ChatMessageDto[] {
  const messages: ChatMessageDto[] = [
    { role: "system", content: buildTutorSystemPrompt(ctx) },
  ];
  for (const turn of history) {
    messages.push({ role: turn.role, content: turn.content });
  }
  messages.push({ role: "user", content: userMessage });
  return messages;
}

/**
 * Análisis vocacional heurístico de respaldo cuando no hay IA configurada o la
 * llamada falla. Portado de AiService.buildOfflineFallbackAnalysis.
 */
export function buildOfflineFallbackAnalysis(
  scores: PsychometricScores,
  dominantCode: string,
  topCareers: CareerMatch[]
): string {
  const topCareerTitles = topCareers
    .slice(0, 3)
    .map((m) => m.career.title)
    .join(", ");

  const dominant = getDominantDimensions(scores, 3);
  const dim1Code: DimensionCode | undefined = dominant[0]?.[0];
  const dim2Code: DimensionCode | undefined = dominant[1]?.[0];
  const dim1 = dim1Code ? DIMENSION_META[dim1Code] : undefined;
  const dim2 = dim2Code ? DIMENSION_META[dim2Code] : undefined;

  const scoreOf = (code: DimensionCode | undefined, fallback: DimensionCode): number => {
    const c = code ?? fallback;
    switch (c) {
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
  };

  return [
    `🌟 **Resumen de tu Identidad Vocacional (${dominantCode})**`,
    `Tu perfil destaca principalmente en las áreas ${dim1?.title ?? ""} y ${dim2?.title ?? ""}. Cuentas con un patrón motivacional bien definido que combina ${dim1?.adjective ?? "fortalezas prácticas"} con ${dim2?.adjective ?? "habilidades estratégicas"}.`,
    "",
    "🔬 **Análisis Dimensional de Fortalezas**",
    `• **${dim1?.title ?? ""} (${Math.trunc(scoreOf(dim1Code, "R"))}%):** ${dim1?.shortDesc ?? ""}`,
    `• **${dim2?.title ?? ""} (${Math.trunc(scoreOf(dim2Code, "I"))}%):** ${dim2?.shortDesc ?? ""}`,
    "",
    "🚀 **Afinidad con Carreras Principales**",
    `Tus mejores correspondencias ocupacionales son: **${topCareerTitles}**. Estas áreas te permitirán explotar tu inclinación natural hacia la resolución de problemas y la creación de valor.`,
    "",
    "💡 **Recomendación Estratégica**",
    "Explora planes de estudio, mallas curriculares y proyectos reales en tus carreras afines. Para potenciar tu perfil, trabaja en habilidades interdisciplinarias que conecten tus dos dimensiones dominantes.",
    "",
    "*(Nota: Puedes configurar tu API Key de NVIDIA NIM o OpenAI en Ajustes para obtener diagnósticos y un tutor interactivo con IA de última generación).*",
  ].join("\n");
}
