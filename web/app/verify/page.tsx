// ===========================================================================
// Página de verificación de correo electrónico.
//
// Lee el token del query param ?token= y llama a verifyEmailAction.
// Muestra el resultado (éxito o error) con indicaciones en español.
// ===========================================================================

import { verifyEmailAction } from "@/lib/actions/auth";
import Link from "next/link";

interface VerifyPageProps {
  searchParams: Promise<{ token?: string }>;
}

export default async function VerifyPage({ searchParams }: VerifyPageProps) {
  const params = await searchParams;
  const token = params.token ?? "";

  if (!token) {
    return (
      <main style={{ maxWidth: 480, margin: "60px auto", padding: "0 16px" }}>
        <h1 style={{ fontSize: 22, marginBottom: 12 }}>Enlace no válido</h1>
        <p>
          El enlace de verificación no contiene un token. Por favor, usa el
          enlace que recibiste en tu correo.
        </p>
        <p style={{ marginTop: 16 }}>
          <Link href="/register" className="btn">
            Volver al registro
          </Link>
        </p>
      </main>
    );
  }

  const result = await verifyEmailAction(token);

  if (result.ok) {
    return (
      <main style={{ maxWidth: 480, margin: "60px auto", padding: "0 16px" }}>
        <h1 style={{ fontSize: 22, marginBottom: 12 }}>
          ✅ Cuenta verificada
        </h1>
        <p style={{ lineHeight: 1.6 }}>
          Tu cuenta ha sido activada correctamente. Ya puedes iniciar sesión.
        </p>
        <p style={{ marginTop: 16 }}>
          <Link href="/login" className="btn btn-primary">
            Iniciar sesión
          </Link>
        </p>
      </main>
    );
  }

  return (
    <main style={{ maxWidth: 480, margin: "60px auto", padding: "0 16px" }}>
      <h1 style={{ fontSize: 22, marginBottom: 12 }}>
        ❌ Error de verificación
      </h1>
      <p style={{ lineHeight: 1.6 }}>{result.error}</p>
      <p style={{ marginTop: 16 }}>
        <Link href="/register" className="btn">
          Registrarse nuevamente
        </Link>
      </p>
    </main>
  );
}
