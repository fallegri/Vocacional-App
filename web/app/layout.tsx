import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import AuthControls from "@/components/AuthControls";
import "./globals.css";

export const metadata: Metadata = {
  title: "OrientApp | Diagnóstico Vocacional RIASEC",
  description:
    "Plataforma de diagnóstico vocacional que calcula resultados de forma determinista según el método aplicado (RIASEC, CHASIDE, TIPOV, CIP-R, Magdalena Contreras).",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <body>
        <header className="topbar">
          <Link href="/" className="brand">
            Orient<span>App</span>
          </Link>
          <nav>
            <Link href="/assessment">Evaluación</Link>
            <Link href="/careers">Carreras</Link>
            <Link href="/admin">Administración</Link>
          </nav>
          <AuthControls />
        </header>
        {children}
      </body>
    </html>
  );
}
