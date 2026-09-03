"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type {
  MethodDimension,
  MethodId,
  MethodQuestion,
  ResponseScale,
} from "@/lib/methods/types";
import { DIMENSION_META } from "@/lib/riasec/types";

/**
 * Datos serializables de un método vocacional que el servidor pasa al cliente.
 * (Las funciones score() viven solo en el servidor; el cliente solo necesita
 * los ítems y la escala para renderizar el cuestionario.)
 */
export interface MethodOption {
  id: MethodId;
  name: string;
  shortDescription: string;
  scale: ResponseScale;
  dimensions: MethodDimension[];
  questions: MethodQuestion[];
}

interface RecordedAnswer {
  score: number;
  timeSpentMs: number;
}

/** Color de una dimensión: usa el color RIASEC si existe; si no, uno neutro. */
function dimensionColor(
  methodId: MethodId,
  dimensions: MethodDimension[],
  code: string
): string {
  if (methodId === "RIASEC" && code in DIMENSION_META) {
    return DIMENSION_META[code as keyof typeof DIMENSION_META].color;
  }
  const dim = dimensions.find((d) => d.code === code);
  return dim?.color ?? "#4F46E5";
}

/** Título legible de una dimensión para el "chip" sobre cada pregunta. */
function dimensionTitle(
  dimensions: MethodDimension[],
  code: string
): string {
  const dim = dimensions.find((d) => d.code === code);
  return dim?.title ?? code;
}

