import { describe, expect, it } from "vitest";
import {
  integrityFor,
  integrityForBundle,
  parseSkillMarkdown,
  registryUrlFromEnv,
  validateSkillBundle,
} from "./index.js";

describe("skills", () => {
  it("parses the open SKILL.md shape", () => {
    const parsed = parseSkillMarkdown(`---
name: typecheck
description: Run project type checks. Use when validating TypeScript changes.
---
# Typecheck
Run the configured command.`);
    expect(parsed.metadata.name).toBe("typecheck");
  });

  it("creates stable SHA-512 SRI integrity", () => {
    expect(integrityFor(Buffer.from("skill"))).toMatch(/^sha512-/);
  });

  it("rejects traversal paths in registry bundles", () => {
    expect(() =>
      validateSkillBundle({
        formatVersion: 1,
        id: "example/typecheck",
        version: "1.0.0",
        metadata: {
          name: "typecheck",
          description: "Run type checks when validating code.",
        },
        files: [
          {
            path: "../outside",
            encoding: "base64",
            content: Buffer.from("bad").toString("base64"),
          },
          {
            path: "SKILL.md",
            encoding: "base64",
            content: Buffer.from(
              `---\nname: typecheck\ndescription: Run type checks when validating code.\n---\n`,
            ).toString("base64"),
          },
        ],
      }),
    ).toThrow(/Unsafe skill path/);
  });

  it("hashes a canonical bundle independent of file order", () => {
    const base = {
      formatVersion: 1 as const,
      id: "example/typecheck",
      version: "1.0.0",
      metadata: {
        name: "typecheck",
        description: "Run type checks when validating code.",
      },
      files: [
        {
          path: "SKILL.md",
          encoding: "base64" as const,
          content: Buffer.from(
            `---\nname: typecheck\ndescription: Run type checks when validating code.\n---\n`,
          ).toString("base64"),
        },
        {
          path: "references/DETAILS.md",
          encoding: "base64" as const,
          content: Buffer.from("details").toString("base64"),
        },
      ],
    };
    expect(integrityForBundle(base)).toBe(
      integrityForBundle({ ...base, files: [...base.files].reverse() }),
    );
  });

  it("rejects non-exact bundle versions", () => {
    expect(() =>
      validateSkillBundle({
        formatVersion: 1,
        id: "example/typecheck",
        version: "^1.0.0",
        metadata: {
          name: "typecheck",
          description: "Run type checks when validating code.",
        },
        files: [
          {
            path: "SKILL.md",
            encoding: "base64",
            content: Buffer.from(
              `---\nname: typecheck\ndescription: Run type checks when validating code.\n---\n`,
            ).toString("base64"),
          },
        ],
      }),
    ).toThrow(/exact semantic version/);
  });

  it("requires HTTPS for non-local registries", () => {
    expect(() =>
      registryUrlFromEnv("AGENTICK_REGISTRY_URL", {
        AGENTICK_REGISTRY_URL: "http://skills.example.test",
      }),
    ).toThrow(/must use https/);
    expect(
      registryUrlFromEnv("AGENTICK_REGISTRY_URL", {
        AGENTICK_REGISTRY_URL: "http://localhost:3000",
      }).origin,
    ).toBe("http://localhost:3000");
  });
});
