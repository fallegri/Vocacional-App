// ===========================================================================
// Utilidades de hashing y verificación de contraseñas con bcryptjs.
//
// Se usa bcryptjs (implementación pura en JavaScript) por ser compatible con
// entornos serverless (Vercel Edge / Node.js sin binarios nativos).
//
// INVARIANTE DE BUILD: este módulo no lee variables de entorno ni accede a la
// base de datos al cargarse. Es puro y sin efectos secundarios.
// ===========================================================================

import bcrypt from "bcryptjs";

/** Costo de bcrypt (factor de trabajo). 10 es el mínimo razonable para producción. */
const BCRYPT_COST = 10;

/**
 * Genera el hash bcrypt de una contraseña en texto plano.
 * Nunca almacenes la contraseña original: guarda solo el hash.
 */
export async function hashPassword(plaintext: string): Promise<string> {
  return bcrypt.hash(plaintext, BCRYPT_COST);
}

/**
 * Verifica que una contraseña en texto plano coincida con un hash bcrypt.
 * Devuelve true si coincide, false en caso contrario.
 */
export async function verifyPassword(
  plaintext: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(plaintext, hash);
}
