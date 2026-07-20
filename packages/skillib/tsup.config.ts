import { defineConfig } from "tsup";

const bundledWorkspacePackages = [
  "@alidantech/skillib-config",
  "@alidantech/skillib-shared",
  "@alidantech/skillib-skill-lib",
];

const shared = {
  format: ["esm"] as const,
  platform: "node" as const,
  target: "node22",
  bundle: true,
  splitting: false,
  sourcemap: true,
  dts: false,
  noExternal: bundledWorkspacePackages,
  external: ["node:sqlite"],
  esbuildOptions(options: { supported?: Record<string, boolean> }) {
    options.supported = {
      ...options.supported,
      "node-colon-prefix-import": true,
    };
  },
};

export default defineConfig([
  {
    ...shared,
    entry: { "cli/index": "src/cli/index.ts" },
    clean: true,
  },
  {
    ...shared,
    entry: { "tool/runtime": "src/tool/runtime.ts" },
    clean: false,
  },
]);
