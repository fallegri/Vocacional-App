// ===========================================================================
// Controles de autenticación para la barra superior (server component).
//
// Muestra:
//  - Cuando la auth NO está configurada: una nota discreta
//    "Autenticación no configurada".
//  - Cuando está configurada y hay sesión: el correo del usuario, una insignia
//    con su rol y un botón "Cerrar sesión".
//  - Cuando está configurada y NO hay sesión: un botón
//    "Iniciar sesión con Google".
//
// No lee secretos al cargar el módulo; todo se resuelve en tiempo de petición
// mediante los helpers de sesión de FEAT-001, por lo que `next build` sin
// variables de entorno sigue funcionando.
// ===========================================================================

import { isAuthConfigured } from "@/auth";
import { getCurrentUser } from "@/lib/auth/session";
import { signInWithGoogle, signOutAction } from "@/lib/actions/auth";
import { USER_ROLES } from "@/lib/riasec/types";

export default async function AuthControls() {
  if (!isAuthConfigured()) {
    return (
      <span
        className="muted"
        style={{ fontSize: 12 }}
        title="Define GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET y AUTH_SECRET para habilitar el inicio de sesión."
      >
        Autenticación no configurada
      </span>
    );
  }

  const user = await getCurrentUser();

  if (!user) {
    const signIn = signInWithGoogle.bind(null, "/admin");
    return (
      <form action={signIn}>
        <button type="submit" className="btn btn-secondary">
          Iniciar sesión con Google
        </button>
      </form>
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
      <form action={signOutAction}>
        <button type="submit" className="btn btn-ghost">
          Cerrar sesión
        </button>
      </form>
    </div>
  );
}
