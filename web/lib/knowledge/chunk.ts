// ===========================================================================
// Segmentación de texto en fragmentos (chunks) solapados para la base de
// conocimiento (RAG). Funciones puras, sin dependencias de red ni de DB.
// ===========================================================================

export interface ChunkOptions {
  /** Tamaño máximo aproximado de cada chunk en caracteres. */
  chunkSize?: number;
  /** Solapamiento en caracteres entre chunks consecutivos. */
  overlap?: number;
}

const DEFAULT_CHUNK_SIZE = 1200;
const DEFAULT_OVERLAP = 200;

/**
 * Divide el contenido en fragmentos solapados. Intenta cortar en límites de
 * párrafo/oración cercanos para no partir ideas por la mitad, con un
 * solapamiento configurable para preservar el contexto entre fragmentos.
 */
export function chunkText(content: string, options: ChunkOptions = {}): string[] {
  const chunkSize = Math.max(200, options.chunkSize ?? DEFAULT_CHUNK_SIZE);
  const overlap = Math.max(0, Math.min(options.overlap ?? DEFAULT_OVERLAP, chunkSize - 1));

  const normalized = content.replace(/\r\n/g, "\n").trim();
  if (normalized.length === 0) return [];
  if (normalized.length <= chunkSize) return [normalized];

  const chunks: string[] = [];
  let start = 0;

  while (start < normalized.length) {
    let end = Math.min(start + chunkSize, normalized.length);

    if (end < normalized.length) {
      // Busca un buen punto de corte (salto de párrafo, punto o espacio)
      // dentro del último 30% del chunk para no cortar palabras/oraciones.
      const window = normalized.slice(start, end);
      const minBreak = Math.floor(window.length * 0.7);
      const breakPoint = Math.max(
        window.lastIndexOf("\n\n"),
        window.lastIndexOf(". "),
        window.lastIndexOf("\n"),
        window.lastIndexOf(" ")
      );
      if (breakPoint > minBreak) {
        end = start + breakPoint + 1;
      }
    }

    const piece = normalized.slice(start, end).trim();
    if (piece.length > 0) chunks.push(piece);

    if (end >= normalized.length) break;
    start = Math.max(end - overlap, start + 1);
  }

  return chunks;
}
