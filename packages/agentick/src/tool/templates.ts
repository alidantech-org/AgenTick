import { DEFAULT_IGNORES, toYaml } from "@alidantech/agentick-config";

export function projectTemplates(projectName: string): Record<string, string> {
  return {
    "agentick.yml": toYaml({
      version: 1,
      project: { name: projectName, root: "." },
      watch: { include: ["**/*"], ignore: [...DEFAULT_IGNORES] },
      agents: {
        protected: [
          "agents/agentick.yml",
          "agents/AGENTS.md",
          "agents/README.md",
          "agents/INSTRUCTIONS.md",
          "agents/rules/**",
          "agents/architecture/**",
          "agents/workflows/**",
          "agents/patterns/**",
          "agents/templates/**",
          "agents/skills/**",
          "agents/skills.yml",
          "agents/skills.lock.yml",
        ],
        writable: ["agents/work/**"],
      },
      verify: { commands: [] },
      runtime: { host: "127.0.0.1", port: 4317 },
      registry: { urlEnv: "AGENTICK_REGISTRY_URL" },
      skilllib: {
        directory: "agents/skillib",
        requireIntegrity: true,
        executeInstalledScripts: false,
      },
    }),
    "skills.yml": toYaml({ version: 1, skills: [] }),
    "skills.lock.yml": toYaml({
      lockfileVersion: 1,
      registry: null,
      skills: {},
    }),
    "AGENTS.md": `# Project Agent Entry Point

This file and the complete project-local AI specification live inside \`agents/\`. No root \`AGENTS.md\` is required.

Before changing project code, read:

1. \`INSTRUCTIONS.md\`
2. \`rules/\`
3. \`architecture/\`
4. the relevant workflows, patterns, templates, and skills
5. \`work/TASKS.md\` and \`work/PLAN.md\`

AgenTick may monitor protected files, project changes, verification evidence, and completion claims.
`,
    "README.md": `# Project AI Guide

Everything in this directory applies only to this repository. AI must read \`INSTRUCTIONS.md\`, project rules, architecture, workflows, and the active work specification before changing code.

AgenTick watches this directory and project source changes. Protected files may not be modified during normal implementation work.
`,
    "INSTRUCTIONS.md": `# AI Instructions

1. Read this project-local \`agents/\` directory before changing code.
2. Do not require or create a root \`AGENTS.md\`.
3. Treat rules, architecture, patterns, templates, skills, configuration, and lock files as read-only unless a human explicitly authorizes a governance task.
4. Update only the active work records and source files allowed by the task.
5. AgenTick may monitor file changes, validation evidence, protected files, and completion claims in real time.
6. Respond to findings by fixing them or recording a precise evidence-backed dispute.
`,
    "rules/RULES.md": `# Project Rules

Document non-negotiable project-specific constraints here.
`,
    "architecture/ARCHITECTURE.md": `# Project Architecture

Document module boundaries, dependency direction, domain invariants, and consistency requirements here.
`,
    "architecture/STRUCTURE.md": `# Project Structure

Document approved file and folder placement here.
`,
    "workflows/DEVELOPMENT.md": `# Development Workflow

inspect → plan → implement → verify → audit → handoff
`,
    "workflows/AUDIT.md": `# Audit Workflow

Findings are fixed, disputed with evidence, blocked, or explicitly waived by a human.
`,
    "patterns/README.md": `# Project Patterns

Add approved implementation patterns for this repository.
`,
    "templates/README.md": `# Project Templates

Add copyable project-specific code and work templates.
`,
    "skills/README.md": `# Project-owned Skills

Local skill sources may live here. Registry-installed skills live in the generated read-only \`../skillib/\` directory.
`,
    "work/TASKS.md": `# Active Tasks

No active tasks.
`,
    "work/PLAN.md": `# Active Plan

No active plan.
`,
    "work/STATUS.md": `# Work Status

State: idle
`,
    "work/HANDOFF.md": `# Handoff

No active handoff.
`,
    "work/AUDIT.md": `# Audit

No active audit.
`,
    "work/history/.gitkeep": "",
  };
}
