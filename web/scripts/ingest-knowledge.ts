// ===========================================================================
// Script de ingesta de la base de conocimiento (RAG).
//
// Uso:
//   npm run knowledge:ingest
//
// Qué hace:
//   1. Verifica que DATABASE_URL esté definida (si no, sale con un mensaje claro
//      en español SIN tocar la base de datos ni la red).
//   2. Aplica el esquema autoritativo web/db/schema.sql (idempotente), de modo
//      que la columna source_key exista antes de usarla.
//   3. Lee los documentos markdown de skills/knowledge/ (un nivel por encima de
//      web/) y, para cada uno, calcula un descriptor puro (slug/título/tipo/
//      referencia) con describeKnowledgeSource().
//   4. Es IDEMPOTENTE: borra el documento existente con el mismo source_key
//      (ON DELETE CASCADE elimina sus fragmentos) ANTES de reinsertar el
//      documento y sus fragmentos, de modo que reejecutar nunca duplica.
//      El source_key se persiste en el MISMO INSERT que crea el documento
//      (vía ingestDocument({ sourceKey })), por lo que la fila nace ya
//      "llaveada" de forma atómica. Así, aunque el proceso falle a mitad de
//      camino, la próxima ejecución encuentra y borra esa fila llaveada en
//      lugar de dejar un duplicado sin llave. (Una transacción única alrededor
//      de borrar+insertar sería la opción totalmente atómica, pero llavear en
//      el INSERT ya cierra la ventana de duplicación al reejecutar.)
//   5. Reutiliza el pipeline existente ingestDocument(); si la IA no está
//      configurada, los fragmentos se guardan con embedding NULL y se muestra
//      una advertencia en español.
//   6. NO ingiere el PDF de skills/knowledge/ (solo los .md).
//
// Este script SOLO se ejecuta bajo demanda (nunca durante `next build`) y lee
// DATABASE_URL en tiempo de ejecución mediante el cliente perezoso de
// web/lib/db.ts.
// ===========================================================================

