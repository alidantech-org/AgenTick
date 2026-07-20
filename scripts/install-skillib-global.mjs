import { execFileSync } from "node:child_process";
import { mkdirSync, readdirSync, rmSync } from "node:fs";
import { delimiter, dirname, join, resolve } from "node:path";
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

function capture(args) {
  return execFileSync(pnpm, args, {
    cwd: root,
    encoding: "utf8",
    env: process.env,
  }).trim();
}

rmSync(packDirectory, { recursive: true, force: true });
mkdirSync(packDirectory, { recursive: true });

run(["--filter", "skillib", "build"]);
run(["--filter", "skillib", "pack", "--pack-destination", packDirectory]);

const tarballs = readdirSync(packDirectory)
  .filter((name) => /^skillib-.*\.tgz$/.test(name))
  .sort();

const tarball = tarballs.at(-1);
if (!tarball) {
  throw new Error(`No Skillib tarball was created in ${packDirectory}`);
}

run(["add", "--global", join(packDirectory, tarball)]);

const globalBin = capture(["bin", "--global"]);
const executable = join(
  globalBin,
  process.platform === "win32" ? "skillib.cmd" : "skillib",
);

execFileSync(executable, ["--help"], {
  cwd: root,
  stdio: "inherit",
  env: process.env,
});

const normalizedBin = resolve(globalBin).toLowerCase();
const pathEntries = (process.env.PATH ?? "")
  .split(delimiter)
  .filter(Boolean)
  .map((entry) => resolve(entry).toLowerCase());

console.log(
  "\nSkillib was installed and verified from the packed npm artifact.",
);
console.log(`Global executable directory: ${globalBin}`);

if (!pathEntries.includes(normalizedBin)) {
  console.log("Add that directory to PATH, then reopen your terminal.");
} else {
  console.log("Run: skillib --help");
}
