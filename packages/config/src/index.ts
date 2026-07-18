import { parse, stringify } from 'yaml';
import { z } from 'zod';

export const DEFAULT_IGNORES = [
  '**/.git/**',
  '**/node_modules/**',
  '**/dist/**',
  '**/build/**',
  '**/coverage/**',
  '**/.next/**',
  '**/.turbo/**',
  'agents/skillib/**',
  'agents/.agentick/**',
] as const;

const pathPattern = z.string().min(1);

const exactSemver = z.string().regex(
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/,
  'Expected an exact semantic version',
);

export const agentickConfigSchema = z.object({
  version: z.literal(1),
  project: z.object({ name: z.string().min(1), root: z.literal('.') }),
  watch: z.object({
    include: z.array(pathPattern).min(1),
    ignore: z.array(pathPattern),
  }),
  agents: z.object({
    protected: z.array(pathPattern),
    writable: z.array(pathPattern),
  }),
  verify: z.object({
    commands: z.array(
      z.object({
        name: z.string().min(1),
        run: z.string().min(1),
        required: z.boolean().default(true),
      }),
    ),
  }),
  runtime: z.object({
    host: z.string().default('127.0.0.1'),
    port: z.number().int().min(1).max(65535).default(4317),
  }),
  registry: z.object({
    urlEnv: z.string().min(1).default('AGENTICK_REGISTRY_URL'),
  }),
  skilllib: z.object({
    directory: z.literal('agents/skillib').default('agents/skillib'),
    requireIntegrity: z.literal(true).default(true),
    executeInstalledScripts: z.literal(false).default(false),
  }),
});

export type AgentickConfig = z.infer<typeof agentickConfigSchema>;

export const skillDeclarationSchema = z.object({
  version: z.literal(1),
  skills: z.array(
    z.object({
      id: z.string().regex(/^[a-z0-9][a-z0-9-]*\/[a-z0-9][a-z0-9-]*$/),
      version: z.string().min(1),
      enabled: z.boolean().default(true),
    }),
  ),
});
export type SkillDeclaration = z.infer<typeof skillDeclarationSchema>;

export const skillLockSchema = z.object({
  lockfileVersion: z.literal(1),
  registry: z.string().url().nullable(),
  skills: z.record(
    z.string(),
    z.object({
      version: exactSemver,
      integrity: z.string().regex(/^sha512-[A-Za-z0-9+/=]+$/),
      resolved: z.string().url(),
    }),
  ),
});
export type SkillLock = z.infer<typeof skillLockSchema>;

export function parseAgentickConfig(source: string): AgentickConfig {
  return agentickConfigSchema.parse(parse(source));
}

export function parseSkillDeclaration(source: string): SkillDeclaration {
  return skillDeclarationSchema.parse(parse(source));
}

export function parseSkillLock(source: string): SkillLock {
  return skillLockSchema.parse(parse(source));
}

export function toYaml(value: unknown): string {
  return stringify(value, { lineWidth: 100 });
}
