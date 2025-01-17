import { defineConfig } from "tsup";

export default defineConfig([
  {
    entry: {
      index: "src/index.ts",
    },
    format: ["esm", "cjs"],
    dts: true,
    sourcemap: true,
    clean: false,
  },
  // Next.js specific configuration
  {
    entry: {
      "next/index": "src/next/index.ts",
    },
    format: ["esm", "cjs"],
    dts: true,
    sourcemap: true,
    clean: false,
    external: [
      "@vercel/otel",
      "@opentelemetry/sdk-logs",
      "@opentelemetry/api-logs",
      "@opentelemetry/instrumentation",
    ],
  },
]);
