import { describe, expect, it } from "vitest";
import {
  normalizeCohortCode,
  resolveBaseUrl,
  buildCohortTestUrl,
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
