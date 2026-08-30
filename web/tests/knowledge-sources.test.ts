import { describe, it, expect } from "vitest";
import {
  describeKnowledgeSource,
  slugFromFilename,
  titleFromHeading,
} from "@/lib/knowledge/sources";

// Los 7 documentos markdown presentes en skills/knowledge/.
const MD_FILES = [
  "cuestionario-cip-r.md",
  "instrumento-autoorientacion.md",
  "jaime-bernstein-adleriano.md",
  "metodo-chaside.md",
  "otros-inventarios-kuder-strong.md",
  "test-magdalena-contreras.md",
  "test-tipov.md",
];

describe("slugFromFilename", () => {
  it("deriva el slug quitando la extensión .md", () => {
    expect(slugFromFilename("cuestionario-cip-r.md")).toBe("cuestionario-cip-r");
    expect(slugFromFilename("metodo-chaside.md")).toBe("metodo-chaside");
  });

  it("normaliza diacríticos y mayúsculas", () => {
    expect(slugFromFilename("Diseño de Instrumento.md")).toBe(
      "diseno-de-instrumento"
    );
  });

  it("ignora la ruta y usa solo el nombre base", () => {
    expect(slugFromFilename("/a/b/test-tipov.md")).toBe("test-tipov");
  });

  it("es determinista para la misma entrada", () => {
    expect(slugFromFilename("test-tipov.md")).toBe(
      slugFromFilename("test-tipov.md")
    );
  });
});

describe("titleFromHeading", () => {
  it("extrae el título del H1 markdown", () => {
    expect(
      titleFromHeading("# Cuestionario de Intereses Profesionales Revisado (CIP-R)")
    ).toBe("Cuestionario de Intereses Profesionales Revisado (CIP-R)");
  });

  it("devuelve null si no hay H1", () => {
    expect(titleFromHeading("## Subtítulo")).toBeNull();
    expect(titleFromHeading("")).toBeNull();
    expect(titleFromHeading(null)).toBeNull();
    expect(titleFromHeading(undefined)).toBeNull();
  });
});

describe("describeKnowledgeSource", () => {
  it("usa el título del H1 cuando se provee", () => {
    const d = describeKnowledgeSource(
      "cuestionario-cip-r.md",
      "# Cuestionario de Intereses Profesionales Revisado (CIP-R)"
    );
    expect(d.slug).toBe("cuestionario-cip-r");
    expect(d.title).toBe(
      "Cuestionario de Intereses Profesionales Revisado (CIP-R)"
    );
  });

  it("usa un título de respaldo en español cuando no hay H1", () => {
    const d = describeKnowledgeSource("test-tipov.md");
    expect(d.title).toBe(
      "Test de Intereses Profesionales para la Orientación Vocacional (TIPOV)"
    );
  });

  it("asigna sourceType RESEARCH a todos los documentos de estudio", () => {
    for (const file of MD_FILES) {
      expect(describeKnowledgeSource(file).sourceType).toBe("RESEARCH");
    }
  });

  it("incluye sourceReference para CIP-R y Magdalena Contreras", () => {
    const cipr = describeKnowledgeSource("cuestionario-cip-r.md");
    expect(cipr.sourceReference).toBeTruthy();
    expect(cipr.sourceReference).toContain("Fogliatto");

    const magdalena = describeKnowledgeSource("test-magdalena-contreras.md");
    expect(magdalena.sourceReference).toBeTruthy();
    expect(magdalena.sourceReference).toContain("Magdalena Contreras");
  });

  it("devuelve sourceReference null cuando no hay cita evidente", () => {
    expect(describeKnowledgeSource("metodo-chaside.md").sourceReference).toBeNull();
  });

  it("produce slugs estables y únicos para todos los archivos .md", () => {
    const slugs = MD_FILES.map((f) => describeKnowledgeSource(f).slug);
    // Todos no vacíos.
    for (const slug of slugs) expect(slug.length).toBeGreaterThan(0);
    // Únicos.
    expect(new Set(slugs).size).toBe(MD_FILES.length);
  });

  it("da un título no vacío para cada archivo .md conocido", () => {
    for (const file of MD_FILES) {
      expect(describeKnowledgeSource(file).title.length).toBeGreaterThan(0);
    }
  });
});