export default function AssessmentClient({
  cohortCode,
  methods,
  preselectedMethodId,
  methodLocked = false,
}: {
  cohortCode?: string | null;
  methods: MethodOption[];
  preselectedMethodId: MethodId;
  methodLocked?: boolean;
}) {
  const router = useRouter();

  const [methodId, setMethodId] = useState<MethodId>(preselectedMethodId);
  const method = useMemo(
    () => methods.find((m) => m.id === methodId) ?? methods[0],
    [methods, methodId]
  );

  const questions = method.questions;
  const total = questions.length;

  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Map<number, RecordedAnswer>>(
    () => new Map()
  );
  const [studentName, setStudentName] = useState("");
  const [studentEmail, setStudentEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingAuth, setPendingAuth] = useState(false);

  // Marca de tiempo en que se mostró la pregunta actual, para medir timeSpentMs.
  const shownAtRef = useRef<number>(Date.now());
  const startedAtRef = useRef<number>(Date.now());

  // Ref para la tarjeta de "Finalizar": permite desplazarse hasta ella al
  // responder la última pregunta, evitando que el test parezca congelado.
  const finishCardRef = useRef<HTMLDivElement>(null);

  // Al cambiar de método, se reinicia el cuestionario (respuestas y posición).
  useEffect(() => {
    setAnswers(new Map());
    setIndex(0);
    shownAtRef.current = Date.now();
    startedAtRef.current = Date.now();
  }, [methodId]);

  const question = questions[index];
  const answeredCount = answers.size;
  const progress = total > 0 ? Math.round((answeredCount / total) * 100) : 0;
  const currentAnswer = answers.get(question.id);

  const isRiasec = methodId === "RIASEC";
  const scaleOptions = method.scale.options;
  const chipColor = dimensionColor(methodId, method.dimensions, question.dimension);
  const chipTitle = isRiasec
    ? (DIMENSION_META[question.dimension as keyof typeof DIMENSION_META]?.title ??
       question.dimension)
    : dimensionTitle(method.dimensions, question.dimension);

  const allAnswered = useMemo(
    () => questions.every((q) => answers.has(q.id)),
    [questions, answers]
  );

  const recordAnswer = (score: number) => {
    const now = Date.now();
    const timeSpentMs = Math.max(0, now - shownAtRef.current);
    setAnswers((prev) => {
      const next = new Map(prev);
      // Conserva el mayor tiempo si ya se había respondido y se corrige.
      const existing = next.get(question.id);
      next.set(question.id, {
        score,
        timeSpentMs: existing
          ? Math.max(existing.timeSpentMs, timeSpentMs)
          : timeSpentMs,
      });
      return next;
    });
    // Avanza automáticamente a la siguiente pregunta sin responder.
    if (index < total - 1) {
      goTo(index + 1);
    } else {
      // Última pregunta: en lugar de avanzar, desplaza la tarjeta de Finalizar
      // al centro de la pantalla para que el usuario la vea de inmediato.
      setTimeout(
        () =>
          finishCardRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "center",
          }),
        150
      );
    }
  };

  const goTo = (nextIndex: number) => {
    shownAtRef.current = Date.now();
    setIndex(Math.max(0, Math.min(total - 1, nextIndex)));
  };

  const handleSubmit = async () => {
    setError(null);
    setSubmitting(true);
    try {
      const payload = {
        answers: Array.from(answers.entries()).map(([questionId, a]) => ({
          questionId,
          score: a.score,
          timeSpentMs: a.timeSpentMs,
        })),
        cohortCode: cohortCode ?? null,
        studentName: studentName.trim() || null,
        studentEmail: studentEmail.trim() || null,
        startedAt: startedAtRef.current,
        methodId,
      };
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json()) as {
        id?: string;
        error?: string;
        requiresAuthorization?: boolean;
      };
      if (!res.ok || !data.id) {
        throw new Error(data.error ?? "No se pudo guardar la evaluación.");
      }
      if (data.requiresAuthorization) {
        setPendingAuth(true);
        setSubmitting(false);
        return;
      }
      if (cohortCode) {
        window.location.href = `/results/${data.id}?group=1`;
      } else {
        router.push(`/results/${data.id}`);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Ocurrió un error al enviar la evaluación."
      );
      setSubmitting(false);
    }
  };

  // Etiquetas de extremos de la escala. Para RIASEC/Likert-5 se mantienen las
  // clásicas. Para otras escalas, las etiquetas deben seguir el MISMO orden en
  // que se renderizan los botones (la primera opción a la izquierda, la última
  // a la derecha), de modo que la leyenda coincida con la posición del botón.
  const lowLabel = isRiasec
    ? "1 · Ningún interés"
    : `${scaleOptions[0]?.label ?? ""}`;
  const highLabel = isRiasec
    ? "5 · Máximo interés"
    : `${scaleOptions[scaleOptions.length - 1]?.label ?? ""}`;

  return (
    <div className="stack" style={{ gap: 20 }}>
      <div className="card">
        <div className="row spread">
          <div>
            <h1 style={{ margin: 0 }}>
              {isRiasec
                ? "Evaluación Vocacional RIASEC"
                : `Evaluación Vocacional ${method.name}`}
            </h1>
            <p className="muted" style={{ margin: "4px 0 0" }}>
              Responde con honestidad según tu nivel de interés.
            </p>
          </div>
          {cohortCode ? (
            <span className="badge" data-testid="cohort-badge">
              Grupo: {cohortCode}
            </span>
          ) : null}
        </div>

        {/* Selector de método (o método fijado por la cohorte). */}
        <div style={{ marginTop: 16 }}>
          <label className="label" htmlFor="method-select">
            Método de evaluación
          </label>
          {methodLocked ? (
            <div>
              <span
                className="badge"
                data-testid="method-selector"
                data-method-id={methodId}
              >
                Método asignado: {method.name}
              </span>
              <p className="muted" style={{ margin: "6px 0 0", fontSize: 13 }}>
                Este grupo tiene un método asignado. No es posible cambiarlo.
              </p>
            </div>
          ) : (
            <>
              <select
                id="method-select"
                className="input"
                data-testid="method-selector"
                value={methodId}
                onChange={(e) => setMethodId(e.target.value as MethodId)}
              >
                {methods.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
              <p className="muted" style={{ margin: "6px 0 0", fontSize: 13 }}>
                {method.shortDescription}
              </p>
            </>
          )}
        </div>

        <div className="grid grid-2" style={{ marginTop: 16 }}>
          <div>
            <label className="label" htmlFor="student-name">
              Nombre (opcional)
            </label>
            <input
              id="student-name"
              className="input"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              placeholder="Tu nombre completo"
            />
          </div>
          <div>
            <label className="label" htmlFor="student-email">
              Correo (opcional)
            </label>
            <input
              id="student-email"
              className="input"
              type="email"
              value={studentEmail}
              onChange={(e) => setStudentEmail(e.target.value)}
              placeholder="tu.correo@ejemplo.com"
            />
          </div>
        </div>
      </div>

      <div className="card">
        <div className="row spread" style={{ marginBottom: 8 }}>
          <span className="muted">
            Pregunta {index + 1} de {total}
          </span>
          <span className="muted">
            {answeredCount} / {total} respondidas
          </span>
        </div>
        <div className="progress-track" aria-hidden>
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>

        <div style={{ marginTop: 20 }}>
          <span
            className="chip"
            style={{ color: chipColor, borderColor: chipColor }}
          >
            {chipTitle}
          </span>
          <p
            data-testid="question-text"
            style={{ fontSize: 20, fontWeight: 600, marginTop: 12 }}
          >
            {question.text}
          </p>

          <div
            className="likert"
            role="group"
            aria-label={`Escala de respuesta ${method.name}`}
          >
            {scaleOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                className={
                  currentAnswer?.score === opt.value ? "selected" : undefined
                }
                onClick={() => recordAnswer(opt.value)}
              >
                <div>{opt.value}</div>
                <div style={{ fontSize: 11, fontWeight: 500 }}>{opt.label}</div>
              </button>
            ))}
          </div>
          <div className="likert-scale-labels">
            <span>{lowLabel}</span>
            <span>{highLabel}</span>
          </div>
        </div>

        <div className="row spread" style={{ marginTop: 20 }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => goTo(index - 1)}
            disabled={index === 0}
          >
            Anterior
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => goTo(index + 1)}
            disabled={index === total - 1}
          >
            Siguiente
          </button>
        </div>
      </div>

      {error ? (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      ) : null}

      <div
        ref={finishCardRef}
        className="card center"
        style={{
          border: allAnswered ? "2px solid var(--accent)" : undefined,
        }}
      >
        <p className="muted" style={{ marginTop: 0 }}>
          {allAnswered
            ? "¡Has respondido todas las preguntas! Puedes ver tus resultados."
            : `Te faltan ${total - answeredCount} preguntas por responder.`}
        </p>
        <button
          type="button"
          className="btn"
          onClick={handleSubmit}
          disabled={!allAnswered || submitting}
        >
          {submitting ? "Calculando resultados…" : "Finalizar y ver resultados"}
        </button>
      </div>

      {pendingAuth ? (
        <div className="card center">
          <p style={{ fontSize: 20, marginBottom: 8 }}>✅</p>
          <h2 style={{ marginTop: 0 }}>Evaluación registrada</h2>
          <p>
            Tu solicitud fue registrada. Un administrador debe autorizarla para
            que puedas ver tus resultados.
          </p>
          <p className="muted" style={{ fontSize: 13, marginBottom: 0 }}>
            Una vez autorizada, podrás acceder a tus resultados iniciando sesión
            con tu cuenta.
          </p>
        </div>
      ) : null}
    </div>
  );
}
