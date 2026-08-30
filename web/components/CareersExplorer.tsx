"use client";

import { useState } from "react";
import { CAREERS } from "@/data/seed";
import {
  DIMENSION_ORDER,
  DIMENSION_META,
  type Career,
  type DimensionCode,
} from "@/lib/riasec/types";

function idealFor(career: Career, code: DimensionCode): number {
  switch (code) {
    case "R":
      return career.idealR;
    case "I":
      return career.idealI;
    case "A":
      return career.idealA;
    case "S":
      return career.idealS;
    case "E":
      return career.idealE;
    case "C":
      return career.idealC;
  }
}

export default function CareersExplorer() {
  const [selected, setSelected] = useState<Career | null>(null);

  return (
    <>
      <div className="grid grid-3">
        {CAREERS.map((career) => (
          <article
            key={career.id}
            className="card"
            data-testid="career-card"
            style={{ cursor: "pointer" }}
            onClick={() => setSelected(career)}
          >
            <span className="badge">{career.areaName}</span>
            <h3 style={{ margin: "10px 0 6px" }}>{career.title}</h3>
            <p className="muted" style={{ fontSize: 14 }}>
              {career.description}
            </p>
            <div style={{ marginTop: 8 }}>
              {career.keySkills.slice(0, 3).map((skill) => (
                <span key={skill} className="chip">
                  {skill}
                </span>
              ))}
            </div>
            <button
              type="button"
              className="btn btn-ghost"
              style={{ marginTop: 8, paddingLeft: 0 }}
            >
              Ver detalle →
            </button>
          </article>
        ))}
      </div>

      {selected ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Detalle de ${selected.title}`}
          data-testid="career-detail"
          onClick={() => setSelected(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
            zIndex: 50,
          }}
        >
          <div
            className="card"
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: 720,
              maxHeight: "88vh",
              overflowY: "auto",
              borderRadius: "20px 20px 0 0",
            }}
          >
            <div className="row spread" style={{ alignItems: "flex-start" }}>
              <div>
                <span className="badge">{selected.areaName}</span>
                <h2 style={{ margin: "8px 0 0" }}>{selected.title}</h2>
              </div>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setSelected(null)}
              >
                Cerrar
              </button>
            </div>

            <section style={{ marginTop: 16 }}>
              <h4 style={{ marginBottom: 4 }}>Descripción Ocupacional</h4>
              <p className="muted" style={{ marginTop: 0 }}>
                {selected.description}
              </p>
            </section>

            <section>
              <h4 style={{ marginBottom: 4 }}>
                Entornos y Ámbitos de Trabajo
              </h4>
              <p className="muted" style={{ marginTop: 0 }}>
                {selected.workEnvironment}
              </p>
            </section>

            <section>
              <h4 style={{ marginBottom: 4 }}>
                Tendencias y Proyección Futura
              </h4>
              <p className="muted" style={{ marginTop: 0 }}>
                {selected.futureTrends}
              </p>
            </section>

            <section>
              <h4 style={{ marginBottom: 8 }}>
                Competencias y Habilidades Clave
              </h4>
              <div>
                {selected.keySkills.map((skill) => (
                  <span key={skill} className="chip">
                    {skill}
                  </span>
                ))}
              </div>
            </section>

            <section>
              <h4 style={{ marginBottom: 8 }}>Perfil RIASEC ideal (O*NET)</h4>
              <div className="stack">
                {DIMENSION_ORDER.map((code) => {
                  const meta = DIMENSION_META[code];
                  const value = idealFor(selected, code);
                  return (
                    <div key={code}>
                      <div className="row spread" style={{ marginBottom: 4 }}>
                        <span style={{ color: meta.color, fontWeight: 600 }}>
                          {code} · {meta.title}
                        </span>
                        <span className="muted">{value}%</span>
                      </div>
                      <div className="dimension-bar-track">
                        <div
                          className="dimension-bar-fill"
                          style={{ width: `${value}%`, background: meta.color }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        </div>
      ) : null}
    </>
  );
}
