import { describe, it, expect, vi, beforeEach } from "vitest";

// ===========================================================================
// Tests unitarios para loadSessionResponses() (web/lib/sessions.ts).
//
// Se mockea query() de '@/lib/db' con vi.mock de fábrica para controlar las
// respuestas de la base de datos sin necesitar una conexión real.
// ===========================================================================

vi.mock("@/lib/db", () => ({
  query: vi.fn(),
  withTransaction: vi.fn(),
}));

// Importar DESPUÉS de declarar los vi.mock (hoisting de Vitest).
import { loadSessionResponses } from "@/lib/sessions";
import { query } from "@/lib/db";

const mockQuery = vi.mocked(query);

beforeEach(() => {
  mockQuery.mockReset();
});

describe("loadSessionResponses", () => {
  it("(a) propaga el error cuando la BD lanza una excepción", async () => {
    mockQuery.mockRejectedValue(new Error("connection refused"));

    await expect(loadSessionResponses("sesion-inexistente")).rejects.toThrow(
      "connection refused"
    );
  });

  it("(b) mapea correctamente los campos de una fila al tipo SessionResponse", async () => {
    mockQuery.mockResolvedValue([
      {
        question_id: 42,
        dimension_code: "R",
        score: 4,
        time_spent_ms: 3500,
        answered_at: 1700000000000,
      },
    ]);

    const result = await loadSessionResponses("sesion-abc");

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      questionId: 42,
      dimensionCode: "R",
      score: 4,
      timeSpentMs: 3500,
      answeredAt: 1700000000000,
    });

    // Verificar que se llamó con la consulta y el parámetro correctos.
    expect(mockQuery).toHaveBeenCalledOnce();
    const [sql, params] = mockQuery.mock.calls[0];
    expect(sql).toContain("assessment_responses");
    expect(params).toContain("sesion-abc");
  });

  it("(c) devuelve array vacío cuando la consulta no encuentra filas", async () => {
    mockQuery.mockResolvedValue([]);

    const result = await loadSessionResponses("sesion-sin-respuestas");

    expect(result).toEqual([]);
  });

  it("(d) convierte correctamente valores nulos a sus valores por defecto", async () => {
    mockQuery.mockResolvedValue([
      {
        question_id: 1,
        dimension_code: null,
        score: null,
        time_spent_ms: null,
        answered_at: null,
      },
    ]);

    const result = await loadSessionResponses("sesion-nulos");

    expect(result[0]).toEqual({
      questionId: 1,
      dimensionCode: "",
      score: 0,
      timeSpentMs: 0,
      answeredAt: 0,
    });
  });
});
