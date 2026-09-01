// ===========================================================================
// Página de verificación de correo electrónico — redirige a /login.
//
// La verificación por correo fue eliminada. Todas las cuentas se crean
// verificadas de inmediato. Esta ruta se mantiene para URLs antiguas o
// marcadores guardados, pero redirige directamente al inicio de sesión.
// ===========================================================================

import { redirect } from "next/navigation";

export default async function VerifyPage() {
  redirect("/login");
}
