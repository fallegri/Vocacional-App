import { redirect } from "next/navigation";

/**
 * Ruta corta para grupos/cohortes: /g/{code}
 * Redirige a la evaluación con el código de cohorte aplicado en la URL,
 * de modo que el enlace del código QR lleva directo al test asignado al grupo.
 */
export default async function CohortShortcutPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const cohort = decodeURIComponent(code).trim().toUpperCase();
  redirect(`/assessment?cohort=${encodeURIComponent(cohort)}`);
}
