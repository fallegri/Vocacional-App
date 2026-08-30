// ===========================================================================
// Configuración de Auth.js v5 (next-auth@beta) con proveedor de Credentials.
//
// Estrategia de sesión: JWT (sin adaptador de base de datos). El secreto
// AUTH_SECRET firma el JWT; se lee en tiempo de petición para mantener la
// invariante de build (nada se evalúa durante `next build`).
//
// Flujo de autenticación:
//   1. El usuario envía email + contraseña mediante loginAction.
//   2. authorize() busca el usuario en Neon (lazy), verifica la contraseña con
//      bcrypt y exige que el correo esté verificado.
//   3. Si todo es correcto, se devuelve { id, email, role } y Auth.js crea el
//      JWT con esos campos.
//   4. El callback jwt() almacena role en el token; session() lo expone en
//      session.user.role.
//
// INVARIANTE DE BUILD: `next build` y `tsc --noEmit` deben pasar SIN ninguna
// variable de entorno. El proveedor de Credentials solo se registra cuando
// AUTH_SECRET está definido; de lo contrario la lista de proveedores queda
// vacía y la app reporta "auth no configurada" en runtime.
//
// Route handler: web/app/api/auth/[...nextauth]/route.ts reexporta { GET, POST }.
// ===========================================================================

import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

/**
 * true solo cuando AUTH_SECRET está definido y no es una cadena vacía.
 * Se lee en tiempo de llamada (nunca al cargar el módulo).
 */
export function isAuthConfigured(): boolean {
  return Boolean((process.env.AUTH_SECRET ?? "").trim());
}

export const { handlers, auth, signIn, signOut } = NextAuth(() => {
  const configured = isAuthConfigured();

  return {
    // El secreto se lee por petición; puede ser undefined durante el build.
    secret: process.env.AUTH_SECRET,
    session: { strategy: "jwt" },
    pages: {
      signIn: "/login",
    },
    // Solo registramos el proveedor cuando hay configuración completa.
    providers: configured
      ? [
          Credentials({
            name: "Credenciales",
            credentials: {
              email: { label: "Correo electrónico", type: "email" },
              password: { label: "Contraseña", type: "password" },
            },
            async authorize(credentials) {
              const email = ((credentials?.email as string) ?? "").trim().toLowerCase();
              const password = (credentials?.password as string) ?? "";

              if (!email || !password) return null;

              // Importaciones lazy: solo se ejecutan en tiempo de petición.
              const { findUserByEmail } = await import("@/lib/auth/users");
              const { verifyPassword } = await import("@/lib/auth/passwords");

              const user = await findUserByEmail(email);
              if (!user || !user.passwordHash) return null;

              const passwordOk = await verifyPassword(password, user.passwordHash);
              if (!passwordOk) return null;

              if (user.emailVerifiedAt === null) {
                // Cuenta no verificada: rechazar con error descriptivo.
                throw new Error("cuenta_no_verificada");
              }

              return {
                id: user.id,
                email: user.email,
                name: user.displayName,
                // El rol se pasa como campo extra y se captura en el callback jwt.
                role: user.role,
              };
            },
          }),
        ]
      : [],
    callbacks: {
      async jwt({ token, user }) {
        // En el primer inicio de sesión `user` está presente: guardamos el rol
        // en el token para futuras peticiones sin tocar la base de datos.
        if (user && "role" in user) {
          const role = (user as { role: string }).role as import("@/lib/riasec/types").UserRoleCode;
          token.role = role;
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
  };
});
