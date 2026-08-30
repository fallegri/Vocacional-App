// ===========================================================================
// Mapeo puro (sin DB ni FS) de los documentos fuente de skills/knowledge/*.md
// a un descriptor de documento para la ingesta RAG.
//
// La función `describeKnowledgeSource` recibe el NOMBRE DE ARCHIVO (y,
// opcionalmente, el primer encabezado H1 del markdown) y devuelve un descriptor
// determinista: { slug, title, sourceType, sourceReference }. Al ser pura y
// dirigida por el nombre de archivo, puede probarse por unidad sin una base de
// datos ni acceso al sistema de archivos.
//
// `slug` se usa como `source_key` para la deduplicación idempotente en la
// ingesta: un mismo archivo siempre produce el mismo slug, de modo que
// reejecutar la ingesta reemplaza (no duplica) el documento.
// ===========================================================================

import type { KnowledgeSourceType } from "@/lib/knowledge/ingest";

export interface KnowledgeSourceDescriptor {
  /** Clave estable derivada del nombre de archivo; se usa como source_key. */
  slug: string;
  /** Título legible en español (del encabezado H1 si se provee, si no del slug). */
  title: string;
  /** Tipo de fuente para la base de conocimiento (RESEARCH para estos estudios). */
  sourceType: KnowledgeSourceType;
  /** Cita bibliográfica cuando es evidente en el documento; null en caso contrario. */
  sourceReference: string | null;
}

/**
 * Referencias bibliográficas conocidas por slug, tomadas de la sección
 * "Bibliografía de Referencia" de cada documento cuando es evidente.
 */
const KNOWN_REFERENCES: Record<string, string> = {
  "cuestionario-cip-r":
    "Fogliatto, H., Pérez, E., Olaz, F. & Parodi, L. (2003). Cuestionario de Intereses Profesionales Revisado (CIP-R). Análisis de sus Propiedades Psicométricas. Revista Evaluar.",
  "test-magdalena-contreras":
    "Alcaldía La Magdalena Contreras (2021). Test de orientación vocacional, Ciudad de México; Lizarazo, N. (2024). Test Vocacional (basado en la escala de Magdalena Contreras). UNICISO.",
};

/**
 * Títulos legibles en español por slug, usados cuando no se provee el
 * encabezado H1 del documento (por ejemplo en pruebas unitarias).
 */
const FALLBACK_TITLES: Record<string, string> = {
  "cuestionario-cip-r":
    "Cuestionario de Intereses Profesionales Revisado (CIP-R)",
  "instrumento-autoorientacion":
    "Propuesta de Instrumento de Autoorientación (Blanco Blanco & Frutos Martín)",
  "jaime-bernstein-adleriano":
    "Psicología Individual Adleriana Aplicada a la Orientación (Jaime Bernstein)",
  "metodo-chaside": "Método y Test de Orientación Vocacional CHASIDE",
  "otros-inventarios-kuder-strong":
    "Contextualización de otros Inventarios Clásicos (Strong & Kuder)",
  "test-magdalena-contreras":
    "Test de Orientación Vocacional - Alcaldía La Magdalena Contreras",
  "test-tipov":
    "Test de Intereses Profesionales para la Orientación Vocacional (TIPOV)",
};

/** Deriva un slug estable a partir del nombre de archivo (sin extensión). */
export function slugFromFilename(filename: string): string {
  // Toma solo el nombre base y elimina la extensión .md.
  const base = filename.split(/[\\/]/).pop() ?? filename;
  const withoutExt = base.replace(/\.md$/i, "");
  return withoutExt
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // quita diacríticos
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-") // no alfanumérico -> guion
    .replace(/^-+|-+$/g, ""); // recorta guiones extremos
}

/**
 * Convierte un slug en un título legible: separa por guiones y capitaliza
 * cada palabra. Solo se usa como último recurso cuando no hay H1 ni título
 * conocido.
 */
function titleFromSlug(slug: string): string {
  return slug
    .split("-")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Extrae el título del primer encabezado H1 markdown (línea que empieza con
 * "# "). Devuelve null si no se encuentra.
 */
export function titleFromHeading(heading: string | null | undefined): string | null {
  if (!heading) return null;
  const match = heading.match(/^\s*#\s+(.+?)\s*$/m);
  if (!match) return null;
  const title = match[1].trim();
  return title.length > 0 ? title : null;
}

/**
 * Mapea un nombre de archivo (y, opcionalmente, el primer encabezado H1 del
 * documento) a un descriptor de documento para la ingesta. Función PURA.
 *
 * @param filename Nombre del archivo, p. ej. "cuestionario-cip-r.md".
 * @param heading  Primer encabezado H1 del markdown (opcional). Si se provee,
 *                 tiene prioridad para el título.
 */
export function describeKnowledgeSource(
  filename: string,
  heading?: string | null
): KnowledgeSourceDescriptor {
  const slug = slugFromFilename(filename);
  const headingTitle = titleFromHeading(heading);
  const title =
    headingTitle ?? FALLBACK_TITLES[slug] ?? titleFromSlug(slug);

  return {
    slug,
    title,
    // Todos estos documentos son estudios/métodos de investigación aplicada.
    sourceType: "RESEARCH",
    sourceReference: KNOWN_REFERENCES[slug] ?? null,
  };
}
