import { defineConfig } from "tsup";

export default defineConfig([
  // Base configuration
  {
    entry: ["src/index.ts"],
    format: ["esm", "cjs"],
    dts: true,
    clean: true,
    outDir: "dist",
  },
  // Next.js specific configuration
  {
    entry: ["src/next/index.ts"],
    format: ["esm", "cjs"],
    dts: true,
    clean: false,
    outDir: "dist/next",
    external: ["next", "react", "react-dom"],
  },
]);
