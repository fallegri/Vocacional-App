"use client";

import { useState } from "react";
import { saveAiConfig, type AiConfigView } from "@/lib/actions/ai-config";
import { AI_PROVIDERS, type AiProviderTypeCode } from "@/lib/ai/config";

interface Props {
  initial: AiConfigView;
}

export default function AiSettingsClient({ initial }: Props) {
  const [providerType, setProviderType] = useState<AiProviderTypeCode>(
    initial.providerType
  );
  const [baseUrl, setBaseUrl] = useState(initial.baseUrl);
  const [apiKey, setApiKey] = useState("");
  const [modelName, setModelName] = useState(initial.modelName);
  const [temperature, setTemperature] = useState<number>(initial.temperature);
  const [showKey, setShowKey] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [hasApiKey, setHasApiKey] = useState(initial.hasApiKey);

  const provider = AI_PROVIDERS[providerType];

  const applyProvider = (code: AiProviderTypeCode) => {
    setProviderType(code);
    setBaseUrl(AI_PROVIDERS[code].defaultBaseUrl);
    setModelName(AI_PROVIDERS[code].defaultModel);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setPending(true);

    const result = await saveAiConfig({
      providerType,
      baseUrl: baseUrl.trim(),
      apiKey: apiKey.trim(),
      modelName: modelName.trim(),
      temperature,
    });
    setPending(false);

    if (!result.ok) {
      setError(result.error ?? "No se pudo guardar la configuración.");
    } else {
      setNotice("Configuración de IA guardada correctamente.");
      if (apiKey.trim().length > 0) setHasApiKey(true);
      setApiKey("");
    }
  };

  return (
    <div className="card">
      <h2 style={{ marginTop: 0 }}>Configuración de IA</h2>
      <p className="muted" style={{ marginTop: 0 }}>
        NVIDIA NIM / OpenAI / Local. La API key se almacena solo en el servidor y
        nunca se envía al navegador.
      </p>

      <form className="stack" onSubmit={handleSave}>
        <div>
          <label className="label">Selecciona Proveedor / Entorno</label>
          <div className="stack" style={{ gap: 8 }}>
            {(Object.keys(AI_PROVIDERS) as AiProviderTypeCode[]).map((code) => {
              const p = AI_PROVIDERS[code];
              const selected = providerType === code;
              return (
                <label
                  key={code}
                  className="card card-muted"
                  style={{
                    display: "flex",
                    gap: 10,
                    cursor: "pointer",
                    border: selected ? "1px solid var(--accent)" : undefined,
                  }}
                >
                  <input
                    type="radio"
                    name="provider"
                    checked={selected}
                    onChange={() => applyProvider(code)}
                  />
                  <span>
                    <strong>{p.displayName}</strong>
                    <br />
                    <span className="muted" style={{ fontSize: 12 }}>
                      {p.description}
                    </span>
                  </span>
                </label>
              );
            })}
          </div>
        </div>

        <div>
          <label className="label" htmlFor="ai-base-url">
            Base URL / Endpoint
          </label>
          <input
            id="ai-base-url"
            className="input"
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
            placeholder="https://integrate.api.nvidia.com/v1"
          />
        </div>

        <div>
          <label className="label" htmlFor="ai-api-key">
            {provider?.requiresApiKey
              ? "API Key (Requerida)"
              : "API Key (Opcional en local)"}
          </label>
          <div className="row" style={{ gap: 8 }}>
            <input
              id="ai-api-key"
              className="input"
              type={showKey ? "text" : "password"}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={
                hasApiKey
                  ? "•••••••• (déjalo vacío para conservar la actual)"
                  : providerType === "NVIDIA_NIM"
                    ? "nvapi-…"
                    : "sk-…"
              }
              style={{ flex: 1 }}
            />
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setShowKey((v) => !v)}
            >
              {showKey ? "Ocultar" : "Mostrar"}
            </button>
          </div>
        </div>

        <div>
          <label className="label" htmlFor="ai-model">
            Nombre del Modelo
          </label>
          <input
            id="ai-model"
            className="input"
            value={modelName}
            onChange={(e) => setModelName(e.target.value)}
            placeholder="meta/llama-3.1-70b-instruct"
          />
        </div>

        <div>
          <label className="label" htmlFor="ai-temp">
            Temperatura ({temperature.toFixed(2)})
          </label>
          <input
            id="ai-temp"
            type="range"
            min={0}
            max={2}
            step={0.1}
            value={temperature}
            onChange={(e) => setTemperature(Number(e.target.value))}
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

        <button type="submit" className="btn" disabled={pending}>
          {pending ? "Guardando…" : "Guardar configuración"}
        </button>
      </form>
    </div>
  );
}
