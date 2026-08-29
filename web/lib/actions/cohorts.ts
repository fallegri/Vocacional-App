"use server";

import { query } from "@/lib/db";

export interface CreateCohortResult {
  ok: boolean;
  code?: string;
  error?: string;
}

/**
 * Crea un nuevo grupo/cohorte de encuesta en Neon.
 * Se ejecuta solo en el servidor y en tiempo de ejecución (nunca en el build).
 * Tras crear el grupo, el cliente genera el código QR que lleva al formulario
 * del test vocacional asignado a ese grupo (/g/{code}).
 */
export async function createCohort(input: {
  code: string;
  title: string;
  institution: string;
  creatorName: string;
  description?: string;
}): Promise<CreateCohortResult> {
  const code = (input.code ?? "").trim().toUpperCase();
  const title = (input.title ?? "").trim();
  const institution = (input.institution ?? "").trim();
  const creatorName = (input.creatorName ?? "").trim() || "Personal OrientApp";
  const description = (input.description ?? "").trim();

  if (!code || !title) {
    return { ok: false, error: "El código y el nombre del grupo son obligatorios." };
  }

  try {
    const existing = await query(
      "SELECT code FROM cohort_groups WHERE code = $1 LIMIT 1",
      [code]
    );
    if (existing.length > 0) {
      return { ok: false, error: `Ya existe un grupo con el código ${code}.` };
    }

    await query(
      `INSERT INTO cohort_groups (
          code, title, institution, creator_name, created_at, is_active, description
       ) VALUES ($1, $2, $3, $4, $5, TRUE, $6)`,
      [code, title, institution, creatorName, Date.now(), description]
    );

    return { ok: true, code };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "No se pudo crear el grupo.";
    return { ok: false, error: message };
  }
}
