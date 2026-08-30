// ===========================================================================
// Página de registro de nuevos usuarios.
//
// Muestra un formulario con nombre, correo y contraseña. Al enviarlo se llama
// a registerAction (server action). Si el registro es exitoso, indica al
// usuario que revise su correo para confirmar la cuenta.
// ===========================================================================

"use client";

import { useState, useTransition } from "react";
import { registerAction } from "@/lib/actions/auth";
import Link from "next/link";

export default function RegisterPage() {
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
        <h1 style={{ fontSize: 22, marginBottom: 12 }}>¡Cuenta creada!</h1>
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
      <h1 style={{ fontSize: 22, marginBottom: 20 }}>Crear cuenta</h1>

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
          {isPending ? "Registrando..." : "Crear cuenta"}
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
