// ===========================================================================
// Estado de "acceso restringido" para el área de administración.
//
// Se muestra cuando la autenticación está configurada pero el visitante no
// tiene una sesión de personal (staff) válida. Ofrece un botón de inicio de
// sesión con Google. Todo el texto está en español.
// ===========================================================================

import SignInButton from "@/components/SignInButton";

export default function AccessRestricted({
  redirectTo = "/admin",
  signedIn = false,
}: {
  redirectTo?: string;
  /** true si hay sesión pero sin rol de personal (permisos insuficientes). */
  signedIn?: boolean;
}) {
  return (
    <main className="container">
      <div className="card center" style={{ maxWidth: 520, margin: "40px auto" }}>
        <h1 style={{ marginTop: 0 }}>Acceso restringido</h1>
        <p className="muted">
          {signedIn
            ? "Tu cuenta no tiene permisos de personal para acceder al área de administración. Solicita acceso a un administrador."
            : "Esta sección está reservada al personal autorizado. Inicia sesión con una cuenta de Google autorizada para continuar."}
        </p>
        {signedIn ? null : (
          <div className="center" style={{ marginTop: 16 }}>
            <SignInButton redirectTo={redirectTo} />
          </div>
        )}
      </div>
    </main>
  );
}
