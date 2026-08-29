import { NextResponse } from "next/server";
import { updateSessionReview } from "@/lib/sessions";
import { REVIEW_STATUS, type ReviewStatusCode } from "@/lib/riasec/types";
import { authorizeStaffRequest } from "@/lib/auth/staff";

// Fuerza el renderizado dinámico: nunca se ejecuta durante el build.
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface ReviewBody {
  reviewerNotes?: string | null;
  reviewStatus?: string | null;
}

const VALID_STATUSES = Object.keys(REVIEW_STATUS) as ReviewStatusCode[];

/**
 * Guarda el dictamen del revisor (notas + estado de revisión) sobre una sesión.
 * PATCH /api/sessions/{id}/review
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // Guardia de personal: el dictamen del revisor es una operación de staff.
  const auth = authorizeStaffRequest(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json(
      { error: "Falta el identificador de la sesión." },
      { status: 400 }
    );
  }

  let body: ReviewBody;
  try {
    body = (await request.json()) as ReviewBody;
  } catch {
    return NextResponse.json(
      { error: "Cuerpo de la solicitud inválido (JSON esperado)." },
      { status: 400 }
    );
  }

  const reviewerNotes = (body.reviewerNotes ?? "").toString().trim();
  const reviewStatus = (body.reviewStatus ?? "PENDING").toString().trim();

  if (!VALID_STATUSES.includes(reviewStatus as ReviewStatusCode)) {
    return NextResponse.json(
      {
        error: `Estado de revisión inválido. Valores permitidos: ${VALID_STATUSES.join(", ")}.`,
      },
      { status: 400 }
    );
  }

  try {
    const affected = await updateSessionReview(id, reviewerNotes, reviewStatus);
    if (affected === 0) {
      return NextResponse.json(
        { error: "No se encontró la sesión indicada." },
        { status: 404 }
      );
    }
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Error al guardar el dictamen.";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, reviewStatus, reviewerNotes });
}
