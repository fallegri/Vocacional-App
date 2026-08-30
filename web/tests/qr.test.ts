import { describe, expect, it } from "vitest";
import {
  normalizeCohortCode,
  resolveBaseUrl,
  buildCohortTestUrl,
  buildAssessmentRedirectPath,
} from "@/lib/qr";

describe("normalizeCohortCode", () => {
  it("recorta espacios y pasa a mayúsculas", () => {
    expect(normalizeCohortCode("  bio-2026-c ")).toBe("BIO-2026-C");
  });

  it("devuelve cadena vacía ante entrada nula", () => {
    expect(normalizeCohortCode("")).toBe("");
  });
});

describe("resolveBaseUrl", () => {
  it("prefiere el origin explícito sobre la variable de entorno", () => {
    expect(resolveBaseUrl("https://mi-dominio.vercel.app")).toBe(
      "https://mi-dominio.vercel.app"
    );
  });

  it("elimina barras finales", () => {
    expect(resolveBaseUrl("https://example.com///")).toBe(
      "https://example.com"
    );
  });

  it("devuelve cadena vacía sin origin ni env", () => {
    delete process.env.NEXT_PUBLIC_APP_URL;
    expect(resolveBaseUrl()).toBe("");
  });
});

describe("buildCohortTestUrl", () => {
  it("construye la URL con origin explícito", () => {
    expect(
      buildCohortTestUrl("ING-2026-A", "https://orientapp.vercel.app")
    ).toBe("https://orientapp.vercel.app/g/ING-2026-A");
  });

  it("normaliza el código de cohorte", () => {
    expect(buildCohortTestUrl("  med-salud-2026  ", "https://example.com")).toBe(
      "https://example.com/g/MED-SALUD-2026"
    );
  });

  it("devuelve ruta relativa si no hay origin", () => {
    delete process.env.NEXT_PUBLIC_APP_URL;
    expect(buildCohortTestUrl("BIO-2026-C")).toBe("/g/BIO-2026-C");
  });
});

describe("buildAssessmentRedirectPath", () => {
  it("incluye el método asignado a la cohorte cuando es distinto de RIASEC", () => {
    expect(buildAssessmentRedirectPath("BIO-2026-C", "CHASIDE")).toBe(
      "/assessment?cohort=BIO-2026-C&method=CHASIDE"
    );
    expect(buildAssessmentRedirectPath("grp-1", "tipov")).toBe(
      "/assessment?cohort=GRP-1&method=TIPOV"
    );
  });

  it("omite el parámetro method cuando el método es RIASEC (por defecto)", () => {
    expect(buildAssessmentRedirectPath("BIO-2026-C", "RIASEC")).toBe(
      "/assessment?cohort=BIO-2026-C"
    );
    expect(buildAssessmentRedirectPath("BIO-2026-C", "riasec")).toBe(
      "/assessment?cohort=BIO-2026-C"
    );
  });

  it("omite el parámetro method cuando la cohorte no tiene método asignado", () => {
    expect(buildAssessmentRedirectPath("BIO-2026-C", null)).toBe(
      "/assessment?cohort=BIO-2026-C"
    );
    expect(buildAssessmentRedirectPath("BIO-2026-C")).toBe(
      "/assessment?cohort=BIO-2026-C"
    );
  });

  it("normaliza el código de cohorte (mayúsculas, sin espacios)", () => {
    expect(buildAssessmentRedirectPath("  med-2026 ", "CHASIDE")).toBe(
      "/assessment?cohort=MED-2026&method=CHASIDE"
    );
  });
});
