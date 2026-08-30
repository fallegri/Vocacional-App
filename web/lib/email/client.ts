// ===========================================================================
// Cliente de correo electrónico usando el SDK oficial de Resend.
//
// INVARIANTE DE BUILD: RESEND_API_KEY y EMAIL_FROM se leen en tiempo de
// petición (lazy). Si no están definidas, el envío queda silenciado (skipped)
// con un log en español, lo que permite que `next build` pase sin secretos y
// que la app funcione en modo demo/desarrollo sin configuración de correo.
//
// Nada se ejecuta al importar el módulo.
// ===========================================================================

import { Resend } from "resend";
import type {
  ResultsEmailParams,
  VerificationEmailParams,
} from "@/lib/email/messages";
import {
  buildVerificationEmail,
  buildResultsEmail,
} from "@/lib/email/messages";

export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  /** Cuerpo en texto plano (opcional). */
  text?: string;
}

export interface EmailResult {
  sent: boolean;
  skipped?: boolean;
  error?: string;
}

/**
 * Devuelve true si tanto RESEND_API_KEY como EMAIL_FROM están definidos y no
 * están vacíos. No lanza; no lee nada al cargar el módulo.
 */
export function isEmailConfigured(): boolean {
  return (
    (process.env.RESEND_API_KEY ?? "").trim().length > 0 &&
    (process.env.EMAIL_FROM ?? "").trim().length > 0
  );
}

/**
 * Envía un correo electrónico usando el SDK de Resend.
 *
 * - Si RESEND_API_KEY o EMAIL_FROM no están definidos, registra un mensaje en
 *   español y devuelve { sent: false, skipped: true }. No lanza ningún error.
 * - Si el envío falla, registra el error en español y devuelve
 *   { sent: false, error: <mensaje> }. No lanza ningún error.
 * - Si el envío tiene éxito, devuelve { sent: true }.
 */
export async function sendEmail(payload: EmailPayload): Promise<EmailResult> {
  if (!isEmailConfigured()) {
    console.log(
      `[email] Correo no configurado (falta RESEND_API_KEY / EMAIL_FROM). Se omite el envío a: ${payload.to} | Asunto: ${payload.subject}`
    );
    return { sent: false, skipped: true };
  }

  const apiKey = process.env.RESEND_API_KEY!.trim();
  const from =
    (process.env.EMAIL_FROM ?? "").trim() ||
    "OrientApp <noreply@orientapp.local>";

  try {
    const resend = new Resend(apiKey);
    const result = await resend.emails.send({
      from,
      to: [payload.to],
      subject: payload.subject,
      html: payload.html,
      ...(payload.text ? { text: payload.text } : {}),
    });

    if (result.error) {
      const msg = result.error.message ?? JSON.stringify(result.error);
      console.error(`[email] Error al enviar a ${payload.to}: ${msg}`);
      return { sent: false, error: msg };
    }

    return { sent: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[email] Excepción al enviar correo a ${payload.to}: ${msg}`);
    return { sent: false, error: msg };
  }
}

/**
 * Envía el correo de verificación de cuenta al usuario recién registrado.
 *
 * @param email    Correo del destinatario.
 * @param token    Token de verificación a incluir en el enlace.
 * @param displayName Nombre visible del usuario (opcional).
 * @param appUrl   URL base de la aplicación (opcional; si no se pasa, se usa
 *                 NEXT_PUBLIC_APP_URL o se cae al localhost con advertencia).
 */
export async function sendVerificationEmail(
  email: string,
  token: string,
  displayName?: string,
  appUrl?: string
): Promise<EmailResult> {
  const configuredUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "").trim();
  const resolvedUrl = appUrl?.trim() || configuredUrl;

  let baseUrl: string;
  if (resolvedUrl) {
    baseUrl = resolvedUrl;
  } else {
    console.warn(
      "[email] Advertencia: NEXT_PUBLIC_APP_URL no está definida; el enlace de verificación puede ser incorrecto en producción."
    );
    baseUrl = "http://localhost:3000";
  }

  const verifyUrl = `${baseUrl}/verify?token=${encodeURIComponent(token)}`;

  const params: VerificationEmailParams = {
    displayName,
    verifyUrl,
  };

  const { subject, html, text } = buildVerificationEmail(params);

  return sendEmail({ to: email, subject, html, text });
}

/**
 * Envía el correo con los resultados del diagnóstico vocacional al estudiante.
 * Versión con dirección de correo del destinatario explícita.
 * Se llama de forma best-effort tras persistir la sesión: los errores se
 * registran pero no afectan la respuesta HTTP del servidor.
 */
export async function sendResultsEmailTo(
  to: string,
  params: ResultsEmailParams
): Promise<EmailResult> {
  const { subject, html, text } = buildResultsEmail(params);
  return sendEmail({ to, subject, html, text });
}
