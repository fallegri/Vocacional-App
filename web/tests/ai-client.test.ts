import { describe, it, expect, afterEach, vi } from "vitest";
import { embedTexts } from "@/lib/ai/client";
import type { AiConfiguration } from "@/lib/ai/config";

const config: AiConfiguration = {
  providerType: "OPENAI",
  baseUrl: "https://api.openai.com/v1",
  apiKey: "sk-test",
  modelName: "gpt-4o-mini",
  embeddingModel: "text-embedding-3-small",
  temperature: 0.7,
  maxTokens: 1024,
};

function mockFetchOnce(body: unknown, ok = true, status = 200) {
  const fetchMock = vi.fn().mockResolvedValue({
    ok,
    status,
    statusText: ok ? "OK" : "Error",
    text: async () => JSON.stringify(body),
  } as unknown as Response);
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("embedTexts ordering", () => {
  it("reorders provider vectors by the `index` field before returning them", async () => {
    // El proveedor devuelve los embeddings DESORDENADOS respecto a `input`.
    mockFetchOnce({
      data: [
        { index: 2, embedding: [3, 3, 3] },
        { index: 0, embedding: [1, 1, 1] },
        { index: 1, embedding: [2, 2, 2] },
      ],
    });

    const result = await embedTexts(config, ["a", "b", "c"]);
    expect(result.ok).toBe(true);
    if (result.ok) {
      // Debe quedar alineado con a=0, b=1, c=2 tras ordenar por index.
      expect(result.value).toEqual([
        [1, 1, 1],
        [2, 2, 2],
        [3, 3, 3],
      ]);
    }
  });

  it("preserves arrival order when `index` is absent", async () => {
    mockFetchOnce({
      data: [
        { embedding: [1, 1] },
        { embedding: [2, 2] },
      ],
    });

    const result = await embedTexts(config, ["a", "b"]);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toEqual([
        [1, 1],
        [2, 2],
      ]);
    }
  });

  it("fails when the provider returns fewer vectors than inputs (partial batch)", async () => {
    mockFetchOnce({
      data: [{ index: 0, embedding: [1, 1] }],
    });

    const result = await embedTexts(config, ["a", "b", "c"]);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain("1 vectores para 3 textos");
    }
  });

  it("returns [] for empty input without calling the provider", async () => {
    const fetchMock = mockFetchOnce({});
    const result = await embedTexts(config, []);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
