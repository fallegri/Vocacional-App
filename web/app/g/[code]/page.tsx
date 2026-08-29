import { redirect } from "next/navigation";
import { listCohorts } from "@/lib/actions/cohorts";
import { buildAssessmentRedirectPath } from "@/lib/qr";

/**
 * Ruta corta para grupos/cohortes: /g/{code}
 * Resuelve el método vocacional asignado al grupo (consultando las cohortes) y
 * redirige a la evaluación con el código de cohorte y, si aplica, el método
 * aplicados en la URL. Así el enlace del código QR lleva directo al test
 * asignado al grupo. Si la cohorte es desconocida, se omite el método y el
 * usuario elige (RIASEC por defecto).
 */
export default async function CohortShortcutPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const cohort = decodeURIComponent(code).trim().toUpperCase();

  let methodId: string | null = null;
  try {
    const cohorts = await listCohorts();
    const match = cohorts.find((c) => c.code === cohort);
    methodId = match?.methodId ?? null;
  } catch {
    methodId = null;
  }

  redirect(buildAssessmentRedirectPath(cohort, methodId));
}
