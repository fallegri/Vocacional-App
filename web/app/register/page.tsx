// ===========================================================================
// Página de registro de nuevos usuarios.
//
// Muestra un formulario con nombre, correo y contraseña. Al enviarlo se llama
// a registerAction (server action). Si el registro es exitoso, indica al
// usuario que revise su correo para confirmar la cuenta.
//
// Cuando se navega con ?resend=1 (desde el aviso de cuenta no verificada en el
// inicio de sesión), el encabezado cambia a "Reenviar correo de verificación"
// para reflejar que se reenviará el enlace a una cuenta existente no verificada.
// ===========================================================================

"use client";

import { useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { registerAction } from "@/lib/actions/auth";
import Link from "next/link";
import { Suspense } from "react";

function RegisterForm() {
  const searchParams = useSearchParams();
  const isResend = searchParams.get("resend") === "1";

  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [result, setResult] = useState<{ ok: boolean; error?: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const res = await registerAction({ email, displayName, password });
      setResult(res);
    });
  }

  if (result?.ok) {
    return (
      <main style={{ maxWidth: 420, margin: "60px auto", padding: "0 16px" }}>
        <h1 style={{ fontSize: 22, marginBottom: 12 }}>
          {isResend ? "¡Correo reenviado!" : "¡Cuenta creada!"}
        </h1>
        <p style={{ lineHeight: 1.6 }}>
          Revisa tu correo <strong>{email}</strong> y haz clic en el enlace de
          confirmación para activar tu cuenta.
        </p>
        <p style={{ marginTop: 16 }}>
          <Link href="/login" className="btn">
            Ir al inicio de sesión
          </Link>
        </p>
      </main>
    );
  }

  return (
    <main style={{ maxWidth: 420, margin: "60px auto", padding: "0 16px" }}>
      <h1 style={{ fontSize: 22, marginBottom: isResend ? 8 : 20 }}>
        {isResend ? "Reenviar correo de verificación" : "Crear cuenta nueva"}
      </h1>
      {isResend && (
        <p style={{ fontSize: 14, color: "#6B7280", marginBottom: 16, lineHeight: 1.5 }}>
          Ingresa los datos de tu cuenta existente. Te enviaremos un nuevo enlace
          de verificación a tu correo.
        </p>
      )}

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <span style={{ fontWeight: 600, fontSize: 14 }}>Nombre completo</span>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            required
            autoComplete="name"
            placeholder="Tu nombre"
            className="input"
            style={{ padding: "8px 10px", fontSize: 14 }}
          />
        </label>

        <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <span style={{ fontWeight: 600, fontSize: 14 }}>Correo electrónico</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            placeholder="tu@correo.com"
            className="input"
            style={{ padding: "8px 10px", fontSize: 14 }}
          />
        </label>

        <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <span style={{ fontWeight: 600, fontSize: 14 }}>Contraseña</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="new-password"
            placeholder="Mínimo 8 caracteres"
            minLength={8}
            className="input"
            style={{ padding: "8px 10px", fontSize: 14 }}
          />
        </label>

        {result?.error && (
          <p role="alert" style={{ color: "var(--color-error, #dc2626)", fontSize: 14, margin: 0 }}>
            {result.error}
          </p>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="btn btn-primary"
          style={{ marginTop: 4 }}
        >
          {isPending
            ? isResend ? "Reenviando..." : "Registrando..."
            : isResend ? "Reenviar enlace de verificación" : "Crear cuenta"}
        </button>
      </form>

      <p style={{ marginTop: 20, fontSize: 14, textAlign: "center" }}>
        ¿Ya tienes cuenta?{" "}
        <Link href="/login" style={{ fontWeight: 600 }}>
          Inicia sesión
        </Link>
      </p>
    </main>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={null}>
      <RegisterForm />
    </Suspense>
  );
}
