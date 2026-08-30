import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// ===========================================================================
// Tests para el cliente de correo (email/client.ts).
//
// El módulo `resend` se mockea con vi.mock para que los tests sean
// completamente offline (sin llamadas HTTP reales).
// ===========================================================================

// Definimos el spy ANTES del vi.mock (el factory tiene acceso a él).
const mockEmailsSend = vi.fn();

vi.mock("resend", () => {
  const ResendMock = vi.fn().mockImplementation(() => ({
    emails: { send: mockEmailsSend },
  }));
  return { Resend: ResendMock };
});

// Importamos el módulo bajo prueba DESPUÉS de definir el mock.
import {
  isEmailConfigured,
  sendEmail,
} from "@/lib/email/client";

// ===========================================================================
// isEmailConfigured
// ===========================================================================

describe("isEmailConfigured", () => {
  afterEach(() => {
    delete process.env.RESEND_API_KEY;
    delete process.env.EMAIL_FROM;
  });

  it("devuelve false cuando RESEND_API_KEY no está definida", () => {
    delete process.env.RESEND_API_KEY;
    delete process.env.EMAIL_FROM;
    expect(isEmailConfigured()).toBe(false);
  });

  it("devuelve false cuando solo RESEND_API_KEY está definida (falta EMAIL_FROM)", () => {
    process.env.RESEND_API_KEY = "re_test_key";
    delete process.env.EMAIL_FROM;
    expect(isEmailConfigured()).toBe(false);
  });

  it("devuelve false cuando solo EMAIL_FROM está definida (falta RESEND_API_KEY)", () => {
    delete process.env.RESEND_API_KEY;
    process.env.EMAIL_FROM = "OrientApp <noreply@test.com>";
    expect(isEmailConfigured()).toBe(false);
  });

  it("devuelve true cuando ambas variables están definidas", () => {
    process.env.RESEND_API_KEY = "re_test_key";
    process.env.EMAIL_FROM = "OrientApp <noreply@test.com>";
    expect(isEmailConfigured()).toBe(true);
  });
});

// ===========================================================================
// sendEmail - modo no configurado
// ===========================================================================

describe("sendEmail - modo no configurado", () => {
  beforeEach(() => {
    delete process.env.RESEND_API_KEY;
    delete process.env.EMAIL_FROM;
    mockEmailsSend.mockReset();
  });

  afterEach(() => {
    delete process.env.RESEND_API_KEY;
    delete process.env.EMAIL_FROM;
  });

  it("devuelve { sent: false, skipped: true } cuando RESEND_API_KEY no está definida", async () => {
    const result = await sendEmail({
      to: "test@example.com",
      subject: "Prueba",
      html: "<p>Hola</p>",
    });
    expect(result.sent).toBe(false);
    expect(result.skipped).toBe(true);
  });

  it("NO lanza ningún error cuando el correo no está configurado", async () => {
    await expect(
      sendEmail({
        to: "test@example.com",
        subject: "Prueba",
        html: "<p>Hola</p>",
      })
    ).resolves.not.toThrow();
  });

  it("NO llama a resend cuando no está configurado", async () => {
    await sendEmail({
      to: "test@example.com",
      subject: "Prueba",
      html: "<p>Hola</p>",
    });
    expect(mockEmailsSend).not.toHaveBeenCalled();
  });
});

// ===========================================================================
// sendEmail - modo configurado (con mock de Resend)
// ===========================================================================

describe("sendEmail - modo configurado (mock Resend)", () => {
  beforeEach(() => {
    process.env.RESEND_API_KEY = "re_test_key_123";
    process.env.EMAIL_FROM = "OrientApp <noreply@orientapp.test>";
    mockEmailsSend.mockReset();
  });

  afterEach(() => {
    delete process.env.RESEND_API_KEY;
    delete process.env.EMAIL_FROM;
  });

  it("llama a resend.emails.send con los campos correctos", async () => {
    mockEmailsSend.mockResolvedValue({ data: { id: "email-id-1" }, error: null });

    await sendEmail({
      to: "estudiante@example.com",
      subject: "Tus resultados vocacionales",
      html: "<h1>RIASEC</h1>",
      text: "RIASEC",
    });

    expect(mockEmailsSend).toHaveBeenCalledOnce();
    const callArgs = mockEmailsSend.mock.calls[0][0] as Record<string, unknown>;
    expect(callArgs.to).toContain("estudiante@example.com");
    expect(callArgs.subject).toBe("Tus resultados vocacionales");
    expect(callArgs.from).toBe("OrientApp <noreply@orientapp.test>");
    expect(callArgs.html).toBe("<h1>RIASEC</h1>");
  });

  it("devuelve { sent: true } cuando el envío es exitoso", async () => {
    mockEmailsSend.mockResolvedValue({ data: { id: "email-id-2" }, error: null });

    const result = await sendEmail({
      to: "user@example.com",
      subject: "Confirma tu cuenta",
      html: "<p>Enlace</p>",
    });

    expect(result.sent).toBe(true);
    expect(result.skipped).toBeUndefined();
  });

  it("devuelve { sent: false, error } y no lanza cuando Resend devuelve error", async () => {
    mockEmailsSend.mockResolvedValue({
      data: null,
      error: { message: "API key inválida", name: "invalid_api_key" },
    });

    const result = await sendEmail({
      to: "user@example.com",
      subject: "Prueba",
      html: "<p>Hola</p>",
    });

    expect(result.sent).toBe(false);
    expect(result.error).toContain("API key inválida");
  });

  it("devuelve { sent: false, error } y no lanza cuando Resend lanza una excepción", async () => {
    mockEmailsSend.mockRejectedValue(new Error("Timeout de red"));

    const result = await sendEmail({
      to: "user@example.com",
      subject: "Prueba",
      html: "<p>Hola</p>",
    });

    expect(result.sent).toBe(false);
    expect(result.error).toContain("Timeout de red");
  });
});
