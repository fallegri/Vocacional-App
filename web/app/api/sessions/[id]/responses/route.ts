import { NextResponse } from "next/server";
import { loadSessionResponses } from "@/lib/sessions";
import { authorizeStaffRequest } from "@/lib/auth/staff";

// Fuerza el renderizado dinámico: nunca se ejecuta durante el build.
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Devuelve las respuestas individuales de una sesión de evaluación.
 * GET /api/sessions/{id}/responses
 *
 * Solo accesible para personal autorizado (REPORT_REVIEWER, SUPER_ADMIN, etc.).
 *
 * Nota sobre scope: todos los roles de personal tienen acceso de lectura a
 * cualquier sesión, de forma coherente con el comportamiento de la ruta
 * PATCH /api/sessions/{id}/review. Si en el futuro se necesitan restricciones
 * por cohorte, se añadirá aquí una comprobación de membresía.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authorizeStaffRequest(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: 403 });
  }

  const { id } = await params;

  try {
    const responses = await loadSessionResponses(id);
    return NextResponse.json({ responses });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Error al cargar las respuestas.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
