import { defineConfig } from "tsup";

const bundledWorkspacePackages = [
  "@alidantech/skillib-config",
  "@alidantech/skillib-shared",
  "@alidantech/skillib-skill-lib",
];

export default defineConfig([
  {
    entry: { "cli/index": "src/cli/index.ts" },
    format: ["esm"],
    platform: "node",
    target: "node22",
    bundle: true,
    splitting: false,
    sourcemap: true,
    clean: true,
    dts: false,
    noExternal: bundledWorkspacePackages,
  },
  {
    entry: { "tool/runtime": "src/tool/runtime.ts" },
    format: ["esm"],
    platform: "node",
    target: "node22",
    bundle: true,
    splitting: false,
    sourcemap: true,
    clean: false,
    dts: true,
    noExternal: bundledWorkspacePackages,
  },
]);
