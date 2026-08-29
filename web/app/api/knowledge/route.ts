// ===========================================================================
// API de la base de conocimiento (RAG): sube un documento (ingesta) y lista
// los documentos almacenados con su conteo de fragmentos.
// SOLO servidor / runtime.
// ===========================================================================

import { NextResponse } from "next/server";
import {
  ingestDocument,
  listDocuments,
  KNOWLEDGE_SOURCE_TYPES,
  type KnowledgeSourceType,
} from "@/lib/knowledge/ingest";
import { authorizeStaffRequest } from "@/lib/auth/staff";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface IngestBody {
  title?: string;
  sourceType?: string;
  sourceReference?: string | null;
  content?: string;
  createdBy?: string | null;
}

export async function GET(request: Request) {
  // Autorización por rol: listar los documentos de la base de conocimiento es
  // una operación de personal (staff). Con OAuth configurado exige una sesión
  // staff; sin OAuth cae al fallback heredado (token / modo demo), igual que POST.
  const auth = await authorizeStaffRequest(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: 403 });
  }

  try {
    const documents = await listDocuments();
    return NextResponse.json({ documents });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "No se pudieron listar los documentos.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  // Autorización por rol: subir documentos a la base de conocimiento es una
  // operación de cualquier personal (staff). Con OAuth configurado exige una
  // sesión staff; sin OAuth cae al fallback heredado (token / modo demo).
  const auth = await authorizeStaffRequest(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: 403 });
  }

  let body: IngestBody;
  try {
    body = (await request.json()) as IngestBody;
  } catch {
    return NextResponse.json(
      { error: "Cuerpo de la solicitud inválido (JSON esperado)." },
      { status: 400 }
    );
  }

  const sourceType = String(body.sourceType ?? "") as KnowledgeSourceType;
  if (!KNOWLEDGE_SOURCE_TYPES[sourceType]) {
    return NextResponse.json(
      { error: "Tipo de fuente inválido. Usa BOOK, RESEARCH o ARTICLE." },
      { status: 400 }
    );
  }

  const result = await ingestDocument({
    title: String(body.title ?? ""),
    sourceType,
    sourceReference: body.sourceReference ?? null,
    content: String(body.content ?? ""),
    createdBy: body.createdBy ?? null,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json(result, { status: 201 });
}
