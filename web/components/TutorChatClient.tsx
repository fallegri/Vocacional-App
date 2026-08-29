"use client";

import { useEffect, useRef, useState } from "react";

interface Turn {
  role: "user" | "assistant";
  content: string;
  isError?: boolean;
  grounded?: boolean;
}

const SUGGESTED_PROMPTS = [
  "¿Qué carreras encajan mejor con mi código RIASEC?",
  "¿Cómo mejorar mis habilidades en mi dimensión secundaria?",
  "¿Cuáles son las salidas laborales de mi top 1 de carreras?",
  "Compara las 2 carreras con mayor afinidad de mi test",
];

interface Props {
  sessionId?: string | null;
}

export default function TutorChatClient({ sessionId }: Props) {
  const [messages, setMessages] = useState<Turn[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages, sending]);

  const send = async (text: string) => {
    const message = text.trim();
    if (!message || sending) return;

    const history = messages
      .filter((m) => !m.isError)
      .map((m) => ({ role: m.role, content: m.content }));

    setMessages((prev) => [...prev, { role: "user", content: message }]);
    setInput("");
    setSending(true);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, sessionId: sessionId ?? null, history }),
      });
      const data = (await res.json()) as {
        reply?: string;
        error?: string;
        grounded?: boolean;
      };

      if (!res.ok || !data.reply) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content:
              data.error ??
              "No se pudo obtener respuesta del Tutor IA en este momento.",
            isError: true,
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.reply as string, grounded: data.grounded },
        ]);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: err instanceof Error ? err.message : "Error de red.",
          isError: true,
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="card" data-testid="tutor-chat">
      <div className="row spread" style={{ alignItems: "center" }}>
        <div>
          <h2 style={{ margin: 0 }}>OrientApp AI Tutor</h2>
          <p className="muted" style={{ margin: 0, fontSize: 13 }}>
            {sessionId
              ? "Contexto activo: usa tu diagnóstico para personalizar las respuestas."
              : "Realiza el test RIASEC para personalizar el tutor. También puedes hacer preguntas generales."}
          </p>
        </div>
        <a className="btn btn-secondary" href="/admin/ai-settings">
          Ajustes de IA
        </a>
      </div>

      <div
        ref={listRef}
        className="stack"
        style={{
          gap: 10,
          maxHeight: 420,
          overflowY: "auto",
          margin: "16px 0",
          padding: 4,
        }}
      >
        {messages.length === 0 ? (
          <p className="muted">
            Escribe una pregunta o elige una sugerencia para comenzar la
            conversación con tu tutor vocacional.
          </p>
        ) : null}
        {messages.map((m, idx) => (
          <div
            key={idx}
            style={{
              alignSelf: m.role === "user" ? "flex-end" : "flex-start",
              maxWidth: "85%",
            }}
          >
            <div
              className={
                m.isError ? "alert alert-warning" : "card card-muted"
              }
              style={{
                borderRadius: 14,
                whiteSpace: "pre-wrap",
                borderColor: m.role === "user" ? "var(--accent)" : undefined,
              }}
            >
              {m.role === "assistant" && !m.isError ? (
                <div className="muted" style={{ fontSize: 11, fontWeight: 700 }}>
                  OrientApp AI Tutor
                  {m.grounded ? " · fundamentado en fuentes" : ""}
                </div>
              ) : null}
              {m.content}
            </div>
          </div>
        ))}
        {sending ? (
          <div className="muted" style={{ fontSize: 13 }}>
            El Asesor IA está analizando…
          </div>
        ) : null}
      </div>

      <div className="row" style={{ gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
        {SUGGESTED_PROMPTS.map((p) => (
          <button
            key={p}
            type="button"
            className="btn btn-secondary"
            style={{ fontSize: 12 }}
            disabled={sending}
            onClick={() => void send(p)}
          >
            {p}
          </button>
        ))}
      </div>

      <form
        className="row"
        style={{ gap: 8 }}
        onSubmit={(e) => {
          e.preventDefault();
          void send(input);
        }}
      >
        <input
          className="input"
          style={{ flex: 1 }}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Pregunta a tu asesor vocacional…"
        />
        <button
          type="submit"
          className="btn"
          disabled={sending || input.trim().length === 0}
        >
          Enviar
        </button>
      </form>
    </div>
  );
}
