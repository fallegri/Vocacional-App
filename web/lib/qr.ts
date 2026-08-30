// ===========================================================================
// Utilidades para construir la URL del test vocacional de cada grupo (cohorte)
// y su código QR. La URL base es CONFIGURABLE: se prefiere la variable de
// entorno pública NEXT_PUBLIC_APP_URL (útil en el dominio de Vercel) y, si no
// está definida, se cae al origin de la petición/navegador. Nunca se codifica
// "localhost" de forma fija.
// ===========================================================================

/** Normaliza un código de cohorte: recorta espacios y lo pasa a mayúsculas. */
export function normalizeCohortCode(code: string): string {
  return (code ?? "").trim().toUpperCase();
}

/**
 * Devuelve la URL base configurada, sin barra final.
 * Prioridad:
 *   1. `explicitOrigin` (por ejemplo el origin de la petición en el servidor
 *      o `window.location.origin` en el cliente).
 *   2. `process.env.NEXT_PUBLIC_APP_URL` (dominio de despliegue en Vercel).
 *   3. Cadena vacía (enlaces relativos) como último recurso.
 */
export function resolveBaseUrl(explicitOrigin?: string | null): string {
  const envUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
  const chosen = (explicitOrigin && explicitOrigin.trim()) || envUrl || "";
  return chosen.replace(/\/+$/, "");
}

/**
 * Construye la URL del formulario del test vocacional asignado a un grupo.
 * Se prefiere la ruta corta `/g/{CODE}` (mapeada por FEAT-002 a la evaluación
 * con la cohorte aplicada). Si no hay base absoluta disponible, devuelve una
 * ruta relativa igualmente válida dentro de la app.
 */
export function buildCohortTestUrl(
  code: string,
  explicitOrigin?: string | null
): string {
  const normalized = normalizeCohortCode(code);
  const base = resolveBaseUrl(explicitOrigin);
  const path = `/g/${encodeURIComponent(normalized)}`;
  return base ? `${base}${path}` : path;
}

/**
 * Construye la URL de destino de la ruta corta /g/{code}: la evaluación con la
 * cohorte aplicada y, si el grupo tiene un método asignado, con ese método.
 * Cuando `methodId` es nulo o "RIASEC" (el método por defecto) se omite el
 * parámetro `method` para mantener las URLs de RIASEC idénticas a las previas.
 * Función pura (sin E/S) para poder probarla sin base de datos.
 */
export function buildAssessmentRedirectPath(
  cohortCode: string,
  methodId?: string | null
): string {
  const normalized = normalizeCohortCode(cohortCode);
  const params = new URLSearchParams();
  params.set("cohort", normalized);
  const method = (methodId ?? "").trim().toUpperCase();
  if (method && method !== "RIASEC") {
    params.set("method", method);
  }
  return `/assessment?${params.toString()}`;
}
