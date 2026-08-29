import { describe, it, expect } from "vitest";
import { chunkText } from "@/lib/knowledge/chunk";
import { buildChatEndpoint, buildEmbeddingsEndpoint } from "@/lib/ai/client";
import { buildKnowledgeContextBlock } from "@/lib/ai/prompts";
import type { KnowledgePassage } from "@/lib/knowledge/retrieve";

describe("chunkText", () => {
  it("returns a single chunk for short content", () => {
    const chunks = chunkText("Un texto corto sobre orientación vocacional.");
    expect(chunks).toHaveLength(1);
  });

  it("returns empty array for blank content", () => {
    expect(chunkText("   ")).toEqual([]);
  });

  it("splits long content into multiple overlapping chunks", () => {
    const paragraph = "La teoría de Holland describe seis tipos vocacionales. ";
    const long = paragraph.repeat(120); // ~6500 chars
    const chunks = chunkText(long, { chunkSize: 1000, overlap: 150 });
    expect(chunks.length).toBeGreaterThan(1);
    for (const c of chunks) {
      expect(c.length).toBeLessThanOrEqual(1000);
      expect(c.trim().length).toBeGreaterThan(0);
    }
  });
});

describe("buildChatEndpoint", () => {
  it("appends /v1/chat/completions to a bare host", () => {
    expect(buildChatEndpoint("integrate.api.nvidia.com")).toBe(
      "https://integrate.api.nvidia.com/v1/chat/completions"
    );
  });

  it("appends /chat/completions when base ends in /v1", () => {
    expect(buildChatEndpoint("https://api.openai.com/v1")).toBe(
      "https://api.openai.com/v1/chat/completions"
    );
  });

  it("keeps an endpoint that already ends in /chat/completions", () => {
    expect(
      buildChatEndpoint("https://host/v1/chat/completions/")
    ).toBe("https://host/v1/chat/completions");
  });

  it("preserves http:// scheme for local providers", () => {
    expect(buildChatEndpoint("http://localhost:11434/v1")).toBe(
      "http://localhost:11434/v1/chat/completions"
    );
  });
});

describe("buildEmbeddingsEndpoint", () => {
  it("builds /v1/embeddings from a bare host", () => {
    expect(buildEmbeddingsEndpoint("api.openai.com")).toBe(
      "https://api.openai.com/v1/embeddings"
    );
  });

  it("appends /embeddings when base ends in /v1", () => {
    expect(buildEmbeddingsEndpoint("https://api.openai.com/v1")).toBe(
      "https://api.openai.com/v1/embeddings"
    );
  });
});

describe("buildKnowledgeContextBlock", () => {
  it("returns empty string when there are no passages", () => {
    expect(buildKnowledgeContextBlock([])).toBe("");
  });

  it("includes titles, references and citation instructions", () => {
    const passages: KnowledgePassage[] = [
      {
        documentId: 1,
        title: "Making Vocational Choices",
        sourceType: "BOOK",
        sourceReference: "Holland, J. L. (1997)",
        chunkIndex: 0,
        content: "Los intereses vocacionales se agrupan en seis tipos.",
        distance: 0.1,
      },
    ];
    const block = buildKnowledgeContextBlock(passages);
    expect(block).toContain("Fuentes de conocimiento");
    expect(block).toContain("Making Vocational Choices");
    expect(block).toContain("Holland, J. L. (1997)");
    expect(block).toContain("cita");
  });
});
