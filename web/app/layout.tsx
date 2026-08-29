import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "OrientApp | Diagnóstico Vocacional RIASEC",
  description:
    "Plataforma de diagnóstico vocacional RIASEC (Holland) con orientación asistida por IA.",
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
            <Link href="/tutor">Tutor IA</Link>
            <Link href="/admin">Administración</Link>
          </nav>
        </header>
        {children}
      </body>
    </html>
  );
}
