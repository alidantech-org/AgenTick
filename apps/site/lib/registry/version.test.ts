import { describe, expect, it } from "vitest";
import { compareVersions, versionMatches } from "./version";

describe("registry versions", () => {
  it("orders semantic versions, build metadata, and prereleases", () => {
    expect(compareVersions("2.0.0", "1.9.9")).toBeGreaterThan(0);
    expect(compareVersions("1.0.0", "1.0.0-beta.1")).toBeGreaterThan(0);
    expect(compareVersions("1.0.0-beta.10", "1.0.0-beta.2")).toBeGreaterThan(0);
    expect(compareVersions("1.0.0+build.2", "1.0.0+build.1")).toBe(0);
  });

  it("matches exact, caret, tilde, and latest requests", () => {
    expect(versionMatches("2.4.0", "latest")).toBe(true);
    expect(versionMatches("2.4.0", "^2.1.0")).toBe(true);
    expect(versionMatches("3.0.0", "^2.1.0")).toBe(false);
    expect(versionMatches("0.2.9", "^0.2.3")).toBe(true);
    expect(versionMatches("0.3.0", "^0.2.3")).toBe(false);
    expect(versionMatches("0.0.4", "^0.0.3")).toBe(false);
    expect(versionMatches("2.1.8", "~2.1.0")).toBe(true);
    expect(versionMatches("2.2.0", "~2.1.0")).toBe(false);
    expect(versionMatches("2.1.0", "2.1.0")).toBe(true);
  });
});
