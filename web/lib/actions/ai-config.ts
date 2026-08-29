"use server";

import { query } from "@/lib/db";
import { authorizeStaff } from "@/lib/auth/staff";
import {
  AI_PROVIDERS,
  resolveAiConfig,
  type AiProviderTypeCode,
} from "@/lib/ai/config";

export interface AiConfigView {
  providerType: AiProviderTypeCode;
  baseUrl: string;
  /** Indica si hay una API key guardada (nunca se expone el valor). */
  hasApiKey: boolean;
  modelName: string;
  temperature: number;
  configured: boolean;
}

export interface SaveAiConfigResult {
  ok: boolean;
  error?: string;
}

/**
 * Devuelve la configuración de IA actual para mostrarla en la UI de ajustes.
 * NUNCA devuelve la API key en claro, solo si existe una guardada.
 */
export async function getAiConfigView(): Promise<AiConfigView> {
  const config = await resolveAiConfig();
  const provider = AI_PROVIDERS[config.providerType] ?? AI_PROVIDERS.NVIDIA_NIM;
  const configured = provider.requiresApiKey
    ? config.apiKey.trim().length > 0 &&
      config.baseUrl.trim().length > 0 &&
      config.modelName.trim().length > 0
    : config.baseUrl.trim().length > 0 && config.modelName.trim().length > 0;

  return {
    providerType: config.providerType,
    baseUrl: config.baseUrl,
    hasApiKey: config.apiKey.trim().length > 0,
    modelName: config.modelName,
    temperature: config.temperature,
    configured,
  };
}

/**
 * Persiste la configuración del proveedor de IA en la fila única ai_config
 * (id = 1). Se ejecuta solo en el servidor; la API key nunca llega al cliente.
 * Si apiKey viene vacía, se conserva la clave previamente guardada.
 */
export async function saveAiConfig(input: {
  providerType: AiProviderTypeCode;
  baseUrl: string;
  apiKey: string;
  modelName: string;
  temperature: number;
  /** Token de personal; obligatorio si STAFF_ACCESS_TOKEN está definido. */
  staffToken?: string | null;
}): Promise<SaveAiConfigResult> {
  // Guardia de personal: reconfigurar el proveedor de IA (incluida la API key)
  // es una operación sensible de staff.
  const auth = authorizeStaff(input.staffToken);
  if (!auth.ok) {
    return { ok: false, error: auth.error };
  }

  const provider = AI_PROVIDERS[input.providerType];
  if (!provider) {
    return { ok: false, error: "Proveedor de IA inválido." };
  }

  const baseUrl = (input.baseUrl ?? "").trim();
  const modelName = (input.modelName ?? "").trim();
  const apiKey = (input.apiKey ?? "").trim();
  const temperature = Number.isFinite(input.temperature)
    ? Math.max(0, Math.min(2, input.temperature))
    : 0.7;

  if (!baseUrl || !modelName) {
    return { ok: false, error: "La Base URL y el modelo son obligatorios." };
  }

  if (!process.env.DATABASE_URL) {
    return {
      ok: false,
      error:
        "DATABASE_URL no está definida. Configura la conexión de Neon para guardar los ajustes de IA (o usa las variables de entorno AI_*).",
    };
  }

  try {
    // Conserva la API key existente si no se envía una nueva.
    let finalKey = apiKey;
    if (!finalKey) {
      const rows = await query(
        "SELECT api_key FROM ai_config WHERE id = 1 LIMIT 1"
      );
      finalKey = rows[0]?.api_key ? String(rows[0].api_key) : "";
    }

    await query(
      `INSERT INTO ai_config (id, provider_type, base_url, api_key, model_name, temperature)
       VALUES (1, $1, $2, $3, $4, $5)
       ON CONFLICT (id) DO UPDATE SET
         provider_type = EXCLUDED.provider_type,
         base_url = EXCLUDED.base_url,
         api_key = EXCLUDED.api_key,
         model_name = EXCLUDED.model_name,
         temperature = EXCLUDED.temperature`,
      [input.providerType, baseUrl, finalKey, modelName, temperature]
    );

    return { ok: true };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "No se pudo guardar la configuración de IA.";
    return { ok: false, error: message };
  }
}
