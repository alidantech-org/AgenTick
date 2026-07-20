import Link from "next/link";
import {
  ArrowRight,
  Check,
  GitBranch,
  Library,
  LockKeyhole,
  Radar,
  Search,
  ShieldCheck,
  Sparkles,
  Terminal,
} from "lucide-react";
import { LogoMark } from "@/components/logo";
import { RegistrySearch } from "@/components/registry-search";
import { SkillCard } from "@/components/skill-card";
import { Button } from "@/components/ui/button";
import { searchPublicSkills } from "@/lib/registry/service";

const capabilities = [
  {
    icon: Radar,
    title: "Live repository watching",
    copy: "Observe filesystem changes, protected files, Git state, and verification evidence while AI works.",
  },
  {
    icon: ShieldCheck,
    title: "Project-owned rules",
    copy: "Keep architecture, workflows, templates, patterns, and active work inside one agents/ directory.",
  },
  {
    icon: Library,
    title: "Versioned skill registry",
    copy: "Publish reusable skills under personal or organisation namespaces with immutable versions.",
  },
  {
    icon: Check,
    title: "Evidence-first verification",
    copy: "Record commands, findings, fixes, and completion claims as an auditable history.",
  },
  {
    icon: GitBranch,
    title: "Scope and plan tracking",
    copy: "Compare intended work against the real diff and surface task-scope drift early.",
  },
  {
    icon: LockKeyhole,
    title: "Public and private skills",
    copy: "Share community skills publicly while keeping internal workflows private.",
  },
];

const workflow = [
  [
    "01",
    "Specify",
    "Describe how the repository must be changed and verified.",
  ],
  ["02", "Watch", "Capture file activity and findings while work happens."],
  ["03", "Verify", "Run deterministic checks and preserve their real output."],
  ["04", "Share", "Package reliable workflows as installable skills."],
] as const;

