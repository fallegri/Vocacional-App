// ===========================================================================
// Genera el informe de diagnóstico vocacional con IA para una sesión y lo
// persiste en assessment_sessions.ai_analysis. Recupera pasajes de la base de
// conocimiento (RAG) para fundamentar el informe y los inyecta como bloque
// "Fuentes de conocimiento". Si la IA no está configurada o falla, usa el
// análisis heurístico de respaldo.
//
// SOLO servidor. Ninguna llamada de red/DB ocurre durante el build.
// ===========================================================================

import { NextResponse } from "next/server";
import { CAREERS } from "@/data/seed";
import { matchCareers } from "@/lib/riasec/engine";
import { loadSession } from "@/lib/sessions";
import { resolveAiConfig, isConfigured } from "@/lib/ai/config";
import { completeChat } from "@/lib/ai/client";
import {
  buildVocationalReportMessages,
  buildOfflineFallbackAnalysis,
  buildKnowledgeContextBlock,
} from "@/lib/ai/prompts";
import { retrieveRelevantPassages } from "@/lib/knowledge/retrieve";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface ReportBody {
  sessionId?: string;
}

export async function POST(request: Request) {
  let body: ReportBody;
  try {
    body = (await request.json()) as ReportBody;
  } catch {
    return NextResponse.json(
      { error: "Cuerpo de la solicitud inválido (JSON esperado)." },
      { status: 400 }
    );
  }

  const sessionId = (body.sessionId ?? "").trim();
  if (!sessionId) {
    return NextResponse.json(
      { error: "Debes indicar el sessionId." },
      { status: 400 }
    );
  }

  let session;
  try {
    session = await loadSession(sessionId);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error al leer la sesión.";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  if (!session) {
    return NextResponse.json(
      { error: "No se encontró la sesión indicada." },
      { status: 404 }
    );
  }

  const careerMatches = matchCareers(session.scores, CAREERS);

  const config = await resolveAiConfig();

  let analysis: string;
  let source: "ai" | "fallback" = "fallback";
  let grounded = false;

  if (isConfigured(config)) {
    // Recupera fuentes de conocimiento relevantes para fundamentar el informe.
    const retrievalQuery = `Perfil vocacional RIASEC ${session.dominantCode}. ${session.dominantSummary} Carreras afines: ${careerMatches
      .slice(0, 3)
      .map((m) => m.career.title)
      .join(", ")}`;
    const passages = await retrieveRelevantPassages(retrievalQuery, 4);
    const knowledgeBlock = buildKnowledgeContextBlock(passages);
    grounded = passages.length > 0;

    const messages = buildVocationalReportMessages({
      scores: session.scores,
      dominantCode: session.dominantCode,
      topCareers: careerMatches,
      reliabilityLevel: session.reliabilityLevel,
      studentName: session.studentName,
      knowledgeBlock,
    });

    const result = await completeChat(config, messages);
    if (result.ok) {
      analysis = result.value;
      source = "ai";
    } else {
      analysis = buildOfflineFallbackAnalysis(
        session.scores,
        session.dominantCode,
        careerMatches
      );
    }
  } else {
    analysis = buildOfflineFallbackAnalysis(
      session.scores,
      session.dominantCode,
      careerMatches
    );
  }

  // Persiste el análisis en la sesión.
  try {
    await query(
      "UPDATE assessment_sessions SET ai_analysis = $1 WHERE id = $2",
      [analysis, sessionId]
    );
  } catch {
    // Si falla la persistencia, devolvemos igualmente el análisis calculado.
  }

  return NextResponse.json({ analysis, source, grounded });
}
