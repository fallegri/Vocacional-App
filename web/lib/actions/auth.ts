"use server";

// ===========================================================================
// Server actions para iniciar y cerrar sesión con Google (Auth.js v5).
//
// Se ejecutan solo en el servidor y leen los secretos en tiempo de petición,
// preservando la invariante de build (nada se evalúa durante `next build`).
// Los componentes de UI (client) invocan estas acciones desde un <form action>
// para no necesitar el paquete cliente de NextAuth.
// ===========================================================================

import { signIn, signOut } from "@/auth";

/** Inicia el flujo de OAuth con Google y vuelve a la página indicada. */
export async function signInWithGoogle(redirectTo: string = "/admin"): Promise<void> {
  await signIn("google", { redirectTo });
}

/** Cierra la sesión actual y vuelve al inicio. */
export async function signOutAction(): Promise<void> {
  await signOut({ redirectTo: "/" });
}
