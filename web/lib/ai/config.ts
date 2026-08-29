// ===========================================================================
// Configuración del proveedor de IA (compatible con la API de OpenAI).
// Portado desde app/src/main/java/com/example/data/model/AiModels.kt
// (AiProviderType + AiConfiguration).
//
// La configuración se resuelve SOLO en el servidor y de forma perezosa:
// - primero desde variables de entorno (AI_BASE_URL, AI_API_KEY, AI_MODEL,
//   AI_EMBEDDING_MODEL, AI_TEMPERATURE, AI_MAX_TOKENS);
// - y, si hay base de datos, se completa/sobrescribe con la fila de ai_config.
// La API key NUNCA se envía al cliente: todo se usa en route handlers / server
// actions.
// ===========================================================================

export type AiProviderTypeCode = "NVIDIA_NIM" | "OPENAI" | "LOCAL_AI" | "CUSTOM";

export interface AiProviderMeta {
  code: AiProviderTypeCode;
  displayName: string;
  defaultBaseUrl: string;
  defaultModel: string;
  description: string;
  requiresApiKey: boolean;
}

/** Metadatos de los proveedores soportados (portados de AiProviderType). */
export const AI_PROVIDERS: Record<AiProviderTypeCode, AiProviderMeta> = {
  NVIDIA_NIM: {
    code: "NVIDIA_NIM",
    displayName: "NVIDIA NIM / API",
    defaultBaseUrl: "https://integrate.api.nvidia.com/v1",
    defaultModel: "meta/llama-3.1-70b-instruct",
    description:
      "Inferencia acelerada de alto rendimiento de NVIDIA con soporte para Llama 3.1, Nemotron y Mixtral.",
    requiresApiKey: true,
  },
  OPENAI: {
    code: "OPENAI",
    displayName: "OpenAI",
    defaultBaseUrl: "https://api.openai.com/v1",
    defaultModel: "gpt-4o-mini",
    description: "Modelos comerciales de OpenAI (GPT-4o, GPT-4o-mini).",
    requiresApiKey: true,
  },
  LOCAL_AI: {
    code: "LOCAL_AI",
    displayName: "IA Local (Ollama / LM Studio)",
    defaultBaseUrl: "http://localhost:11434/v1",
    defaultModel: "llama3.2",
    description:
      "Modelos ejecutados 100% en tu servidor/PC local sin costo y con máxima privacidad.",
    requiresApiKey: false,
  },
  CUSTOM: {
    code: "CUSTOM",
    displayName: "Proveedor Personalizado",
    defaultBaseUrl: "https://api.together.xyz/v1",
    defaultModel: "mistralai/Mixtral-8x7B-Instruct-v0.1",
    description: "Cualquier endpoint compatible con la API de OpenAI / v1.",
    requiresApiKey: true,
  },
};

export const DEFAULT_EMBEDDING_MODEL = "text-embedding-3-small";
/** Dimensión del vector de embeddings; debe coincidir con vector(1536) del esquema. */
export const EMBEDDING_DIMENSION = 1536;

export interface AiConfiguration {
  providerType: AiProviderTypeCode;
  baseUrl: string;
  apiKey: string;
  modelName: string;
  embeddingModel: string;
  temperature: number;
  maxTokens: number;
}

/** Equivalente a AiConfiguration.isConfigured() de Kotlin. */
export function isConfigured(config: AiConfiguration): boolean {
  const provider = AI_PROVIDERS[config.providerType];
  const hasBaseAndModel =
    config.baseUrl.trim().length > 0 && config.modelName.trim().length > 0;
  if (provider?.requiresApiKey) {
    return config.apiKey.trim().length > 0 && hasBaseAndModel;
  }
  return hasBaseAndModel;
}

/** true cuando podemos calcular embeddings (hay endpoint y, si aplica, key). */
export function canEmbed(config: AiConfiguration): boolean {
  const hasEndpoint = config.baseUrl.trim().length > 0;
  const provider = AI_PROVIDERS[config.providerType];
  if (provider?.requiresApiKey) {
    return hasEndpoint && config.apiKey.trim().length > 0;
  }
  return hasEndpoint;
}

function envConfig(): AiConfiguration {
  const providerType = (process.env.AI_PROVIDER_TYPE as AiProviderTypeCode) || "NVIDIA_NIM";
  const provider = AI_PROVIDERS[providerType] ?? AI_PROVIDERS.NVIDIA_NIM;
  const temperature = Number(process.env.AI_TEMPERATURE);
  const maxTokens = Number(process.env.AI_MAX_TOKENS);
  return {
    providerType: provider.code,
    baseUrl: process.env.AI_BASE_URL?.trim() || provider.defaultBaseUrl,
    apiKey: process.env.AI_API_KEY?.trim() || "",
    modelName: process.env.AI_MODEL?.trim() || provider.defaultModel,
    embeddingModel:
      process.env.AI_EMBEDDING_MODEL?.trim() || DEFAULT_EMBEDDING_MODEL,
    temperature: Number.isFinite(temperature) ? temperature : 0.7,
    maxTokens: Number.isFinite(maxTokens) && maxTokens > 0 ? maxTokens : 1024,
  };
}

/**
 * Resuelve la configuración de IA (servidor, runtime). Combina las variables
 * de entorno con la fila de ai_config (id = 1) si la base de datos responde.
 * Nunca lanza: si la DB no está disponible, usa solo el entorno.
 */
export async function resolveAiConfig(): Promise<AiConfiguration> {
  const base = envConfig();

  if (!process.env.DATABASE_URL) {
    return base;
  }

  try {
    const { query } = await import("@/lib/db");
    const rows = await query(
      "SELECT provider_type, base_url, api_key, model_name, temperature FROM ai_config WHERE id = 1 LIMIT 1"
    );
    const row = rows[0];
    if (!row) return base;

    const providerType =
      (String(row.provider_type ?? base.providerType) as AiProviderTypeCode) ||
      base.providerType;
    const temperature = Number(row.temperature);
    return {
      providerType: AI_PROVIDERS[providerType] ? providerType : base.providerType,
      baseUrl: String(row.base_url ?? "").trim() || base.baseUrl,
      apiKey: String(row.api_key ?? "").trim() || base.apiKey,
      modelName: String(row.model_name ?? "").trim() || base.modelName,
      embeddingModel: base.embeddingModel,
      temperature: Number.isFinite(temperature) ? temperature : base.temperature,
      maxTokens: base.maxTokens,
    };
  } catch {
    // Sin DB o error de consulta: usa la configuración de entorno.
    return base;
  }
}
