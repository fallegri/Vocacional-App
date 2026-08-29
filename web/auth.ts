// ===========================================================================
// Configuración de Auth.js v5 (next-auth@beta) con el proveedor de Google.
//
// Convención elegida: `web/auth.ts` en la raíz del proyecto web (patrón oficial
// de NextAuth v5 para App Router). El route handler en
// web/app/api/auth/[...nextauth]/route.ts reexporta { GET, POST } desde aquí.
//
// INVARIANTE DE BUILD: `next build` y `tsc --noEmit` deben funcionar SIN ninguna
// variable de entorno. Por eso:
//   - Los secretos (GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET / AUTH_SECRET) se
//     leen en tiempo de PETICIÓN, no al cargar el módulo. Se logra pasando a
//     NextAuth una FUNCIÓN de configuración (config lazy), que Auth.js invoca
//     por petición.
//   - El proveedor de Google solo se añade cuando la configuración está
//     completa (isAuthConfigured()); si faltan secretos, la lista de proveedores
//     queda vacía y la app reporta un estado "auth no configurado" en runtime en
//     lugar de romper el build.
//
// Estrategia de sesión: 'jwt' (sin adaptador de base de datos), para que ni el
// build ni el runtime dependan de DATABASE_URL. El rol se resuelve en el
// callback `jwt` (primer inicio de sesión) y se expone en `session.user.role`.
// ===========================================================================

import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { resolveRoleForEmail } from "@/lib/auth/roles";
import { linkOrCreateUser } from "@/lib/auth/link-user";

/**
 * true solo cuando GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET y AUTH_SECRET están
 * todas definidas. Se lee en tiempo de llamada (nunca al cargar el módulo).
 */
export function isAuthConfigured(): boolean {
  return Boolean(
    (process.env.GOOGLE_CLIENT_ID ?? "").trim() &&
      (process.env.GOOGLE_CLIENT_SECRET ?? "").trim() &&
      (process.env.AUTH_SECRET ?? "").trim()
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth(() => {
  const configured = isAuthConfigured();

  return {
    // El secreto se lee por petición; puede ser undefined durante el build.
    secret: process.env.AUTH_SECRET,
    session: { strategy: "jwt" },
    // Solo registramos el proveedor de Google cuando hay configuración completa.
    providers: configured
      ? [
          Google({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : [],
    callbacks: {
      async jwt({ token, user }) {
        // En el primer inicio de sesión `user` está presente: resolvemos el rol
        // a partir del correo y lo guardamos en el token para futuras peticiones.
        if (user?.email) {
          token.role = resolveRoleForEmail(user.email);
        } else if (!token.role && typeof token.email === "string") {
          token.role = resolveRoleForEmail(token.email);
        }
        return token;
      },
      async session({ session, token }) {
        if (session.user) {
          session.user.role = token.role ?? "STUDENT";
          if (typeof token.email === "string") {
            session.user.email = token.email;
          }
        }
        return session;
      },
    },
    events: {
      // Al iniciar sesión, vincula/crea la fila en app_users (best-effort, solo
      // si DATABASE_URL está definida). Un fallo aquí no bloquea el login.
      async signIn({ user }) {
        await linkOrCreateUser(user?.email, user?.name);
      },
    },
  };
});
