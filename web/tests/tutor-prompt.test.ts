import { describe, it, expect } from "vitest";
import {
  buildTutorSystemPrompt,
  type TutorContext,
} from "@/lib/ai/prompts";
import type { PsychometricScores } from "@/lib/riasec/types";

const RIASEC_SCORES: PsychometricScores = {
  r: 80,
  i: 70,
  a: 10,
  s: 20,
  e: 30,
  c: 15,
};

describe("buildTutorSystemPrompt — RIASEC context", () => {
  it("includes RIASEC scores and dominant code when present", () => {
    const ctx: TutorContext = {
      scores: RIASEC_SCORES,
      dominantCode: "RIC",
      dominantSummary: "Realista, Investigador, Convencional",
      reliabilityLevel: "Alta",
    };
    const prompt = buildTutorSystemPrompt(ctx);
    expect(prompt).toContain("Código RIASEC Dominante: RIC");
    expect(prompt).toContain("R (Realista): 80%");
    expect(prompt).not.toContain("CHASIDE");
  });

  it("invites to complete the test when no profile is available", () => {
    const prompt = buildTutorSystemPrompt({});
    expect(prompt).toContain("aún no ha completado el test RIASEC");
  });
});

describe("buildTutorSystemPrompt — non-RIASEC method context", () => {
  it("grounds on the real CHASIDE result instead of a zero RIASEC profile", () => {
    const ctx: TutorContext = {
      // Un vector RIASEC de ceros NO debe filtrarse al prompt del método.
      scores: { r: 0, i: 0, a: 0, s: 0, e: 0, c: 0 },
      dominantCode: "SI",
      method: {
        methodId: "CHASIDE",
        methodName: "CHASIDE",
        dominantCode: "SI",
        interpretation:
          "Tus intereses dominantes se orientan hacia Salud e Ingeniería.",
        dimensionScores: [
          { code: "S", title: "Medicina y Ciencias de la Salud", value: 90 },
          { code: "I", title: "Enseñanzas Técnicas (Ingeniería)", value: 70 },
          { code: "C", title: "Administrativo-Contable", value: 20 },
        ],
        studentName: "Ana",
      },
    };
    const prompt = buildTutorSystemPrompt(ctx);
    // Menciona el método real y su interpretación.
    expect(prompt).toContain("CHASIDE");
    expect(prompt).toContain("Salud e Ingeniería");
    expect(prompt).toContain("Áreas/dimensiones dominantes: SI");
    // Ordena las dimensiones por valor y las incluye.
    expect(prompt).toContain("S (Medicina y Ciencias de la Salud): 90%");
    expect(prompt).toContain("I (Enseñanzas Técnicas (Ingeniería)): 70%");
    // NO debe inyectar el perfil de ceros RIASEC.
    expect(prompt).not.toContain("R (Realista): 0%");
    expect(prompt).not.toContain("Código RIASEC Dominante");
  });

  it("includes TIPOV method name and dimension scores", () => {
    const ctx: TutorContext = {
      method: {
        methodId: "TIPOV",
        methodName: "TIPOV",
        dominantCode: "TEC-CIE",
        interpretation: "Interés destacado en tecnología y ciencia.",
        dimensionScores: [
          { code: "TEC", title: "Tecnología", value: 88 },
          { code: "CIE", title: "Ciencia", value: 75 },
        ],
      },
    };
    const prompt = buildTutorSystemPrompt(ctx);
    expect(prompt).toContain("instrumento vocacional TIPOV");
    expect(prompt).toContain("TEC (Tecnología): 88%");
    expect(prompt).toContain("Interés destacado en tecnología y ciencia.");
    expect(prompt).not.toContain("Código RIASEC Dominante");
  });
});