import { readFile, readdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

import { query } from "@/lib/db";
import { ingestDocument } from "@/lib/knowledge/ingest";
import { describeKnowledgeSource } from "@/lib/knowledge/sources";

const HERE = path.dirname(fileURLToPath(import.meta.url)); // web/scripts
const SCHEMA_PATH = path.resolve(HERE, "..", "db", "schema.sql");
const KNOWLEDGE_DIR = path.resolve(HERE, "..", "..", "skills", "knowledge");

/**
 * Divide el contenido SQL en sentencias individuales respetando los bloques
 * con comillas simples. El driver serverless de Neon ejecuta una sentencia por
 * llamada, así que aplicamos el esquema sentencia por sentencia.
 */
function splitSqlStatements(sql: string): string[] {
  const statements: string[] = [];
  let current = "";
  let inSingleQuote = false;

  for (let i = 0; i < sql.length; i += 1) {
    const char = sql[i];

    // Saltar comentarios de línea (-- ... hasta el fin de línea) fuera de cadenas.
    if (!inSingleQuote && char === "-" && sql[i + 1] === "-") {
      const newline = sql.indexOf("\n", i);
      if (newline === -1) break;
      i = newline;
      continue;
    }

    if (char === "'") {
      inSingleQuote = !inSingleQuote;
    }

    if (char === ";" && !inSingleQuote) {
      const trimmed = current.trim();
      if (trimmed.length > 0) statements.push(trimmed);
      current = "";
      continue;
    }

    current += char;
  }

  const tail = current.trim();
  if (tail.length > 0) statements.push(tail);
  return statements;
}

async function applySchema(): Promise<void> {
  console.log("→ Aplicando esquema web/db/schema.sql ...");
  const sql = await readFile(SCHEMA_PATH, "utf8");
  const statements = splitSqlStatements(sql);
  for (const statement of statements) {
    await query(statement);
  }
  console.log(`  ✓ ${statements.length} sentencias aplicadas (idempotentes).`);
}

/** Extrae el primer encabezado H1 (# ...) del contenido markdown. */
function firstHeading(content: string): string | null {
  const match = content.match(/^\s*#\s+.+$/m);
  return match ? match[0] : null;
}

interface IngestSummary {
  documents: number;
  totalChunks: number;
  embeddedDocuments: number;
  warnings: string[];
}

async function main(): Promise<void> {
  if (!process.env.DATABASE_URL) {
    console.error(
      "\n✗ DATABASE_URL no está definida.\n" +
        "  Configura la cadena de conexión de Neon Postgres antes de ingerir la base de conocimiento.\n" +
        "  Por ejemplo, crea web/.env.local con:\n" +
        "    DATABASE_URL=postgres://usuario:password@host.neon.tech/orientapp?sslmode=require\n" +
        "  y vuelve a ejecutar: npm run knowledge:ingest\n"
    );
    process.exit(1);
    return;
  }

  console.log("Ingiriendo la base de conocimiento OrientApp en Neon ...\n");
  await applySchema();

  // Lee solo los archivos .md de skills/knowledge/ (el PDF se omite).
  const entries = await readdir(KNOWLEDGE_DIR);
  const mdFiles = entries.filter((name) => name.toLowerCase().endsWith(".md")).sort();
  const pdfFiles = entries.filter((name) => name.toLowerCase().endsWith(".pdf"));

  if (pdfFiles.length > 0) {
    console.log(
      `\nℹ Se omiten ${pdfFiles.length} archivo(s) PDF (solo se ingieren documentos .md en este paso):`
    );
    for (const pdf of pdfFiles) console.log(`    · ${pdf}`);
  }

  console.log(`\n→ ${mdFiles.length} documento(s) markdown a ingerir.\n`);

  const summary: IngestSummary = {
    documents: 0,
    totalChunks: 0,
    embeddedDocuments: 0,
    warnings: [],
  };

  for (const filename of mdFiles) {
    const filePath = path.join(KNOWLEDGE_DIR, filename);
    const content = await readFile(filePath, "utf8");
    const descriptor = describeKnowledgeSource(filename, firstHeading(content));

    // IDEMPOTENCIA: borra el documento previo con este source_key antes de
    // reinsertar (ON DELETE CASCADE elimina sus fragmentos).
    await query(`DELETE FROM knowledge_documents WHERE source_key = $1`, [
      descriptor.slug,
    ]);

    // Pasamos source_key a ingestDocument() para que la fila nazca ya llaveada
    // en el MISMO INSERT (atómico). Combinado con el DELETE por source_key de
    // arriba, esto hace la ingesta idempotente incluso si un paso posterior
    // falla: la próxima ejecución borra la fila llaveada en lugar de duplicarla.
    const result = await ingestDocument({
      title: descriptor.title,
      sourceType: descriptor.sourceType,
      sourceReference: descriptor.sourceReference,
      content,
      createdBy: "ingest-script",
      sourceKey: descriptor.slug,
    });

    if (!result.ok || result.documentId == null) {
      console.error(`  ✗ ${filename}: ${result.error ?? "error desconocido"}`);
      summary.warnings.push(`${filename}: ${result.error ?? "error desconocido"}`);
      continue;
    }

    summary.documents += 1;
    summary.totalChunks += result.chunkCount ?? 0;
    if (result.embedded) summary.embeddedDocuments += 1;

    const embedNote = result.embedded ? "con embeddings" : "SIN embeddings";
    console.log(
      `  ✓ ${filename} → "${descriptor.title}" (${result.chunkCount ?? 0} fragmentos, ${embedNote})`
    );
    if (result.warning) summary.warnings.push(`${filename}: ${result.warning}`);
  }

  console.log("\n──────────────────────────────────────────────");
  console.log("Resumen de la ingesta:");
  console.log(`  · Documentos ingeridos: ${summary.documents}`);
  console.log(`  · Fragmentos totales:   ${summary.totalChunks}`);
  console.log(`  · Documentos con embeddings: ${summary.embeddedDocuments}`);
  console.log(
    `  · Documentos sin embeddings: ${summary.documents - summary.embeddedDocuments}`
  );

  if (summary.documents - summary.embeddedDocuments > 0) {
    console.log(
      "\n⚠ Algunos documentos se guardaron SIN embeddings.\n" +
        "  La recuperación semántica (RAG) requiere IA configurada (AI_API_KEY / AI_BASE_URL).\n" +
        "  Configura la IA y vuelve a ejecutar `npm run knowledge:ingest` para reindexar\n" +
        "  esos documentos con embeddings."
    );
  }

  if (summary.warnings.length > 0) {
    console.log("\nAdvertencias:");
    for (const w of summary.warnings) console.log(`  · ${w}`);
  }

  console.log("\n✓ Ingesta finalizada.");
}

function describeError(err: unknown): string {
  if (err instanceof Error && err.message) return err.message;
  if (err && typeof err === "object") {
    const maybe = err as { message?: unknown; error?: { message?: unknown } };
    if (typeof maybe.message === "string" && maybe.message) return maybe.message;
    if (typeof maybe.error?.message === "string" && maybe.error.message) {
      return maybe.error.message;
    }
  }
  return String(err);
}

main().catch((err: unknown) => {
  console.error(
    `\n✗ Error al ingerir la base de conocimiento: ${describeError(err)}\n` +
      "  Verifica que DATABASE_URL apunte a una base Neon accesible y que la\n" +
      "  extensión pgvector esté disponible (CREATE EXTENSION vector).\n"
  );
  process.exit(1);
});
