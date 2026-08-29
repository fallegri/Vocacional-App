"use client";

import { useEffect, useMemo, useState } from "react";

type SourceType = "BOOK" | "RESEARCH" | "ARTICLE";

const SOURCE_LABELS: Record<SourceType, string> = {
  BOOK: "Libro",
  RESEARCH: "Investigación científica",
  ARTICLE: "Artículo",
};

interface DocumentSummary {
  id: number;
  title: string;
  sourceType: string;
  sourceReference: string | null;
  createdAt: number;
  chunkCount: number;
  embeddedChunkCount: number;
}

function formatDate(ms: number): string {
  if (!ms) return "";
  try {
    return new Date(ms).toLocaleString("es");
  } catch {
    return "";
  }
}

export default function KnowledgeAdminClient() {
  const [title, setTitle] = useState("");
  const [sourceType, setSourceType] = useState<SourceType>("BOOK");
  const [sourceReference, setSourceReference] = useState("");
  const [content, setContent] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [documents, setDocuments] = useState<DocumentSummary[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(true);

  const canSubmit = useMemo(
    () => title.trim().length > 0 && content.trim().length > 0,
    [title, content]
  );

  async function loadDocuments() {
    setLoadingDocs(true);
    try {
      const res = await fetch("/api/knowledge", { cache: "no-store" });
      const data = (await res.json()) as { documents?: DocumentSummary[] };
      setDocuments(Array.isArray(data.documents) ? data.documents : []);
    } catch {
      setDocuments([]);
    } finally {
      setLoadingDocs(false);
    }
  }

  useEffect(() => {
    void loadDocuments();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setNotice(null);
    if (!canSubmit) return;
    setPending(true);

    try {
      const res = await fetch("/api/knowledge", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: title.trim(),
          sourceType,
          sourceReference: sourceReference.trim() || null,
          content,
        }),
      });
      const data = (await res.json()) as {
        error?: string;
        chunkCount?: number;
        embedded?: boolean;
        warning?: string;
      };

      if (!res.ok) {
        setError(data.error ?? "No se pudo guardar el documento.");
      } else {
        const parts = [
          `Documento guardado (${data.chunkCount ?? 0} fragmentos).`,
        ];
        if (data.embedded) {
          parts.push("Embeddings generados: disponible para búsqueda semántica.");
        } else {
          parts.push(
            "Sin embeddings: se guardó el texto pero la recuperación semántica requiere configurar la IA."
          );
        }
        if (data.warning) parts.push(data.warning);
        setNotice(parts.join(" "));
        setTitle("");
        setSourceReference("");
        setContent("");
        void loadDocuments();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error de red.");
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="stack" style={{ gap: 20 }}>
      <div className="card">
        <h2 style={{ marginTop: 0 }}>Cargar documento a la base de conocimiento</h2>
        <p className="muted" style={{ marginTop: 0 }}>
          Sube libros, investigaciones científicas o artículos de orientación
          vocacional. El texto se fragmenta y se indexa para que el Asesor y el
          Tutor IA fundamenten y citen sus respuestas en estas fuentes.
        </p>
        <form className="stack" onSubmit={handleSubmit}>
          <div className="grid grid-2">
            <div>
              <label className="label" htmlFor="kb-title">
                Título del documento
              </label>
              <input
                id="kb-title"
                className="input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Teoría de Holland sobre elección vocacional"
              />
            </div>
            <div>
              <label className="label" htmlFor="kb-type">
                Tipo de fuente
              </label>
              <select
                id="kb-type"
                className="input"
                value={sourceType}
                onChange={(e) => setSourceType(e.target.value as SourceType)}
              >
                {(Object.keys(SOURCE_LABELS) as SourceType[]).map((t) => (
                  <option key={t} value={t}>
                    {SOURCE_LABELS[t]}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="label" htmlFor="kb-reference">
              Referencia / cita / URL (opcional)
            </label>
            <input
              id="kb-reference"
              className="input"
              value={sourceReference}
              onChange={(e) => setSourceReference(e.target.value)}
              placeholder="Holland, J. L. (1997). Making vocational choices. ISBN / DOI / URL"
            />
          </div>
          <div>
            <label className="label" htmlFor="kb-content">
              Contenido / texto del documento
            </label>
            <textarea
              id="kb-content"
              className="textarea"
              rows={10}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Pega aquí el texto del libro, investigación o artículo…"
            />
          </div>
          {error ? (
            <div className="alert alert-warning" role="alert">
              {error}
            </div>
          ) : null}
          {notice ? (
            <div className="alert alert-ok" role="status">
              {notice}
            </div>
          ) : null}
          <button type="submit" className="btn" disabled={!canSubmit || pending}>
            {pending ? "Procesando e indexando…" : "Cargar e indexar documento"}
          </button>
        </form>
      </div>

      <div className="card">
        <h2 style={{ marginTop: 0 }}>Documentos almacenados</h2>
        {loadingDocs ? (
          <p className="muted">Cargando documentos…</p>
        ) : documents.length === 0 ? (
          <p className="muted">
            Aún no hay documentos en la base de conocimiento. Requiere una
            conexión activa a Neon para almacenar y listar documentos.
          </p>
        ) : (
          <div className="stack" style={{ gap: 10 }}>
            {documents.map((doc) => (
              <article
                key={doc.id}
                className="card card-muted"
                data-testid="knowledge-doc-card"
              >
                <div className="row spread" style={{ alignItems: "flex-start" }}>
                  <div>
                    <span className="badge">
                      {SOURCE_LABELS[doc.sourceType as SourceType] ?? doc.sourceType}
                    </span>
                    <h3 style={{ margin: "8px 0 2px" }}>{doc.title}</h3>
                    {doc.sourceReference ? (
                      <div className="muted" style={{ fontSize: 13 }}>
                        {doc.sourceReference}
                      </div>
                    ) : null}
                    <div className="muted" style={{ fontSize: 12 }}>
                      {formatDate(doc.createdAt)}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontWeight: 600 }}>{doc.chunkCount} fragmentos</div>
                    <div className="muted" style={{ fontSize: 12 }}>
                      {doc.embeddedChunkCount} con embedding
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
