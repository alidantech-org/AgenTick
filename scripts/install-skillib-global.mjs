import { execFileSync } from "node:child_process";
import { readdirSync, rmSync, mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const packDirectory = join(root, ".skillib-pack");
const pnpm = process.platform === "win32" ? "pnpm.cmd" : "pnpm";

function run(args) {
  execFileSync(pnpm, args, {
    cwd: root,
    stdio: "inherit",
    env: process.env,
  });
}

rmSync(packDirectory, { recursive: true, force: true });
mkdirSync(packDirectory, { recursive: true });

run(["--filter", "skillib", "build"]);
run([
  "--filter",
  "skillib",
  "pack",
  "--pack-destination",
  packDirectory,
]);

const tarballs = readdirSync(packDirectory)
  .filter((name) => /^skillib-.*\.tgz$/.test(name))
  .sort();

const tarball = tarballs.at(-1);
if (!tarball) {
  throw new Error(`No Skillib tarball was created in ${packDirectory}`);
}

run(["add", "--global", join(packDirectory, tarball)]);

console.log("\nSkillib was installed globally from the packed npm artifact.");
console.log("Run: skillib --help");
