import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  // Runtime automático de JSX: permite importar y ejecutar server components
  // (p. ej. app/results/[sessionId]/page.tsx) en las pruebas de cableado sin
  // que dependan de React en ámbito global (evita "React is not defined").
  esbuild: {
    jsx: "automatic",
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL(".", import.meta.url)),
    },
  },
  test: {
    include: ["tests/**/*.test.ts"],
    environment: "node",
  },
});
