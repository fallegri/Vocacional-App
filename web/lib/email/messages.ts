// ===========================================================================
// Constructores de mensajes de correo electrónico.
//
// Funciones PURAS sin efectos secundarios: solo reciben parámetros y devuelven
// el asunto, el cuerpo HTML y el texto plano del correo en ESPAÑOL.
// No leen variables de entorno ni importan el cliente de correo.
// Esto las hace fáciles de probar unitariamente.
// ===========================================================================

/**
 * Escapa caracteres especiales de HTML para evitar inyección de HTML en
 * plantillas de correo electrónico.
 * Convierte &, <, >, ", ' a sus entidades HTML correspondientes.
 */
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

export interface VerificationEmailParams {
  /** Nombre visible del usuario (opcional). */
  displayName?: string;
  /** URL completa de verificación (incluye el token). */
  verifyUrl: string;
}

export interface VerificationEmailContent {
  subject: string;
  html: string;
  text: string;
}

/**
 * Construye el correo de confirmación de cuenta.
 * Se envía al registrarse para activar la cuenta antes del primer inicio de
 * sesión.
 */
export function buildVerificationEmail(
  params: VerificationEmailParams
): VerificationEmailContent {
  const { displayName, verifyUrl } = params;
  const safeDisplayName = displayName ? escapeHtml(displayName) : undefined;
  const safeVerifyUrl = escapeHtml(verifyUrl);
  const greeting = safeDisplayName ? `Hola, ${safeDisplayName}` : "Hola";

  const subject = "Confirma tu cuenta en OrientApp";

  const html = `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><title>${subject}</title></head>
<body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;color:#333;">
  <h2 style="color:#4F46E5;">Bienvenido/a a OrientApp</h2>
  <p>${greeting},</p>
  <p>Gracias por registrarte en OrientApp. Para activar tu cuenta y comenzar a
     usar el sistema de orientación vocacional, haz clic en el botón de abajo:</p>
  <p style="text-align:center;margin:32px 0;">
    <a href="${safeVerifyUrl}"
       style="background:#4F46E5;color:#fff;padding:14px 28px;text-decoration:none;
              border-radius:6px;font-size:16px;font-weight:bold;display:inline-block;">
      Verificar mi cuenta
    </a>
  </p>
  <p>O copia y pega este enlace en tu navegador:</p>
  <p style="word-break:break-all;font-size:13px;color:#555;">${safeVerifyUrl}</p>
  <p><strong>Este enlace expira en 24 horas.</strong></p>
  <hr style="border:none;border-top:1px solid #eee;margin:24px 0;">
  <p style="font-size:12px;color:#888;">
    Si no creaste esta cuenta, puedes ignorar este mensaje. No se realizará
    ningún cambio en tu cuenta.
  </p>
  <p style="font-size:12px;color:#888;">— El equipo de OrientApp</p>
</body>
</html>`;

  const text = `${greeting},

Gracias por registrarte en OrientApp. Para activar tu cuenta haz clic en el siguiente enlace:

${verifyUrl}

Este enlace expira en 24 horas.

Si no creaste esta cuenta, puedes ignorar este mensaje.

— El equipo de OrientApp`;

  return { subject, html, text };
}

export interface ResultsEmailParams {
  /** Nombre del estudiante (opcional). */
  studentName?: string;
  /** Nombre del método vocacional aplicado (p. ej. "RIASEC (Holland)"). */
  methodName: string;
  /** Código dominante resultante del análisis (p. ej. "RIA" o "C-H"). */
  dominantCode: string;
  /** Texto de interpretación del motor determinista. */
  interpretation: string;
  /** URL absoluta a la página de resultados. */
  resultsUrl: string;
}

export interface ResultsEmailContent {
  subject: string;
  html: string;
  text: string;
}

/**
 * Construye el correo con los resultados del diagnóstico vocacional.
 * Incluye el código dominante, la interpretación determinista del método y un
 * enlace a la página de resultados completa.
 */
export function buildResultsEmail(
  params: ResultsEmailParams
): ResultsEmailContent {
  const { studentName, methodName, dominantCode, interpretation, resultsUrl } =
    params;

  const safeStudentName = studentName ? escapeHtml(studentName) : undefined;
  const safeMethodName = escapeHtml(methodName);
  const safeDominantCode = escapeHtml(dominantCode);
  const safeInterpretation = escapeHtml(interpretation);
  const safeResultsUrl = escapeHtml(resultsUrl);

  const greeting = safeStudentName ? `Hola, ${safeStudentName}` : "Hola";
  const subject = "Tus resultados de orientación vocacional en OrientApp";

  const html = `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><title>${subject}</title></head>
<body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;color:#333;">
  <h2 style="color:#4F46E5;">Tus resultados vocacionales</h2>
  <p>${greeting},</p>
  <p>Has completado el diagnóstico vocacional con el método
     <strong>${safeMethodName}</strong>. A continuación encontrarás un resumen
     de tu resultado:</p>

  <div style="background:#F5F3FF;border-left:4px solid #4F46E5;padding:16px 20px;
              border-radius:0 8px 8px 0;margin:24px 0;">
    <p style="margin:0 0 8px;font-size:14px;color:#6B7280;font-weight:600;
              text-transform:uppercase;letter-spacing:0.05em;">Código dominante</p>
    <p style="margin:0;font-size:28px;font-weight:700;color:#4F46E5;">${safeDominantCode}</p>
  </div>

  <h3 style="color:#374151;">Interpretación</h3>
  <p style="line-height:1.6;">${safeInterpretation}</p>

  <p style="text-align:center;margin:32px 0;">
    <a href="${safeResultsUrl}"
       style="background:#4F46E5;color:#fff;padding:14px 28px;text-decoration:none;
              border-radius:6px;font-size:16px;font-weight:bold;display:inline-block;">
      Ver diagnóstico completo
    </a>
  </p>
  <p>O copia y pega este enlace en tu navegador:</p>
  <p style="word-break:break-all;font-size:13px;color:#555;">${safeResultsUrl}</p>

  <hr style="border:none;border-top:1px solid #eee;margin:24px 0;">
  <p style="font-size:12px;color:#888;">
    Este correo fue enviado automáticamente por OrientApp al finalizar tu
    diagnóstico. Guárdalo para acceder a tu informe en cualquier momento.
  </p>
  <p style="font-size:12px;color:#888;">— El equipo de OrientApp</p>
</body>
</html>`;

  const text = `${studentName ? `Hola, ${studentName}` : "Hola"},

Has completado el diagnóstico vocacional con el método ${methodName}.

CÓDIGO DOMINANTE: ${dominantCode}

INTERPRETACIÓN:
${interpretation}

Ver tu diagnóstico completo en:
${resultsUrl}

Este correo fue enviado automáticamente por OrientApp.
— El equipo de OrientApp`;

  return { subject, html, text };
}
