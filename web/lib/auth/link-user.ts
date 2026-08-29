// ===========================================================================
// Vinculación/creación best-effort del usuario en app_users al iniciar sesión.
//
// En el primer inicio de sesión con Google se busca la fila por correo
// (case-insensitive). Si no existe, se inserta con el rol resuelto, el nombre
// del perfil de Google y auth_provider = 'GOOGLE'.
//
// Reglas de seguridad/robustez:
//  - SOLO se ejecuta cuando DATABASE_URL está definida (se lee en tiempo de
//    petición; nunca se crea el Pool al cargar el módulo).
//  - Todo va envuelto en try/catch: un fallo de base de datos NUNCA debe
//    bloquear el inicio de sesión.
// ===========================================================================

import { query } from "@/lib/db";
import { resolveRoleForEmail } from "@/lib/auth/roles";

/**
 * Crea o vincula la fila de app_users para el correo autenticado. Best-effort:
 * si no hay DATABASE_URL o la consulta falla, no lanza y no bloquea el login.
 */
export async function linkOrCreateUser(
  email: string | null | undefined,
  displayName?: string | null
): Promise<void> {
  const normalized = (email ?? "").trim().toLowerCase();
  if (!normalized) return;

  // Sin base de datos configurada no hay nada que persistir (modo demo/build).
  if (!process.env.DATABASE_URL) return;

  try {
    const existing = await query(
      "SELECT id FROM app_users WHERE LOWER(email) = $1 LIMIT 1",
      [normalized]
    );
    if (existing.length > 0) return;

    const role = resolveRoleForEmail(normalized);
    const name = (displayName ?? "").trim() || normalized;
    // Identificador estable derivado del correo (Google no siempre da un id
    // que quepa en el esquema TEXT; el correo es único en la práctica).
    const id = `google:${normalized}`;

    await query(
      `INSERT INTO app_users (id, email, display_name, role, auth_provider)
       VALUES ($1, $2, $3, $4, 'GOOGLE')
       ON CONFLICT (id) DO NOTHING`,
      [id, normalized, name, role]
    );
  } catch {
    // Best-effort: cualquier fallo de DB se ignora para no bloquear el login.
  }
}
