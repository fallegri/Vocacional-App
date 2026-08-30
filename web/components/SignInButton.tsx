// ===========================================================================
// Botón "Iniciar sesión" reutilizable que redirige a la página de login.
//
// Se usa en las pantallas de "acceso restringido" del área de administración.
// Es un componente de servidor que genera un enlace a /login.
// ===========================================================================

import Link from "next/link";

export default function SignInButton({
  redirectTo = "/admin",
  label = "Iniciar sesión",
}: {
  redirectTo?: string;
  label?: string;
}) {
  const href = `/login?callbackUrl=${encodeURIComponent(redirectTo)}`;
  return (
    <Link href={href} className="btn">
      {label}
    </Link>
  );
}
