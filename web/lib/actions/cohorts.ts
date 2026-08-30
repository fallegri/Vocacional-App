"use server";

import { query } from "@/lib/db";
import { DEFAULT_COHORTS } from "@/data/seed";
import { authorizeStaffWithRoles } from "@/lib/auth/staff";
import { normalizeMethodId } from "@/lib/methods/registry";
import type { CohortGroup } from "@/lib/riasec/types";

export interface CreateCohortResult {
  ok: boolean;
  code?: string;
  error?: string;
}

/**
 * Lista los grupos/cohortes. Combina las cohortes almacenadas en Neon con las
 * cohortes semilla (DEFAULT_COHORTS), evitando duplicados por código. Si no hay
 * base de datos activa devuelve solo las cohortes semilla, de forma que la app
 * siga funcionando (y el build pase) sin DATABASE_URL.
 */
export async function listCohorts(): Promise<CohortGroup[]> {
  const seed: CohortGroup[] = DEFAULT_COHORTS.map((c) => ({ ...c }));

  let dbCohorts: CohortGroup[] = [];
  try {
    const rows = await query(
      `SELECT code, title, institution, creator_name, is_active, description, method_id
         FROM cohort_groups
        ORDER BY created_at DESC`
    );
    dbCohorts = rows.map((row) => ({
      code: String(row.code),
      title: String(row.title ?? ""),
      institution: String(row.institution ?? ""),
      creatorName: String(row.creator_name ?? ""),
      isActive: row.is_active == null ? true : Boolean(row.is_active),
      description: String(row.description ?? ""),
      methodId: normalizeMethodId(row.method_id),
    }));
  } catch {
    // Sin DB activa: solo devolvemos las cohortes semilla.
    dbCohorts = [];
  }

  const byCode = new Map<string, CohortGroup>();
  for (const c of seed) byCode.set(c.code, c);
  for (const c of dbCohorts) byCode.set(c.code, c); // la DB tiene prioridad
  return Array.from(byCode.values());
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
  /** Método vocacional asignado al grupo (RIASEC por defecto). */
  methodId?: string | null;
  /** Token de personal heredado; solo se usa como fallback si no hay OAuth. */
  staffToken?: string | null;
}): Promise<CreateCohortResult> {
  // Autorización por rol: crear una cohorte requiere SUPER_ADMIN o TEST_ADMIN.
  // Con OAuth configurado la sesión decide; sin OAuth cae al fallback heredado.
  const auth = await authorizeStaffWithRoles(
    ["SUPER_ADMIN", "TEST_ADMIN"],
    input.staffToken
  );
  if (!auth.ok) {
    return { ok: false, error: auth.error };
  }

  const code = (input.code ?? "").trim().toUpperCase();
  const title = (input.title ?? "").trim();
  const institution = (input.institution ?? "").trim();
  const creatorName = (input.creatorName ?? "").trim() || "Personal OrientApp";
  const description = (input.description ?? "").trim();
  const methodId = normalizeMethodId(input.methodId);

  // Si el código está vacío, se deriva automáticamente desde el título.
  // Formato: hasta 20 chars alfanuméricos+guión bajo en mayúsculas + "-" + 4 chars aleatorios.
  const resolvedCode: string = code
    ? code
    : (() => {
        const base = title
          .toUpperCase()
          .replace(/[\s-]+/g, "_")
          .replace(/[^A-Z0-9_]/g, "")
          .slice(0, 16);
        const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
        return base ? `${base}_${suffix}` : suffix;
      })();

  if (!resolvedCode || !title) {
    return { ok: false, error: "El nombre del grupo es obligatorio." };
  }

  try {
    const existing = await query(
      "SELECT code FROM cohort_groups WHERE code = $1 LIMIT 1",
      [resolvedCode]
    );
    if (existing.length > 0) {
      return { ok: false, error: `Ya existe un grupo con el código ${resolvedCode}.` };
    }

    await query(
      `INSERT INTO cohort_groups (
          code, title, institution, creator_name, created_at, is_active, description, method_id
       ) VALUES ($1, $2, $3, $4, $5, TRUE, $6, $7)`,
      [resolvedCode, title, institution, creatorName, Date.now(), description, methodId]
    );

    return { ok: true, code: resolvedCode };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "No se pudo crear el grupo.";
    return { ok: false, error: message };
  }
}
