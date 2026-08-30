// ===========================================================================
// Controles de autenticación para la barra superior (server component).
//
// Muestra:
//  - Cuando la auth NO está configurada: una nota discreta
//    "Autenticación no configurada".
//  - Cuando está configurada y hay sesión: el correo del usuario, una insignia
//    con su rol y un botón "Cerrar sesión".
//  - Cuando está configurada y NO hay sesión: botones "Registrarse" y
//    "Iniciar sesión".
//
// No lee secretos al cargar el módulo; todo se resuelve en tiempo de petición
// mediante los helpers de sesión, por lo que `next build` sin variables de
// entorno sigue funcionando.
// ===========================================================================

import Link from "next/link";
import { isAuthConfigured } from "@/auth";
import { getCurrentUser } from "@/lib/auth/session";
import { logoutAction } from "@/lib/actions/auth";
import { USER_ROLES } from "@/lib/riasec/types";

export default async function AuthControls() {
  if (!isAuthConfigured()) {
    return (
      <span
        className="muted"
        style={{ fontSize: 12 }}
        title="Define AUTH_SECRET para habilitar el inicio de sesión."
      >
        Autenticación no configurada
      </span>
    );
  }

  const user = await getCurrentUser();

  if (!user) {
    return (
      <div className="row" style={{ gap: 8, alignItems: "center" }}>
        <Link href="/register" className="btn btn-secondary" style={{ fontSize: 13 }}>
          Registrarse
        </Link>
        <Link href="/login" className="btn btn-primary" style={{ fontSize: 13 }}>
          Iniciar sesión
        </Link>
      </div>
    );
  }

  const role = USER_ROLES[user.role];

  return (
    <div className="row" style={{ gap: 10, alignItems: "center" }}>
      <span style={{ textAlign: "right", lineHeight: 1.2 }}>
        <span style={{ display: "block", fontSize: 13, fontWeight: 600 }}>
          {user.email}
        </span>
        <span className="badge" style={{ fontSize: 11 }}>
          {role.badgeIcon} {role.title}
        </span>
      </span>
      <form action={logoutAction}>
        <button type="submit" className="btn btn-ghost">
          Cerrar sesión
        </button>
      </form>
    </div>
  );
}
