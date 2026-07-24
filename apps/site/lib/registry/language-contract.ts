export interface SkillibIr {
  schema: "skillib.ir/v1alpha1";
  language_version: string;
  identity: string;
  version: string | null;
  description: string;
  dependencies: string[];
  permissions: string[];
  [key: string]: unknown;
}

export interface LanguagePublishRequest {
  package: string;
  source: string;
  extension: "sl" | "skillib";
  language_version: string;
  ir: SkillibIr;
  source_hash: string;
  ir_hash: string;
  compiler_version: string;
  dependencies: string[];
  permissions: string[];
  archive_base64: string;
  integrity: string;
  visibility: "public" | "private";
}

export interface SkillibArchive {
  format: number;
  extension: "sl" | "skillib";
  source: string;
  ir: SkillibIr;
  source_hash: string;
  ir_hash: string;
}

function stringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

export function parseLanguagePublishRequest(value: unknown): LanguagePublishRequest {
  if (!value || typeof value !== "object") throw new Error("Invalid publish payload");
  const input = value as Record<string, unknown>;
  const extension = input.extension;
  const visibility = input.visibility;
  const ir = input.ir as SkillibIr | undefined;
  if (extension !== "sl" && extension !== "skillib") throw new Error("Extension must be sl or skillib");
  if (visibility !== "public" && visibility !== "private") throw new Error("Invalid visibility");
  if (!ir || ir.schema !== "skillib.ir/v1alpha1") throw new Error("Unsupported Skillib IR schema");
  const fields = ["package", "source", "language_version", "source_hash", "ir_hash", "compiler_version", "archive_base64", "integrity"] as const;
  for (const field of fields) if (typeof input[field] !== "string" || !input[field]) throw new Error(`${field} is required`);
  if (!stringArray(input.dependencies) || !stringArray(input.permissions)) throw new Error("Invalid dependencies or permissions");
  const request = input as unknown as LanguagePublishRequest;
  if (request.package !== ir.identity || request.language_version !== ir.language_version) throw new Error("Source metadata does not match compiled IR");
  if (request.dependencies.join("\0") !== ir.dependencies.join("\0") || request.permissions.join("\0") !== ir.permissions.join("\0")) throw new Error("Compiled dependency or permission metadata differs");
  validateArchive(request);
  return request;
}

function validateArchive(request: LanguagePublishRequest): void {
  let archive: SkillibArchive;
  try {
    archive = JSON.parse(Buffer.from(request.archive_base64, "base64").toString("utf8")) as SkillibArchive;
  } catch {
    throw new Error("Invalid Skillib package archive");
  }
  if (archive.format !== 1 || archive.extension !== request.extension || archive.source !== request.source) throw new Error("Archive source does not match publication payload");
  if (archive.source_hash !== request.source_hash || archive.ir_hash !== request.ir_hash) throw new Error("Archive hashes do not match publication payload");
  if (JSON.stringify(archive.ir) !== JSON.stringify(request.ir)) throw new Error("Archive IR does not match publication payload");
  if (!request.integrity.startsWith("blake3:")) throw new Error("Unsupported archive integrity algorithm");
}
