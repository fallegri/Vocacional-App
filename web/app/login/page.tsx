// ===========================================================================
// Página de inicio de sesión con correo y contraseña.
//
// Invoca loginAction (server action). Muestra errores en español.
// ===========================================================================

"use client";

import { useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { loginAction } from "@/lib/actions/auth";
import Link from "next/link";
import { Suspense } from "react";

function LoginForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/admin";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [result, setResult] = useState<{
    ok: boolean;
    error?: string;
  } | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const res = await loginAction({ email, password, redirectTo: callbackUrl });
      setResult(res);
    });
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
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
          autoComplete="current-password"
          placeholder="Tu contraseña"
          className="input"
          style={{ padding: "8px 10px", fontSize: 14 }}
        />
      </label>

      {result?.error && (
        <div
          role="alert"
          style={{
            background: "#fee2e2",
            border: "1px solid #dc2626",
            borderRadius: 6,
            padding: "10px 12px",
            fontSize: 14,
          }}
        >
          {result.error}
        </div>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="btn btn-primary"
        style={{ marginTop: 4 }}
      >
        {isPending ? "Iniciando sesión..." : "Iniciar sesión"}
      </button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <main style={{ maxWidth: 420, margin: "60px auto", padding: "0 16px" }}>
      <h1 style={{ fontSize: 22, marginBottom: 20 }}>Iniciar sesión</h1>

      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>

      <p style={{ marginTop: 20, fontSize: 14, textAlign: "center" }}>
        ¿No tienes cuenta?{" "}
        <Link href="/register" style={{ fontWeight: 600 }}>
          Regístrate
        </Link>
      </p>
    </main>
  );
}