export default async function HomePage() {
  const featured = await searchPublicSkills({ sort: "popular", limit: 3 });

  return (
    <main className="overflow-hidden">
      <section className="relative border-b border-border">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-[size:64px_64px] opacity-25 [mask-image:radial-gradient(circle_at_center,black,transparent_78%)]" />
        <div className="page-shell relative flex min-h-[760px] flex-col items-center justify-center py-24 text-center sm:py-32">
          <div className="mb-8 flex size-24 items-center justify-center rounded-3xl border border-border bg-background sm:size-28">
            <LogoMark size={68} />
          </div>
          <p className="mb-5 font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
            The accountable skill layer for coding AI
          </p>
          <h1 className="max-w-5xl font-display text-5xl font-bold leading-[0.95] tracking-[-0.055em] sm:text-7xl lg:text-[6.5rem]">
            Build with AI.
            <br />
            <span className="text-muted-foreground">Keep the proof.</span>
          </h1>
          <p className="mt-8 max-w-2xl text-lg leading-8 text-muted-foreground sm:text-xl">
            Skillib watches project changes, verifies work against
            repository-owned rules, and turns proven workflows into reusable,
            versioned skills.
          </p>
          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" className="rounded-full px-7">
              <Link href="/signup">
                Get started <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button
              asChild
              variant="secondary"
              size="lg"
              className="rounded-full px-7"
            >
              <Link href="/guides">Read the guides</Link>
            </Button>
          </div>
          <div className="mt-12 flex w-full max-w-xl items-center overflow-hidden rounded-xl border border-border bg-background text-left font-mono text-sm">
            <span className="flex size-12 shrink-0 items-center justify-center border-r border-border text-muted-foreground">
              <Terminal className="size-4" />
            </span>
            <code className="min-w-0 flex-1 truncate px-4 py-3">
              pnpm dlx skillib init
            </code>
            <span className="hidden border-l border-border px-4 py-3 text-xs text-muted-foreground sm:block">
              Copy
            </span>
          </div>
          <div className="mt-8 flex flex-wrap justify-center gap-x-7 gap-y-3 text-sm text-muted-foreground">
            {[
              "Project-local configuration",
              "Live file watching",
              "Immutable skill versions",
            ].map((item) => (
              <span key={item} className="inline-flex items-center gap-2">
                <Check className="size-4 text-foreground" /> {item}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-border">
        <div className="page-shell py-24 sm:py-32">
          <div className="mx-auto max-w-3xl text-center">
            <p className="section-label">What is in Skillib?</p>
            <h2 className="mt-5 font-display text-4xl font-bold tracking-[-0.04em] sm:text-5xl">
              Everything needed to keep AI-assisted work understandable.
            </h2>
            <p className="mt-5 text-lg leading-8 text-muted-foreground">
              One project specification, one live watcher, one verification
              history, and one package-style registry.
            </p>
          </div>
          <div className="mt-16 grid overflow-hidden rounded-2xl border border-border bg-border md:grid-cols-2 lg:grid-cols-3 lg:gap-px">
            {capabilities.map(({ icon: Icon, title, copy }) => (
              <article
                key={title}
                className="group min-h-72 bg-background p-8 transition-colors hover:bg-muted/40"
              >
                <div className="flex size-10 items-center justify-center rounded-lg border border-border bg-card">
                  <Icon className="size-4" />
                </div>
                <h3 className="mt-8 font-display text-xl font-semibold tracking-tight">
                  {title}
                </h3>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">
                  {copy}
                </p>
                <ArrowRight className="mt-8 size-4 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-foreground" />
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-border bg-muted/35">
        <div className="page-shell grid gap-14 py-24 sm:py-32 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <p className="section-label">Live project runtime</p>
            <h2 className="mt-5 font-display text-4xl font-bold tracking-[-0.04em] sm:text-5xl">
              See what changed before the handoff says everything is done.
            </h2>
            <p className="mt-5 text-lg leading-8 text-muted-foreground">
              Skillib records the actual filesystem activity, findings,
              verification runs, and session history behind AI-assisted work.
            </p>
            <Button asChild variant="secondary" className="mt-8 rounded-full">
              <Link href="/guides#watch">Explore watch mode</Link>
            </Button>
          </div>
          <div className="overflow-hidden rounded-2xl border border-border bg-[#0a0a0a] text-white">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <span className="text-xs text-white/50">live session</span>
              <span className="font-mono text-xs text-white/40">
                127.0.0.1:4317
              </span>
            </div>
            <div className="space-y-4 p-6 font-mono text-sm leading-6 sm:p-8">
              <p>
                <span className="text-white/40">$</span> skillib watch
              </p>
              <p className="text-emerald-400">
                ✓ watcher ready · 218 files indexed
              </p>
              <div className="border-l border-white/15 pl-4 text-white/65">
                <p>CHANGE&nbsp;&nbsp;src/modules/payments/service.ts</p>
                <p>CHANGE&nbsp;&nbsp;agents/work/STATUS.md</p>
                <p className="text-amber-300">
                  FINDING&nbsp;protected rule modified
                </p>
                <p className="text-emerald-400">
                  FIXED&nbsp;&nbsp;&nbsp;typecheck and audit passed
                </p>
              </div>
              <p className="text-white/45">
                events appended to agents/.skillib/events.jsonl
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-border">
        <div className="page-shell py-24 sm:py-32">
          <div className="mx-auto max-w-3xl text-center">
            <p className="section-label">Built on a practical workflow</p>
            <h2 className="mt-5 font-display text-4xl font-bold tracking-[-0.04em] sm:text-5xl">
              From repository rules to reusable skills.
            </h2>
          </div>
          <div className="mt-16 grid border-y border-border md:grid-cols-2 lg:grid-cols-4">
            {workflow.map(([number, title, copy], index) => (
              <article
                key={title}
                className={`p-7 lg:min-h-72 ${
                  index > 0
                    ? "border-t border-border md:border-l md:border-t-0"
                    : ""
                } ${index === 2 ? "md:border-l-0 lg:border-l" : ""}`}
              >
                <span className="font-mono text-xs text-muted-foreground">
                  {number}
                </span>
                <h3 className="mt-10 font-display text-2xl font-semibold">
                  {title}
                </h3>
                <p className="mt-4 text-sm leading-7 text-muted-foreground">
                  {copy}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-border bg-foreground text-background">
        <div className="page-shell grid gap-14 py-24 sm:py-32 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-background/50">
              Package-manager discipline
            </p>
            <h2 className="mt-5 font-display text-4xl font-bold tracking-[-0.04em] sm:text-5xl">
              Skills install like dependencies, not copied snippets.
            </h2>
            <p className="mt-5 max-w-xl text-lg leading-8 text-background/65">
              Declare required skills, resolve exact immutable versions, verify
              SHA-512 integrity, and install them into a generated library.
            </p>
            <Link
              href="/guides#skills"
              className="mt-8 inline-flex items-center gap-2 font-semibold"
            >
              Read the skill specification <ArrowRight className="size-4" />
            </Link>
          </div>
          <div className="grid overflow-hidden rounded-2xl border border-background/15 sm:grid-cols-2">
            <pre className="border-b border-background/15 p-6 text-xs leading-7 text-background/75 sm:border-b-0 sm:border-r">
              {`# agents/skills.yml\nversion: 1\nskills:\n  - id: team/backend-review\n    version: ^2.1.0\n    enabled: true`}
            </pre>
            <pre className="p-6 text-xs leading-7 text-background/75">
              {`$ skillib pull\n✓ resolved 2.3.1\n✓ integrity verified\n✓ installed read-only\n\n$ skillib verify\n✓ 8 checks passed`}
            </pre>
          </div>
        </div>
      </section>

      <section className="border-b border-border">
        <div className="page-shell py-24 sm:py-32">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="section-label">Skill registry</p>
              <h2 className="mt-5 font-display text-4xl font-bold tracking-[-0.04em] sm:text-5xl">
                Discover workflows worth repeating.
              </h2>
              <p className="mt-5 text-lg leading-8 text-muted-foreground">
                Search public skills from developers and engineering
                organisations.
              </p>
            </div>
            <div className="w-full max-w-lg">
              <RegistrySearch />
            </div>
          </div>
          <div className="mt-6 flex flex-wrap items-center gap-2 font-mono text-xs text-muted-foreground">
            <Search className="size-3.5" /> Popular:
            {[
              ["nextjs", "Next.js"],
              ["backend", "Backend"],
              ["security", "Security"],
              ["testing", "Testing"],
            ].map(([query, label]) => (
              <Link
                key={query}
                href={`/skills?q=${query}`}
                className="rounded-full border border-border px-3 py-1.5 hover:border-foreground hover:text-foreground"
              >
                {label}
              </Link>
            ))}
          </div>
          {featured.length > 0 ? (
            <div className="skill-grid mt-12">
              {featured.map((skill) => (
                <SkillCard key={skill.id} skill={skill} />
              ))}
            </div>
          ) : (
            <div className="mt-12 rounded-2xl border border-dashed border-border p-12 text-center">
              <Sparkles className="mx-auto size-8" />
              <h3 className="mt-5 font-display text-2xl font-semibold">
                Publish the first trusted workflow.
              </h3>
              <p className="mx-auto mt-3 max-w-md text-muted-foreground">
                Turn a repeatable project practice into a versioned public or
                private skill.
              </p>
              <Button asChild className="mt-6 rounded-full">
                <Link href="/signup">Create an account</Link>
              </Button>
            </div>
          )}
        </div>
      </section>

      <section className="border-b border-border">
        <div className="page-shell py-24 text-center sm:py-32">
          <LogoMark size={54} />
          <h2 className="mx-auto mt-8 max-w-3xl font-display text-4xl font-bold tracking-[-0.04em] sm:text-6xl">
            Let AI move fast. Make it show its work.
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">
            Start with project-local rules, live watching, deterministic
            verification, and a skill library that improves over time.
          </p>
          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" className="rounded-full px-7">
              <Link href="/signup">Start with Skillib</Link>
            </Button>
            <Button
              asChild
              variant="secondary"
              size="lg"
              className="rounded-full px-7"
            >
              <Link href="/skills">Explore skills</Link>
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
