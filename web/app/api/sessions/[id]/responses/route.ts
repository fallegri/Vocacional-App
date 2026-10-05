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
  const responses = await loadSessionResponses(id);
  return NextResponse.json({ responses });
}
