"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { QUESTIONS } from "@/data/seed";
import { DIMENSION_META } from "@/lib/riasec/types";

const LIKERT = [
  { value: 1, label: "Nada" },
  { value: 2, label: "Poco" },
  { value: 3, label: "Neutral" },
  { value: 4, label: "Bastante" },
  { value: 5, label: "Mucho" },
];

interface RecordedAnswer {
  score: number;
  timeSpentMs: number;
}

export default function AssessmentClient({
  cohortCode,
}: {
  cohortCode?: string | null;
}) {
  const router = useRouter();
  const questions = QUESTIONS;
  const total = questions.length;

  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Map<number, RecordedAnswer>>(
    () => new Map()
  );
  const [studentName, setStudentName] = useState("");
  const [studentEmail, setStudentEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Marca de tiempo en que se mostró la pregunta actual, para medir timeSpentMs.
  const shownAtRef = useRef<number>(Date.now());
  const startedAtRef = useRef<number>(Date.now());

  const question = questions[index];
  const meta = DIMENSION_META[question.dimension];
  const answeredCount = answers.size;
  const progress = Math.round((answeredCount / total) * 100);
  const currentAnswer = answers.get(question.id);

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
      };
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json()) as { id?: string; error?: string };
      if (!res.ok || !data.id) {
        throw new Error(data.error ?? "No se pudo guardar la evaluación.");
      }
      router.push(`/results/${data.id}`);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Ocurrió un error al enviar la evaluación."
      );
      setSubmitting(false);
    }
  };

  return (
    <div className="stack" style={{ gap: 20 }}>
      <div className="card">
        <div className="row spread">
          <div>
            <h1 style={{ margin: 0 }}>Evaluación Vocacional RIASEC</h1>
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
            style={{ color: meta.color, borderColor: meta.color }}
          >
            {meta.title}
          </span>
          <p
            data-testid="question-text"
            style={{ fontSize: 20, fontWeight: 600, marginTop: 12 }}
          >
            {question.text}
          </p>

          <div className="likert" role="group" aria-label="Escala del 1 al 5">
            {LIKERT.map((opt) => (
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
            <span>1 · Ningún interés</span>
            <span>5 · Máximo interés</span>
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

      <div className="card center">
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
    </div>
  );
}
