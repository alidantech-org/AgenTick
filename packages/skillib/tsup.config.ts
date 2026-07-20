import { defineConfig } from "tsup";

export default defineConfig([
  {
    entry: {
      "cli/index": "src/cli/index.ts",
      "tool/runtime": "src/tool/runtime.ts",
    },
    format: ["esm"],
    platform: "node",
    target: "node22",
    bundle: true,
    splitting: false,
    sourcemap: true,
    clean: true,
    dts: true,
    banner: {
      js: "#!/usr/bin/env node",
    },
    noExternal: [
      "@alidantech/skillib-config",
      "@alidantech/skillib-shared",
      "@alidantech/skillib-skill-lib",
    ],
  },
]);
