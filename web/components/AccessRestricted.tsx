// ===========================================================================
// Estado de "acceso restringido" reutilizable.
//
// Por defecto describe una denegación del área de administración (visitante sin
// sesión de personal/staff). También admite mensajes a medida (por ejemplo, una
// denegación por propiedad estudiante-vs-estudiante en la página de resultados)
// mediante las props `title` y `message`, para no duplicar la interfaz. Ofrece
// un botón de inicio de sesión con Google cuando el visitante NO tiene sesión.
// Todo el texto está en español.
// ===========================================================================

import SignInButton from "@/components/SignInButton";

/** Mensajes por defecto para la denegación del área de administración. */
const DEFAULT_SIGNED_IN_MESSAGE =
  "Tu cuenta no tiene permisos de personal para acceder al área de administración. Solicita acceso a un administrador.";
const DEFAULT_ANON_MESSAGE =
  "Esta sección está reservada al personal autorizado. Inicia sesión con una cuenta de Google autorizada para continuar.";

export default function AccessRestricted({
  redirectTo = "/admin",
  signedIn = false,
  title = "Acceso restringido",
  message,
}: {
  redirectTo?: string;
  /** true si hay sesión pero sin permisos suficientes (propiedad o rol). */
  signedIn?: boolean;
  /** Título a medida (por defecto "Acceso restringido"). */
  title?: string;
  /**
   * Mensaje a medida. Si se omite, se usa el texto por defecto del área de
   * administración según `signedIn`. Permite reutilizar el componente para
   * denegaciones de propiedad (estudiante-vs-estudiante) sin duplicar la UI.
   */
  message?: string;
}) {
  const body =
    message ?? (signedIn ? DEFAULT_SIGNED_IN_MESSAGE : DEFAULT_ANON_MESSAGE);

  return (
    <main className="container">
      <div className="card center" style={{ maxWidth: 520, margin: "40px auto" }}>
        <h1 style={{ marginTop: 0 }}>{title}</h1>
        <p className="muted">{body}</p>
        {signedIn ? null : (
          <div className="center" style={{ marginTop: 16 }}>
            <SignInButton redirectTo={redirectTo} />
          </div>
        )}
      </div>
    </main>
  );
}
