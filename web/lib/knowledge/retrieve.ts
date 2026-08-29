// ===========================================================================
// Recuperación semántica (RAG): dada una consulta, calcula su embedding y busca
// los fragmentos más similares en knowledge_chunks mediante similitud coseno de
// pgvector (operador <=>). Devuelve los top-k con título + referencia de su
// documento para poder citarlos.
//
// Está protegida frente a: sin DATABASE_URL, sin IA/embeddings, o cualquier
// error de consulta -> devuelve [] para que el asesor use el prompt normal.
// SOLO se ejecuta en el servidor y en tiempo de ejecución.
// ===========================================================================

import { resolveAiConfig, EMBEDDING_DIMENSION } from "@/lib/ai/config";
import { embedText } from "@/lib/ai/client";
import { query } from "@/lib/db";

export interface KnowledgePassage {
  documentId: number;
  title: string;
  sourceType: string;
  sourceReference: string | null;
  chunkIndex: number;
  content: string;
  /** Distancia coseno (menor = más similar). */
  distance: number;
}

function toVectorLiteral(vec: number[]): string {
  return `[${vec.join(",")}]`;
}

/**
 * Recupera los top-k fragmentos más relevantes para la consulta. Devuelve []
 * si no hay base de datos, no hay embeddings disponibles o no hay resultados.
 */
export async function retrieveRelevantPassages(
  queryText: string,
  k = 4
): Promise<KnowledgePassage[]> {
  const text = (queryText ?? "").trim();
  if (text.length === 0) return [];
  if (!process.env.DATABASE_URL) return [];

  try {
    const config = await resolveAiConfig();
    const embedResult = await embedText(config, text);
    if (!embedResult.ok) return [];
    if (embedResult.value.length !== EMBEDDING_DIMENSION) return [];

    const literal = toVectorLiteral(embedResult.value);
    const limit = Math.max(1, Math.min(k, 20));

    const rows = await query(
      `SELECT c.document_id, c.chunk_index, c.content,
              (c.embedding <=> $1::vector) AS distance,
              d.title, d.source_type, d.source_reference
         FROM knowledge_chunks c
         JOIN knowledge_documents d ON d.id = c.document_id
        WHERE c.embedding IS NOT NULL
        ORDER BY c.embedding <=> $1::vector
        LIMIT $2`,
      [literal, limit]
    );

    return rows.map((row) => ({
      documentId: Number(row.document_id),
      title: String(row.title),
      sourceType: String(row.source_type),
      sourceReference:
        row.source_reference == null ? null : String(row.source_reference),
      chunkIndex: Number(row.chunk_index ?? 0),
      content: String(row.content ?? ""),
      distance: Number(row.distance ?? 1),
    }));
  } catch {
    return [];
  }
}
