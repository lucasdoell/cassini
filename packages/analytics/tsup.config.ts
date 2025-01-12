import { defineConfig } from "tsup";

export default defineConfig([
  // Client bundle
  {
    entry: {
      index: "src/index.ts",
      "next/index": "src/next/index.ts",
    },
    format: ["esm", "cjs"],
    dts: true,
    sourcemap: true,
    clean: false,
    external: ["react", "next", "react-dom"],
    esbuildOptions(options) {
      options.banner = {
        js: '"use client";',
      };
    },
  },
  // Server bundle
  {
    entry: {
      "next/server/index": "src/next/server.ts",
    },
    format: ["esm", "cjs"],
    dts: true,
    sourcemap: true,
    clean: false,
    external: ["react", "next", "react-dom"],
  },
]);
