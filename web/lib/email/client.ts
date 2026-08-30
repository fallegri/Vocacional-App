// ===========================================================================
// Cliente de correo electrónico (Resend).
//
// FEAT-002: módulo básico que registra el intento de envío.
// FEAT-003: conectará Resend real usando RESEND_API_KEY / EMAIL_FROM.
//
// INVARIANTE DE BUILD: RESEND_API_KEY se lee en tiempo de petición (lazy).
// Si no está definida, el envío queda como "stub" (solo log), lo que permite
// que `next build` pase sin secretos.
// ===========================================================================

export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
}

export interface EmailResult {
  ok: boolean;
  error?: string;
}

/**
 * Envía un correo electrónico usando Resend.
 *
 * Si RESEND_API_KEY no está definida, actúa como stub: registra el intento
 * por consola y devuelve ok:true (modo demo/desarrollo).
 *
 * En FEAT-003 este cliente se reemplaza/amplía con la integración real.
 */
export async function sendEmail(payload: EmailPayload): Promise<EmailResult> {
  const apiKey = (process.env.RESEND_API_KEY ?? "").trim();

  if (!apiKey) {
    console.log(
      `[email/stub] Se enviaría correo a: ${payload.to} | Asunto: ${payload.subject}`
    );
    return { ok: true };
  }

  // Integración real con Resend (activada en FEAT-003 cuando RESEND_API_KEY está definida).
  try {
    const from =
      (process.env.EMAIL_FROM ?? "").trim() ||
      "OrientApp <noreply@orientapp.local>";

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [payload.to],
        subject: payload.subject,
        html: payload.html,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      return { ok: false, error: `Resend error ${response.status}: ${text}` };
    }

    return { ok: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { ok: false, error: msg };
  }
}

/**
 * Envía el correo de verificación de cuenta al usuario recién registrado.
 *
 * @param email Correo del destinatario.
 * @param token Token de verificación a incluir en el enlace.
 */
export async function sendVerificationEmail(
  email: string,
  token: string
): Promise<EmailResult> {
  const baseUrl =
    (process.env.NEXT_PUBLIC_APP_URL ?? "").trim() ||
    "http://localhost:3000";

  const verifyUrl = `${baseUrl}/verify?token=${encodeURIComponent(token)}`;

  return sendEmail({
    to: email,
    subject: "Confirma tu cuenta en OrientApp",
    html: `
      <h2>Bienvenido a OrientApp</h2>
      <p>Gracias por registrarte. Para activar tu cuenta, haz clic en el siguiente enlace:</p>
      <p><a href="${verifyUrl}" style="font-size:16px;font-weight:bold;">Verificar mi cuenta</a></p>
      <p>Este enlace expira en 24 horas.</p>
      <p>Si no creaste esta cuenta, puedes ignorar este mensaje.</p>
    `,
  });
}
