// ===========================================================================
// Tokens de verificación de correo electrónico.
//
// Flujo:
//   1. Al registrarse, se llama createVerificationToken(email) que inserta un
//      token con expiración en email_verification_tokens.
//   2. El enlace de verificación lleva el token como query param (?token=...).
//   3. Al hacer clic, se llama consumeVerificationToken(token) que:
//        - Verifica que el token exista, no esté consumido y no haya expirado.
//        - Marca consumed_at = ahora.
//        - Devuelve el correo asociado (o null si falla alguna validación).
//
// INVARIANTE DE BUILD: solo se leen secretos/DB en tiempo de petición.
// ===========================================================================

import { randomUUID } from "node:crypto";
import { query } from "@/lib/db";

/** Duración de validez del token de verificación (24 horas en milisegundos). */
const TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

/**
 * Genera un token de verificación único usando crypto.randomUUID.
 * El resultado es un UUID v4 (36 caracteres) sin guiones adicionales.
 */
export function generateVerificationToken(): string {
  return randomUUID();
}

/**
 * Inserta un nuevo token de verificación de correo en la base de datos.
 * Devuelve el token generado.
 *
 * @param email Correo electrónico del usuario a verificar.
 */
export async function createVerificationToken(email: string): Promise<string> {
  const token = generateVerificationToken();
  const now = Date.now();
  const expiresAt = now + TOKEN_TTL_MS;

  await query(
    `INSERT INTO email_verification_tokens
       (token, email, purpose, created_at, expires_at, consumed_at)
     VALUES ($1, $2, 'VERIFY_EMAIL', $3, $4, NULL)`,
    [token, email.trim().toLowerCase(), now, expiresAt]
  );

  return token;
}

/**
 * Consume un token de verificación de forma atómica:
 *  - Si no existe, está expirado o ya fue usado, devuelve null.
 *  - Si es válido, marca consumed_at = ahora y devuelve el correo asociado.
 *
 * La operación es una única sentencia UPDATE … WHERE … RETURNING para
 * eliminar la ventana de concurrencia que tendría un SELECT + UPDATE por
 * separado.
 */
export async function consumeVerificationToken(
  token: string
): Promise<string | null> {
  if (!token) return null;

  const now = Date.now();

  // Una sola sentencia atómica: selecciona y consume el token solo si no fue
  // consumido antes y no ha expirado. Devuelve el email si tuvo éxito.
  const rows = await query(
    `UPDATE email_verification_tokens
     SET consumed_at = $1
     WHERE token = $2
       AND consumed_at IS NULL
       AND expires_at > $3
     RETURNING email`,
    [now, token, now]
  );

  if (rows.length === 0) return null;

  return rows[0].email as string;
}
