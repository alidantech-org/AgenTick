import { execFileSync } from "node:child_process";
import { mkdirSync, readdirSync, rmSync } from "node:fs";
import { delimiter, dirname, isAbsolute, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const packDirectory = join(root, ".skillib-pack");
const isWindows = process.platform === "win32";

function runExecutable(command, args, options = {}) {
  return execFileSync(command, args, {
    cwd: root,
    env: process.env,
    ...options,
  });
}

function resolvePnpmInvocation(args) {
  const npmExecPath = process.env.npm_execpath;

  if (npmExecPath && isAbsolute(npmExecPath)) {
    return {
      command: process.execPath,
      args: [npmExecPath, ...args],
    };
  }

  return {
    command: isWindows ? "pnpm.cmd" : "pnpm",
    args,
  };
}

function runPnpm(args, options = {}) {
  const invocation = resolvePnpmInvocation(args);
  return runExecutable(invocation.command, invocation.args, options);
}

function capturePnpm(args) {
  return String(
    runPnpm(["--silent", ...args], { encoding: "utf8" }),
  ).trim();
}

function parseGlobalBin(output) {
  const candidates = output
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !line.startsWith("[WARN]"));

  const globalBin = candidates.findLast((line) => isAbsolute(line));
  if (!globalBin) {
    throw new Error(
      `Could not determine pnpm global bin directory from:\n${output}`,
    );
  }
  return globalBin;
}

function verifyInstalledCli(executable) {
  if (!isWindows) {
    runExecutable(executable, ["--help"], { stdio: "inherit" });
    return;
  }

  const shell = process.env.ComSpec || "cmd.exe";
  const command = `call "${executable.replaceAll('"', '""')}" --help`;
  runExecutable(shell, ["/d", "/c", command], { stdio: "inherit" });
}

rmSync(packDirectory, { recursive: true, force: true });
mkdirSync(packDirectory, { recursive: true });

runPnpm(["--filter", "skillib", "build"], { stdio: "inherit" });
runPnpm(
  ["--filter", "skillib", "pack", "--pack-destination", packDirectory],
  { stdio: "inherit" },
);

const tarballs = readdirSync(packDirectory)
  .filter((name) => /^skillib-.*\.tgz$/.test(name))
  .sort();

const tarball = tarballs.at(-1);
if (!tarball) {
  throw new Error(`No Skillib tarball was created in ${packDirectory}`);
}

runPnpm(["add", "--global", join(packDirectory, tarball)], {
  stdio: "inherit",
});

const globalBin = parseGlobalBin(capturePnpm(["bin", "--global"]));
const executable = join(globalBin, isWindows ? "skillib.cmd" : "skillib");

verifyInstalledCli(executable);

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
