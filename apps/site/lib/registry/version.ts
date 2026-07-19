interface ParsedVersion {
  major: number;
  minor: number;
  patch: number;
  prerelease: string[];
}

export function parseVersion(value: string): ParsedVersion | null {
  const match =
    /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/.exec(
      value,
    );
  if (!match) return null;
  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
    prerelease: match[4]?.split(".") ?? [],
  };
}

function comparePrerelease(left: string[], right: string[]): number {
  if (left.length === 0 && right.length === 0) return 0;
  if (left.length === 0) return 1;
  if (right.length === 0) return -1;
  const length = Math.max(left.length, right.length);
  for (let index = 0; index < length; index += 1) {
    const a = left[index];
    const b = right[index];
    if (a === undefined) return -1;
    if (b === undefined) return 1;
    if (a === b) continue;
    const aNumeric = /^\d+$/.test(a);
    const bNumeric = /^\d+$/.test(b);
    if (aNumeric && bNumeric) return Number(a) - Number(b);
    if (aNumeric) return -1;
    if (bNumeric) return 1;
    return a.localeCompare(b);
  }
  return 0;
}

export function compareVersions(left: string, right: string): number {
  const a = parseVersion(left);
  const b = parseVersion(right);
  if (!a || !b) return left.localeCompare(right);
  if (a.major !== b.major) return a.major - b.major;
  if (a.minor !== b.minor) return a.minor - b.minor;
  if (a.patch !== b.patch) return a.patch - b.patch;
  return comparePrerelease(a.prerelease, b.prerelease);
}

function matchesCaret(version: string, baseValue: string): boolean {
  const base = parseVersion(baseValue);
  const candidate = parseVersion(version);
  if (!base || !candidate || compareVersions(version, baseValue) < 0)
    return false;
  if (base.major > 0) return candidate.major === base.major;
  if (base.minor > 0) {
    return candidate.major === 0 && candidate.minor === base.minor;
  }
  return (
    candidate.major === 0 &&
    candidate.minor === 0 &&
    candidate.patch === base.patch
  );
}

export function versionMatches(version: string, request: string): boolean {
  if (!request || request === "latest" || request === "*") return true;
  if (request.startsWith("^")) return matchesCaret(version, request.slice(1));
  if (request.startsWith("~")) {
    const baseValue = request.slice(1);
    const base = parseVersion(baseValue);
    const candidate = parseVersion(version);
    return Boolean(
      base &&
        candidate &&
        candidate.major === base.major &&
        candidate.minor === base.minor &&
        compareVersions(version, baseValue) >= 0,
    );
  }
  return version === request;
}
