import { execFile } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import { afterEach, describe, expect, it } from "vitest";
import { initializeProject } from "./initialize.js";
import { watchProject, type WatchRuntime } from "./watch.js";

const exec = promisify(execFile);
const roots: string[] = [];
const runtimes: WatchRuntime[] = [];

async function eventually<T>(read: () => Promise<T | undefined>): Promise<T> {
  const deadline = Date.now() + 5_000;
  while (Date.now() < deadline) {
    const value = await read();
    if (value !== undefined) return value;
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  throw new Error("Timed out waiting for filesystem event");
}

afterEach(async () => {
  await Promise.all(runtimes.splice(0).map((runtime) => runtime.close()));
  await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});

describe("watchProject", () => {
  it("records a real file change from an included path", async () => {
    const root = await mkdtemp(join(tmpdir(), "skillib-watch-"));
    roots.push(root);
    await exec("git", ["init"], { cwd: root });
    await initializeProject(root);
    await writeFile(join(root, "README.md"), "before\n", "utf8");

    const runtime = await watchProject(root, 0);
    runtimes.push(runtime);
    await writeFile(join(root, "README.md"), "after\n", "utf8");

    const event = await eventually(async () => {
      const source = await readFile(
        join(root, "agents", ".skillib", "events.jsonl"),
        "utf8",
      );
      return source
        .trim()
        .split("\n")
        .map((line) => JSON.parse(line) as { type: string; path?: string })
        .find(
          (candidate) =>
            candidate.type === "file.changed" && candidate.path === "README.md",
        );
    });

    expect(event).toMatchObject({ type: "file.changed", path: "README.md" });
  });
});
