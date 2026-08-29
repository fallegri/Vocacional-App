"use client";

import { useMemo, useState } from "react";
import QrCode from "@/components/QrCode";
import { DEFAULT_COHORTS } from "@/data/seed";
import { createCohort } from "@/lib/actions/cohorts";
import type { CohortGroup } from "@/lib/riasec/types";

interface DisplayCohort {
  code: string;
  title: string;
  institution: string;
  description: string;
}

function toDisplay(c: CohortGroup): DisplayCohort {
  return {
    code: c.code,
    title: c.title,
    institution: c.institution,
    description: c.description,
  };
}

export default function AdminClient() {
  const [cohorts, setCohorts] = useState<DisplayCohort[]>(() =>
    DEFAULT_COHORTS.map(toDisplay)
  );
  const [code, setCode] = useState("");
  const [title, setTitle] = useState("");
  const [institution, setInstitution] = useState("");
  const [creatorName, setCreatorName] = useState("");
  const [description, setDescription] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [justCreated, setJustCreated] = useState<string | null>(null);

  // Base absoluta para los enlaces del QR (segura en SSR y en cliente).
  const origin = useMemo(() => {
    if (typeof window !== "undefined") return window.location.origin;
    return "";
  }, []);

  const linkFor = (c: string) =>
    `${origin}/g/${encodeURIComponent(c.trim().toUpperCase())}`;

  const canSubmit = code.trim().length > 0 && title.trim().length > 0;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setNotice(null);
    if (!canSubmit) return;
    setPending(true);

    const normalized = code.trim().toUpperCase();
    const result = await createCohort({
      code: normalized,
      title: title.trim(),
      institution: institution.trim(),
      creatorName: creatorName.trim(),
      description: description.trim(),
    });
    setPending(false);

    if (!result.ok) {
      // Sin base de datos activa el grupo no se persiste, pero igualmente
      // generamos el QR para uso inmediato del formulario del grupo.
      setError(
        `${result.error ?? "No se pudo guardar en la base de datos."} El código QR se generó de todas formas para su uso inmediato.`
      );
    } else {
      setNotice(`Grupo ${normalized} creado correctamente.`);
    }

    setCohorts((prev) => {
      if (prev.some((c) => c.code === normalized)) return prev;
      return [
        {
          code: normalized,
          title: title.trim(),
          institution: institution.trim(),
          description: description.trim(),
        },
        ...prev,
      ];
    });
    setJustCreated(normalized);
    setCode("");
    setTitle("");
    setInstitution("");
    setCreatorName("");
    setDescription("");
  };

  return (
    <div className="stack" style={{ gap: 20 }}>
      <div className="card">
        <h2 style={{ marginTop: 0 }}>Crear nuevo grupo de encuesta</h2>
        <p className="muted" style={{ marginTop: 0 }}>
          Al crear un grupo se genera automáticamente un código QR que lleva al
          formulario del test vocacional asignado a ese grupo.
        </p>
        <form className="stack" onSubmit={handleCreate}>
          <div className="grid grid-2">
            <div>
              <label className="label" htmlFor="cohort-code">
                Código único (ej. BIO-2026-C)
              </label>
              <input
                id="cohort-code"
                className="input"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="ING-2026-A"
              />
            </div>
            <div>
              <label className="label" htmlFor="cohort-title">
                Nombre del grupo / curso
              </label>
              <input
                id="cohort-title"
                className="input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="6to A Ciencias"
              />
            </div>
            <div>
              <label className="label" htmlFor="cohort-institution">
                Institución educativa
              </label>
              <input
                id="cohort-institution"
                className="input"
                value={institution}
                onChange={(e) => setInstitution(e.target.value)}
                placeholder="Colegio Nacional San Martín"
              />
            </div>
            <div>
              <label className="label" htmlFor="cohort-creator">
                Creador / responsable
              </label>
              <input
                id="cohort-creator"
                className="input"
                value={creatorName}
                onChange={(e) => setCreatorName(e.target.value)}
                placeholder="Coordinador psicométrico"
              />
            </div>
          </div>
          <div>
            <label className="label" htmlFor="cohort-description">
              Descripción u observaciones (opcional)
            </label>
            <textarea
              id="cohort-description"
              className="textarea"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
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
            {pending ? "Creando grupo…" : "Crear grupo y generar QR"}
          </button>
        </form>
      </div>

      <div className="card">
        <h2 style={{ marginTop: 0 }}>Grupos y códigos QR</h2>
        <div className="grid grid-2">
          {cohorts.map((c) => (
            <article
              key={c.code}
              className="card card-muted"
              data-testid="cohort-qr-card"
              style={{
                border:
                  justCreated === c.code
                    ? "1px solid var(--accent)"
                    : undefined,
              }}
            >
              <div className="row spread" style={{ alignItems: "flex-start" }}>
                <div>
                  <span className="badge">{c.code}</span>
                  <h3 style={{ margin: "8px 0 2px" }}>{c.title}</h3>
                  <div className="muted" style={{ fontSize: 13 }}>
                    {c.institution || "Sin institución"}
                  </div>
                </div>
              </div>
              <div className="center" style={{ marginTop: 12 }}>
                <QrCode value={linkFor(c.code)} />
              </div>
              <p className="muted" style={{ fontSize: 12, wordBreak: "break-all" }}>
                {linkFor(c.code)}
              </p>
              <a
                className="btn btn-secondary"
                href={`/assessment?cohort=${encodeURIComponent(c.code)}`}
              >
                Abrir formulario del grupo
              </a>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
