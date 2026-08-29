// ===========================================================================
// Cliente de IA compatible con la API de OpenAI (chat + embeddings).
// Portado fielmente desde app/src/main/java/com/example/data/remote/AiService.kt
//
// SOLO se ejecuta en el servidor (route handlers / server actions). La API key
// nunca llega al bundle del cliente. Todas las llamadas son perezosas: si no
// hay configuración, no se realiza ninguna petición de red.
// ===========================================================================

import type { AiConfiguration } from "@/lib/ai/config";
import { canEmbed, isConfigured } from "@/lib/ai/config";

export interface ChatMessageDto {
  role: "system" | "user" | "assistant";
  content: string;
}

export type AiResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: string };

/**
 * Normaliza la base URL para que apunte a /v1/chat/completions,
 * replicando la lógica de AiService.completeChat:
 *  - añade https:// si falta el esquema;
 *  - si ya termina en /chat/completions se usa tal cual;
 *  - si termina en /v1 se le añade /chat/completions;
 *  - en otro caso se añade /v1/chat/completions.
 */
export function buildChatEndpoint(baseUrl: string): string {
  let raw = baseUrl.trim().replace(/\/+$/, "");
  if (!/^https?:\/\//i.test(raw)) {
    raw = `https://${raw}`;
  }
  if (raw.endsWith("/chat/completions")) return raw;
  if (raw.endsWith("/v1")) return `${raw}/chat/completions`;
  return `${raw}/v1/chat/completions`;
}

/**
 * Normaliza la base URL para el endpoint de embeddings ({baseUrl}/embeddings).
 * Acepta entradas que terminen en /v1 o en el host desnudo.
 */
export function buildEmbeddingsEndpoint(baseUrl: string): string {
  let raw = baseUrl.trim().replace(/\/+$/, "");
  if (!/^https?:\/\//i.test(raw)) {
    raw = `https://${raw}`;
  }
  if (raw.endsWith("/embeddings")) return raw;
  if (raw.endsWith("/v1")) return `${raw}/embeddings`;
  return `${raw}/v1/embeddings`;
}

interface ChatCompletionResponse {
  choices?: Array<{ message?: { content?: string } }>;
  error?: { message?: string };
}

/**
 * Ejecuta una petición de chat completions contra el proveedor configurado.
 * Devuelve el texto de choices[0].message.content o un error en español.
 */
export async function completeChat(
  config: AiConfiguration,
  messages: ChatMessageDto[]
): Promise<AiResult<string>> {
  if (!isConfigured(config)) {
    return {
      ok: false,
      error:
        "La IA no está configurada. Define AI_BASE_URL / AI_API_KEY / AI_MODEL o guarda la configuración en Ajustes de IA.",
    };
  }

  const endpoint = buildChatEndpoint(config.baseUrl);
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (config.apiKey.trim().length > 0) {
    headers.Authorization = `Bearer ${config.apiKey.trim()}`;
  }

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model: config.modelName.trim(),
        messages,
        temperature: config.temperature,
        max_tokens: config.maxTokens,
      }),
    });

    const rawText = await response.text();
    let parsed: ChatCompletionResponse | null = null;
    try {
      parsed = rawText ? (JSON.parse(rawText) as ChatCompletionResponse) : null;
    } catch {
      parsed = null;
    }

    if (!response.ok) {
      const message =
        parsed?.error?.message ??
        `HTTP ${response.status}: ${response.statusText}${rawText ? `\n${rawText}` : ""}`;
      return { ok: false, error: message };
    }

    const content = parsed?.choices?.[0]?.message?.content;
    if (!content || content.trim().length === 0) {
      return {
        ok: false,
        error: "Respuesta vacía recibida del proveedor de IA",
      };
    }

    return { ok: true, value: content.trim() };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Error de red al contactar la IA.";
    return { ok: false, error: message };
  }
}

interface EmbeddingsResponse {
  data?: Array<{ embedding?: number[] }>;
  error?: { message?: string };
}

/**
 * Calcula el embedding de un texto. POST {baseUrl}/embeddings con el modelo de
 * embeddings configurado. Devuelve el vector number[] o un error en español.
 */
export async function embedText(
  config: AiConfiguration,
  input: string
): Promise<AiResult<number[]>> {
  const vectors = await embedTexts(config, [input]);
  if (!vectors.ok) return vectors;
  const first = vectors.value[0];
  if (!first) {
    return { ok: false, error: "No se recibió ningún vector de embedding." };
  }
  return { ok: true, value: first };
}

/**
 * Calcula los embeddings de varios textos en una sola petición cuando es
 * posible (la API de OpenAI acepta un array en "input").
 */
export async function embedTexts(
  config: AiConfiguration,
  inputs: string[]
): Promise<AiResult<number[][]>> {
  if (!canEmbed(config)) {
    return {
      ok: false,
      error:
        "Los embeddings no están disponibles: falta la configuración de IA (endpoint o API key).",
    };
  }
  if (inputs.length === 0) {
    return { ok: true, value: [] };
  }

  const endpoint = buildEmbeddingsEndpoint(config.baseUrl);
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (config.apiKey.trim().length > 0) {
    headers.Authorization = `Bearer ${config.apiKey.trim()}`;
  }

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model: config.embeddingModel.trim(),
        input: inputs,
      }),
    });

    const rawText = await response.text();
    let parsed: EmbeddingsResponse | null = null;
    try {
      parsed = rawText ? (JSON.parse(rawText) as EmbeddingsResponse) : null;
    } catch {
      parsed = null;
    }

    if (!response.ok) {
      const message =
        parsed?.error?.message ??
        `HTTP ${response.status}: ${response.statusText}`;
      return { ok: false, error: message };
    }

    const data = parsed?.data ?? [];
    const vectors = data
      .map((d) => d.embedding)
      .filter((v): v is number[] => Array.isArray(v) && v.length > 0);

    if (vectors.length === 0) {
      return {
        ok: false,
        error: "El proveedor no devolvió vectores de embedding.",
      };
    }

    return { ok: true, value: vectors };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Error de red al calcular embeddings.";
    return { ok: false, error: message };
  }
}
