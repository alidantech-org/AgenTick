import { describe, expect, it } from "vitest";
import { parseAgentickConfig, parseSkillLock } from "./index.js";

describe("AgenTick configuration", () => {
  it("accepts a self-contained agents configuration", () => {
    const value = parseAgentickConfig(`
version: 1
project: { name: sample, root: . }
watch:
  include: [src/**]
  ignore: [node_modules/**]
agents:
  protected: [agents/rules/**]
  writable: [agents/work/**]
verify: { commands: [] }
runtime: { host: 127.0.0.1, port: 4317 }
registry: { urlEnv: AGENTICK_REGISTRY_URL }
skilllib:
  directory: agents/skillib
  requireIntegrity: true
  executeInstalledScripts: false
`);
    expect(value.project.name).toBe("sample");
    expect(value.skilllib.directory).toBe("agents/skillib");
  });

  it("requires SHA-512 SRI values in the skills lock", () => {
    expect(() =>
      parseSkillLock(`
lockfileVersion: 1
registry: https://skills.example.test
skills:
  example/typecheck:
    version: 1.0.0
    integrity: sha256-invalid
    resolved: https://skills.example.test/example/typecheck/1.0.0
`),
    ).toThrow();
  });

  it("requires exact semantic versions in the skills lock", () => {
    expect(() =>
      parseSkillLock(`
lockfileVersion: 1
registry: https://skills.example.test
skills:
  example/typecheck:
    version: ^1.0.0
    integrity: sha512-c2tpbGw=
    resolved: https://skills.example.test/example/typecheck/1.0.0
`),
    ).toThrow(/exact semantic version/);
  });
});
