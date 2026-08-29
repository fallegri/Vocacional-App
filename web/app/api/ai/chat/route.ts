// ===========================================================================
// Tutor vocacional conversacional (IA). Acepta el historial de la conversación
// y el contexto de diagnóstico actual (perfil RIASEC). Recupera pasajes de la
// base de conocimiento (RAG) relevantes para la pregunta y los inyecta como
// bloque "Fuentes de conocimiento" para fundamentar y citar la respuesta.
//
// SOLO servidor. La API key nunca llega al navegador.
// ===========================================================================

import { NextResponse } from "next/server";
import { CAREERS } from "@/data/seed";
import { matchCareers } from "@/lib/riasec/engine";
import { loadSession } from "@/lib/sessions";
import { resolveAiConfig, isConfigured } from "@/lib/ai/config";
import { completeChat } from "@/lib/ai/client";
import {
  buildTutorMessages,
  buildKnowledgeContextBlock,
  type TutorContext,
  type TutorTurn,
} from "@/lib/ai/prompts";
import { retrieveRelevantPassages } from "@/lib/knowledge/retrieve";
import { authorizeSessionRead } from "@/lib/auth/read-access";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface ChatBody {
  message?: string;
  sessionId?: string | null;
  history?: TutorTurn[];
}

const MAX_HISTORY = 12;

export async function POST(request: Request) {
  let body: ChatBody;
  try {
    body = (await request.json()) as ChatBody;
  } catch {
    return NextResponse.json(
      { error: "Cuerpo de la solicitud inválido (JSON esperado)." },
      { status: 400 }
    );
  }

  const message = (body.message ?? "").trim();
  if (!message) {
    return NextResponse.json(
      { error: "El mensaje no puede estar vacío." },
      { status: 400 }
    );
  }

  const config = await resolveAiConfig();
  if (!isConfigured(config)) {
    return NextResponse.json(
      {
        error:
          "El Tutor IA no está configurado. Un administrador debe configurar el proveedor de IA en Ajustes de IA (o definir AI_BASE_URL / AI_API_KEY / AI_MODEL).",
      },
      { status: 503 }
    );
  }

  // Contexto psicométrico: carga la sesión si se indicó un sessionId.
  const ctx: TutorContext = {};
  const sessionId = (body.sessionId ?? "").trim();
  if (sessionId) {
    let session = null;
    try {
      session = await loadSession(sessionId);
    } catch {
      // Sin contexto psicométrico: el tutor responde de forma general.
    }

    if (session) {
      // Autorización de lectura: solo se enfoca cuando la sesión existe. En
      // modo demo el acceso es abierto; con OAuth configurado, un usuario que
      // no es dueño ni personal (staff) recibe 403 en lugar de perder contexto
      // en silencio. Una conversación general sin sessionId sigue permitida.
      const readAuth = await authorizeSessionRead(session);
      if (!readAuth.ok) {
        return NextResponse.json({ error: readAuth.error }, { status: 403 });
      }

      const careerMatches = matchCareers(session.scores, CAREERS);
      ctx.scores = session.scores;
      ctx.dominantCode = session.dominantCode;
      ctx.dominantSummary = session.dominantSummary;
      ctx.reliabilityLevel = session.reliabilityLevel;
      ctx.studentName = session.studentName;
      ctx.topCareers = careerMatches;
    }
  }

  // Recupera fuentes de conocimiento relevantes para la pregunta del estudiante.
  const passages = await retrieveRelevantPassages(message, 4);
  ctx.knowledgeBlock = buildKnowledgeContextBlock(passages);

  const history = Array.isArray(body.history)
    ? body.history
        .filter(
          (t): t is TutorTurn =>
            !!t &&
            (t.role === "user" || t.role === "assistant") &&
            typeof t.content === "string" &&
            t.content.trim().length > 0
        )
        .slice(-MAX_HISTORY)
    : [];

  const messages = buildTutorMessages(ctx, history, message);
  const result = await completeChat(config, messages);

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 502 });
  }

  return NextResponse.json({
    reply: result.value,
    grounded: passages.length > 0,
  });
}
