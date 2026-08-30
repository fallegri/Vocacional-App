import { describe, it, expect } from "vitest";
import {
  buildVerificationEmail,
  buildResultsEmail,
} from "@/lib/email/messages";

// ===========================================================================
// Tests para los constructores de mensajes de correo (sin efectos secundarios)
// ===========================================================================

describe("buildVerificationEmail", () => {
  it("incluye la URL de verificación en el HTML y en el texto plano", () => {
    const verifyUrl = "https://orientapp.vercel.app/verify?token=abc123";
    const { html, text } = buildVerificationEmail({ verifyUrl });
    expect(html).toContain(verifyUrl);
    expect(text).toContain(verifyUrl);
  });

  it("tiene un asunto en español", () => {
    const { subject } = buildVerificationEmail({
      verifyUrl: "https://orientapp.local/verify?token=xyz",
    });
    expect(subject).toMatch(/cuenta|OrientApp/i);
    // Confirma que el asunto está en español (no en inglés).
    expect(subject).not.toMatch(/confirm your/i);
  });

  it("incluye el nombre del usuario en el saludo cuando se proporciona", () => {
    const { html, text } = buildVerificationEmail({
      displayName: "María García",
      verifyUrl: "https://orientapp.local/verify?token=xyz",
    });
    expect(html).toContain("María García");
    expect(text).toContain("María García");
  });

  it("usa un saludo genérico cuando no se proporciona displayName", () => {
    const { html, text } = buildVerificationEmail({
      verifyUrl: "https://orientapp.local/verify?token=xyz",
    });
    expect(html).toContain("Hola");
    expect(text).toContain("Hola");
    // No debe contener 'undefined' en el saludo.
    expect(html).not.toContain("undefined");
    expect(text).not.toContain("undefined");
  });

  it("devuelve subject, html y text como strings no vacíos", () => {
    const result = buildVerificationEmail({
      verifyUrl: "https://orientapp.local/verify?token=xyz",
    });
    expect(typeof result.subject).toBe("string");
    expect(typeof result.html).toBe("string");
    expect(typeof result.text).toBe("string");
    expect(result.subject.length).toBeGreaterThan(0);
    expect(result.html.length).toBeGreaterThan(0);
    expect(result.text.length).toBeGreaterThan(0);
  });
});

describe("buildResultsEmail", () => {
  const baseParams = {
    methodName: "CHASIDE",
    dominantCode: "C-H",
    interpretation:
      "Tu perfil indica una orientación hacia las ciencias y la salud.",
    resultsUrl: "https://orientapp.vercel.app/results/session-abc",
  };

  it("incluye el código dominante en el HTML y en el texto plano", () => {
    const { html, text } = buildResultsEmail(baseParams);
    expect(html).toContain(baseParams.dominantCode);
    expect(text).toContain(baseParams.dominantCode);
  });

  it("incluye el texto de interpretación en el HTML y en el texto plano", () => {
    const { html, text } = buildResultsEmail(baseParams);
    expect(html).toContain(baseParams.interpretation);
    expect(text).toContain(baseParams.interpretation);
  });

  it("incluye la URL de resultados en el HTML y en el texto plano", () => {
    const { html, text } = buildResultsEmail(baseParams);
    expect(html).toContain(baseParams.resultsUrl);
    expect(text).toContain(baseParams.resultsUrl);
  });

  it("tiene un asunto en español", () => {
    const { subject } = buildResultsEmail(baseParams);
    expect(subject).toMatch(/vocacional|resultados|OrientApp/i);
    expect(subject).not.toMatch(/your results/i);
  });

  it("incluye el nombre del método en el contenido", () => {
    const { html, text } = buildResultsEmail(baseParams);
    expect(html).toContain("CHASIDE");
    expect(text).toContain("CHASIDE");
  });

  it("incluye el nombre del estudiante cuando se proporciona", () => {
    const { html, text } = buildResultsEmail({
      ...baseParams,
      studentName: "Carlos Rodríguez",
    });
    expect(html).toContain("Carlos Rodríguez");
    expect(text).toContain("Carlos Rodríguez");
  });

  it("usa saludo genérico cuando no se proporciona studentName", () => {
    const { html, text } = buildResultsEmail(baseParams);
    expect(html).toContain("Hola");
    expect(text).toContain("Hola");
    expect(html).not.toContain("undefined");
    expect(text).not.toContain("undefined");
  });

  it("devuelve subject, html y text como strings no vacíos", () => {
    const result = buildResultsEmail(baseParams);
    expect(typeof result.subject).toBe("string");
    expect(typeof result.html).toBe("string");
    expect(typeof result.text).toBe("string");
    expect(result.subject.length).toBeGreaterThan(0);
    expect(result.html.length).toBeGreaterThan(0);
    expect(result.text.length).toBeGreaterThan(0);
  });

  it("escapa correctamente un studentName con etiquetas HTML (<script>)", () => {
    const { html } = buildResultsEmail({
      ...baseParams,
      studentName: '<script>alert("xss")</script>',
    });
    // El HTML no debe contener la etiqueta <script> sin escapar.
    expect(html).not.toContain("<script>");
    expect(html).not.toContain("</script>");
    // Debe contener los caracteres escapados.
    expect(html).toContain("&lt;script&gt;");
    expect(html).toContain("&lt;/script&gt;");
  });
});
