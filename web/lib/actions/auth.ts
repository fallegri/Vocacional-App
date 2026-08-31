"use server";

// ===========================================================================
// Server actions para registro, inicio de sesión, verificación y cierre de
// sesión mediante email+contraseña (Auth.js v5 Credentials).
//
// Todas las funciones leen secretos y acceden a la base de datos en tiempo de
// petición (lazy), preservando la invariante de build (nada se evalúa durante
// `next build`). Todos los mensajes de cara al usuario están en español.
// ===========================================================================

import { signIn, signOut } from "@/auth";
import { AuthError } from "next-auth";

// ---------------------------------------------------------------------------
// registerAction
// ---------------------------------------------------------------------------

export interface RegisterResult {
  ok: boolean;
  resent?: boolean;
  error?: string;
}

/**
 * Registra un nuevo usuario con correo y contraseña.
 * - Valida el formato del correo y la longitud mínima de la contraseña.
 * - Hashea la contraseña con bcrypt.
 * - Inserta el usuario en app_users con rol STUDENT y lo marca como verificado
 *   de inmediato (sin paso de verificación por correo).
 *
 * Devuelve { ok: true } si el registro fue exitoso, o { ok: false, error } si
 * ya existe el correo o hubo un fallo de validación.
 */
export async function registerAction(params: {
  email: string;
  displayName: string;
  password: string;
}): Promise<RegisterResult> {
  const email = (params.email ?? "").trim().toLowerCase();
  const displayName = (params.displayName ?? "").trim();
  const password = params.password ?? "";

  // Validaciones básicas.
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: "Ingresa un correo electrónico válido." };
  }
  if (!displayName) {
    return { ok: false, error: "El nombre es obligatorio." };
  }
  if (password.length < 8) {
    return {
      ok: false,
      error: "La contraseña debe tener al menos 8 caracteres.",
    };
  }

  // Importaciones lazy para cumplir la invariante de build.
  const { hashPassword } = await import("@/lib/auth/passwords");
  const { createUser, findUserByEmail, markEmailVerified } = await import("@/lib/auth/users");

  const passwordHash = await hashPassword(password);

  const newUser = await createUser({ email, displayName, passwordHash, role: "STUDENT" });

  if (!newUser) {
    // ON CONFLICT DO NOTHING devolvió 0 filas: el correo ya está registrado.
    // Verificar si la cuenta existente está sin verificar.
    const existing = await findUserByEmail(email);
    if (existing && existing.emailVerifiedAt === null) {
      // La cuenta existe pero no está verificada. Marcarla como verificada
      // para que el usuario pueda iniciar sesión directamente.
      await markEmailVerified(email);
      return {
        ok: true,
        resent: true,
        error:
          "Ya existe una cuenta sin verificar con ese correo. Inicia sesión directamente.",
      };
    }
    return {
      ok: false,
      error:
        "Ya existe una cuenta verificada con ese correo. Inicia sesión.",
    };
  }

  // Marcar la cuenta como verificada de inmediato (sin paso de correo).
  await markEmailVerified(email);

  return { ok: true };
}

// ---------------------------------------------------------------------------
// loginAction
// ---------------------------------------------------------------------------

export interface LoginResult {
  ok: boolean;
  error?: string;
  unverified?: boolean;
}

/**
 * Inicia sesión con correo y contraseña usando Auth.js Credentials.
 * Mapea los errores de Auth.js a mensajes en español.
 *
 * @param redirectTo URL a la que redirigir tras un inicio de sesión exitoso.
 */
export async function loginAction(params: {
  email: string;
  password: string;
  redirectTo?: string;
}): Promise<LoginResult> {
  const email = (params.email ?? "").trim().toLowerCase();
  const password = params.password ?? "";
  const redirectTo = params.redirectTo ?? "/admin";

  if (!email || !password) {
    return {
      ok: false,
      error: "Ingresa tu correo electrónico y contraseña.",
    };
  }

  try {
    await signIn("credentials", { email, password, redirectTo });
    return { ok: true };
  } catch (err) {
    if (err instanceof AuthError) {
      const cause = (err as { cause?: { err?: { message?: string } } }).cause?.err?.message;
      if (cause === "cuenta_no_verificada") {
        return {
          ok: false,
          unverified: true,
          error:
            "Tu cuenta aún no ha sido verificada. Revisa tu correo y haz clic en el enlace de confirmación.",
        };
      }
      return {
        ok: false,
        error: "Correo o contraseña incorrectos.",
      };
    }
    // signIn lanza una redirección interna de Next.js (NEXT_REDIRECT) que
    // técnicamente es una instancia de Error pero NO de AuthError. Debemos
    // re-lanzarla para que Next.js la procese correctamente.
    throw err;
  }
}

// ---------------------------------------------------------------------------
// verifyEmailAction
// ---------------------------------------------------------------------------

export interface VerifyEmailResult {
  ok: boolean;
  error?: string;
}

/**
 * Consume un token de verificación de correo y activa la cuenta del usuario.
 * Devuelve { ok: true } si el token es válido, o { ok: false, error } si expiró
 * o ya fue usado.
 */
export async function verifyEmailAction(
  token: string
): Promise<VerifyEmailResult> {
  if (!token) {
    return { ok: false, error: "El enlace de verificación no es válido." };
  }

  const { consumeVerificationToken } = await import("@/lib/auth/tokens");
  const { markEmailVerified } = await import("@/lib/auth/users");

  const email = await consumeVerificationToken(token);

  if (!email) {
    return {
      ok: false,
      error:
        "El enlace de verificación es inválido, ya fue utilizado o ha expirado. Regístrate nuevamente.",
    };
  }

  await markEmailVerified(email);

  return { ok: true };
}

// ---------------------------------------------------------------------------
// logoutAction
// ---------------------------------------------------------------------------

/**
 * Cierra la sesión actual y redirige al inicio.
 */
export async function logoutAction(): Promise<void> {
  await signOut({ redirectTo: "/" });
}
