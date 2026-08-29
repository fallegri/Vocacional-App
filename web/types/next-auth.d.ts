// ===========================================================================
// Augmentación de tipos de Auth.js (NextAuth v5) para exponer el rol de la app.
// Añade `role` (UserRoleCode) a la sesión y al token JWT.
// ===========================================================================

import type { UserRoleCode } from "@/lib/riasec/types";
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      role: UserRoleCode;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: UserRoleCode;
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    role?: UserRoleCode;
  }
}
