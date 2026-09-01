// ===========================================================================
// Página de registro de nuevos usuarios.
//
// Server Component que renderiza RegisterForm (componente cliente en archivo
// separado). Al tener RegisterForm en su propio archivo con "use client" en el
// nivel superior, Next.js resuelve correctamente el Server Action registerAction
// en producción (Vercel), evitando el 404 que ocurre cuando el server action se
// importa en un componente cliente anidado dentro de un Server Component.
//
// El registro crea la cuenta directamente verificada. No se envia ningun
// correo de confirmacion (Resend fue eliminado).
// ===========================================================================

import { Suspense } from "react";
import RegisterForm from "./RegisterForm";

export default function RegisterPage() {
  return (
    <Suspense fallback={null}>
      <RegisterForm />
    </Suspense>
  );
}
