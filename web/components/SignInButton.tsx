// ===========================================================================
// Botón "Iniciar sesión con Google" reutilizable (server component).
//
// Se usa en las pantallas de "acceso restringido" del área de administración.
// Invoca la server action signInWithGoogle desde un <form action>, de modo que
// no requiere el paquete cliente de NextAuth ni secretos en tiempo de build.
// ===========================================================================

import { signInWithGoogle } from "@/lib/actions/auth";

export default function SignInButton({
  redirectTo = "/admin",
  label = "Iniciar sesión con Google",
}: {
  redirectTo?: string;
  label?: string;
}) {
  const action = signInWithGoogle.bind(null, redirectTo);
  return (
    <form action={action}>
      <button type="submit" className="btn">
        {label}
      </button>
    </form>
  );
}
