// ===========================================================================
// Ingesta de la base de conocimiento (RAG): inserta un documento fuente
// (libro, investigación científica, artículo) y sus fragmentos con embeddings
// en Neon (pgvector). SOLO se ejecuta en el servidor y en tiempo de ejecución.
//
// Si no hay clave/endpoint de IA configurado, los chunks se guardan con
// embedding NULL: quedan almacenados pero NO serán recuperables por similitud
// hasta que se configure la IA y se reindexe (la recuperación requiere
// embeddings).
// ===========================================================================

import { resolveAiConfig, EMBEDDING_DIMENSION } from "@/lib/ai/config";
import { embedTexts } from "@/lib/ai/client";
import { chunkText } from "@/lib/knowledge/chunk";
import { query } from "@/lib/db";

export type KnowledgeSourceType = "BOOK" | "RESEARCH" | "ARTICLE";

export const KNOWLEDGE_SOURCE_TYPES: Record<KnowledgeSourceType, string> = {
  BOOK: "Libro",
  RESEARCH: "Investigación científica",
  ARTICLE: "Artículo",
};

export interface IngestDocumentInput {
  title: string;
  sourceType: KnowledgeSourceType;
  sourceReference?: string | null;
  content: string;
  createdBy?: string | null;
  /**
   * Clave de deduplicación opcional (p. ej. el slug del archivo fuente). Cuando
   * se proporciona, se persiste en el MISMO INSERT que crea el documento, de
   * modo que la fila queda "llaveada" de forma atómica. Esto hace que el patrón
   * "borrar por source_key + reinsertar" del script de ingesta sea idempotente
   * incluso si un paso posterior falla: la próxima ejecución encontrará y
   * borrará la fila llaveada en lugar de duplicarla. Por defecto es NULL, así
   * que los llamadores existentes conservan su comportamiento.
   */
  sourceKey?: string | null;
}

export interface IngestResult {
  ok: boolean;
  documentId?: number;
  chunkCount?: number;
  embedded?: boolean;
  warning?: string;
  error?: string;
}

/** Serializa un vector number[] al formato de literal de pgvector: [a,b,c]. */
function toVectorLiteral(vec: number[]): string {
  return `[${vec.join(",")}]`;
}

/**
 * Inserta un documento y sus fragmentos (con embeddings cuando la IA está
 * configurada) en la base de conocimiento.
 */
export async function ingestDocument(
  input: IngestDocumentInput
): Promise<IngestResult> {
  const title = (input.title ?? "").trim();
  const content = (input.content ?? "").trim();
  const sourceType = input.sourceType;
  const sourceReference = (input.sourceReference ?? "").trim() || null;

  if (!title) {
    return { ok: false, error: "El título del documento es obligatorio." };
  }
  if (!content) {
    return { ok: false, error: "El contenido del documento no puede estar vacío." };
  }
  if (!KNOWLEDGE_SOURCE_TYPES[sourceType]) {
    return { ok: false, error: "Tipo de fuente inválido." };
  }

  if (!process.env.DATABASE_URL) {
    return {
      ok: false,
      error:
        "DATABASE_URL no está definida. Configura la conexión de Neon Postgres para almacenar la base de conocimiento.",
    };
  }

  const chunks = chunkText(content);
  if (chunks.length === 0) {
    return { ok: false, error: "No se generaron fragmentos a partir del contenido." };
  }

  // Intenta calcular embeddings; si la IA no está configurada, se guardan NULL.
  const config = await resolveAiConfig();
  let embeddings: number[][] | null = null;
  let warning: string | undefined;

  const embedResult = await embedTexts(config, chunks);
  if (embedResult.ok) {
    const dims = embedResult.value[0]?.length ?? 0;
    if (dims !== EMBEDDING_DIMENSION) {
      warning = `La dimensión del embedding (${dims}) no coincide con la columna vector(${EMBEDDING_DIMENSION}). Ajusta AI_EMBEDDING_MODEL o la dimensión de la columna. Los fragmentos se guardaron sin embedding.`;
    } else if (embedResult.value.length !== chunks.length) {
      warning =
        "El número de embeddings recibidos no coincide con el de fragmentos; se guardaron sin embedding.";
    } else {
      embeddings = embedResult.value;
    }
  } else {
    warning = `No se pudieron calcular embeddings (${embedResult.error}). Los fragmentos se guardaron sin embedding; la recuperación semántica requiere IA configurada.`;
  }

  const now = Date.now();
  const sourceKey = (input.sourceKey ?? "").trim() || null;

  // Persistimos source_key en el MISMO INSERT (atómico): la fila nace ya
  // llaveada. Así, si un paso posterior falla, la re-ejecución del script de
  // ingesta (que borra por source_key antes de reinsertar) elimina la fila
  // parcial en lugar de duplicarla. (Una transacción única alrededor de
  // borrar+insertar sería la opción totalmente atómica, pero llavear en el
  // INSERT ya cierra la ventana de duplicación al reejecutar.)
  const docRows = await query(
    `INSERT INTO knowledge_documents (title, source_type, source_reference, created_at, created_by, source_key)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id`,
    [title, sourceType, sourceReference, now, input.createdBy ?? null, sourceKey]
  );
  const documentId = Number(docRows[0]?.id);
  if (!Number.isFinite(documentId)) {
    return { ok: false, error: "No se pudo crear el documento en la base de datos." };
  }

  for (let i = 0; i < chunks.length; i++) {
    const embedding = embeddings ? embeddings[i] : null;
    if (embedding) {
      await query(
        `INSERT INTO knowledge_chunks (document_id, chunk_index, content, embedding, created_at)
         VALUES ($1, $2, $3, $4::vector, $5)`,
        [documentId, i, chunks[i], toVectorLiteral(embedding), now]
      );
    } else {
      await query(
        `INSERT INTO knowledge_chunks (document_id, chunk_index, content, embedding, created_at)
         VALUES ($1, $2, $3, NULL, $4)`,
        [documentId, i, chunks[i], now]
      );
    }
  }

  return {
    ok: true,
    documentId,
    chunkCount: chunks.length,
    embedded: embeddings != null,
    warning,
  };
}

export interface KnowledgeDocumentSummary {
  id: number;
  title: string;
  sourceType: string;
  sourceReference: string | null;
  createdAt: number;
  createdBy: string | null;
  chunkCount: number;
  embeddedChunkCount: number;
}

/** Lista los documentos almacenados con su conteo de fragmentos. Solo runtime. */
export async function listDocuments(): Promise<KnowledgeDocumentSummary[]> {
  if (!process.env.DATABASE_URL) return [];

  try {
    const rows = await query(
      `SELECT d.id, d.title, d.source_type, d.source_reference, d.created_at, d.created_by,
              COUNT(c.id) AS chunk_count,
              COUNT(c.embedding) AS embedded_count
         FROM knowledge_documents d
         LEFT JOIN knowledge_chunks c ON c.document_id = d.id
        GROUP BY d.id
        ORDER BY d.created_at DESC`
    );

    return rows.map((row) => ({
      id: Number(row.id),
      title: String(row.title),
      sourceType: String(row.source_type),
      sourceReference: row.source_reference == null ? null : String(row.source_reference),
      createdAt: Number(row.created_at ?? 0),
      createdBy: row.created_by == null ? null : String(row.created_by),
      chunkCount: Number(row.chunk_count ?? 0),
      embeddedChunkCount: Number(row.embedded_count ?? 0),
    }));
  } catch {
    return [];
  }
}
