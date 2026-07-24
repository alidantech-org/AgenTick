import Link from "next/link";
import {
  ArrowRight,
  Check,
  CircleAlert,
  GitBranch,
  Library,
  LockKeyhole,
  RefreshCcw,
  Search,
  ShieldCheck,
  Sparkles,
  Terminal,
} from "lucide-react";
import { LogoMark } from "@/components/logo";
import { RegistrySearch } from "@/components/registry-search";
import { SkillCard } from "@/components/skill-card";
import { Button } from "@/components/ui/button";
import { Reveal, RevealStagger } from "@/components/reveal";
import { Tick } from "@/components/tick";
import { WaveDivider } from "@/components/wave-divider";
import { Stamp } from "@/components/stamp";
import { BorderBeam } from "@/components/border-beam";
import { GridPattern } from "@/components/grid-pattern";
import { SyntaxHighlight } from "@/components/syntax-highlight";
import { searchPublicSkills } from "@/lib/registry/service";

const values: {
  icon: React.ComponentType;
  title: string;
  copy: string;
  note?: string;
}[] = [
  {
    icon: CircleAlert,
    title: "Don't let AI quietly destroy your codebase.",
    copy: "Watch protected files, project boundaries, task scope, verification commands, and the evidence behind every completion claim.",
    note: "scope drift detected · blocked before handoff",
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
] as const;

const workflow = [
  [
    "01",
    "Specify",
    "Describe how the repository must be changed and verified.",
  ],
  [
    "Watch",
    "Watch the work",
    "Capture file events, Git state, protected changes, findings, commands, and audit history as coding happens.",
  ],
  [
    "Verify",
    "Verify the result",
    "Run deterministic checks and require evidence before a task is considered complete.",
  ],
  [
    "Share",
    "Share what works",
    "Publish public or private skills under your personal or organisation namespace.",
  ],
] as const;

const guides = [
  [
    "01",
    "Keep control",
    "Don't let AI leave your repository in a mess.",
    "/guides#control",
  ],
  [
    "02",
    "Publish your skills",
    "Don't let valuable prompting expertise disappear.",
    "/guides#skills",
  ],
  [
    "03",
    "Improve productivity",
    "Upskill while you automate.",
    "/guides#productivity",
  ],
  [
    "04",
    "Make tokens count",
    "Keep context stable and verification deterministic.",
    "/guides#tokens",
  ],
] as const;

const heroChecks = [
  "Project-local rules",
  "Immutable skill versions",
  "Evidence-backed audits",
];

const signals = [
  "✓ protected boundary respected",
  "✓ typecheck passed",
  "✓ sha512 integrity verified",
  "✓ audit recorded",
];

const skillManifest = `# agents/skills.yml
version: 1
skills:
  - id: johnte/backend-review
    version: ^2.1.0
    enabled: true`;

const pullOutput = `$ skillib pull
✓ resolved 2.3.1
✓ sha512 integrity verified
✓ installed read-only`;

const auditTerminal = `$ pnpm dlx skillib init
✓ agents/ initialized without touching your source

$ skillib watch
  watching 218 files · dashboard :4317

CHANGE src/modules/payments/service.ts
FINDING · protected boundary crossed
✓ fixed · typecheck · tests · audit recorded`;

export default async function HomePage() {
  const featured = await searchPublicSkills({ sort: "popular", limit: 3 });

  return (
    <main className="overflow-hidden">
      {/* ---------------- HERO ---------------- */}
      <section className="relative overflow-hidden">
        <GridPattern />
        {/* decorative blobs — grayscale only, pure texture, never the focal point */}
        <div
          aria-hidden
          className="pointer-events-none absolute -top-44 -right-36 size-[460px] rounded-full bg-[radial-gradient(circle_at_30%_30%,theme(colors.foreground/6%),transparent_70%)]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-32 -left-20 size-[280px] rounded-full bg-[radial-gradient(circle_at_60%_60%,theme(colors.foreground/5%),transparent_70%)]"
        />

        <div className="page-shell relative grid gap-14 py-20 sm:py-28 lg:grid-cols-[1.05fr_.95fr] lg:items-start">
          <Reveal>
            <div className="mb-6 flex items-center gap-2 font-mono text-xs uppercase tracking-[0.16em] text-muted-foreground">
              <LogoMark size={18} /> Skill library — proof over promises
            </div>
            <h1 className="max-w-3xl font-display text-5xl font-extrabold leading-[1.02] tracking-[-0.045em] sm:text-6xl lg:text-7xl">
              Build with AI.
              <br />
              <span className="text-muted-foreground">Keep control.</span>
            </h1>
            <p className="mt-7 max-w-xl text-lg leading-relaxed text-muted-foreground">
              Skillib watches every change, checks the work against your
              project's own rules, and turns hard-won prompting knowledge into
              reusable, versioned skills.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button
                asChild
                size="lg"
                variant="accent"
                className="rounded-full shadow-none transition-transform hover:-translate-y-0.5"
              >
                <Link href="/signup">
                  Start with Skillib <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button
                asChild
                variant="secondary"
                size="lg"
                className="rounded-full border border-border bg-transparent shadow-none transition-transform hover:-translate-y-0.5 hover:border-foreground"
              >
                <Link href="/guides#cli">Read the quickstart</Link>
              </Button>
            </div>

            <RevealStagger
              className="mt-8 flex flex-wrap gap-x-6 gap-y-3 font-mono text-xs text-muted-foreground"
              gapMs={90}
            >
              {heroChecks.map((item) => (
                <span
                  key={item}
                  className="group/reveal flex items-center gap-2"
                >
                  <Tick className="size-4 text-foreground" /> {item}
                </span>
              ))}
            </RevealStagger>
          </Reveal>

          <Reveal className="relative">
            {/* Stamp — the same seal used later in the empty registry state */}
            <Stamp
              label="EVIDENCE-BACKED"
              className="absolute -top-4 right-8 z-10 border"
            />

            <BorderBeam
              className="group transition-transform duration-500 ease-out hover:-translate-y-1 hover:rotate-[-0.3deg]"
              contentClassName="overflow-hidden bg-ink text-ink-foreground"
            >
              <div className="flex items-center justify-between border-b border-ink-foreground/15 px-5 py-3">
                <div className="flex gap-1.5">
                  {[0, 1, 2].map((dot) => (
                    <span
                      key={dot}
                      className="size-2 rounded-full bg-ink-foreground/25"
                    />
                  ))}
                </div>
                <span className="font-mono text-xs text-ink-foreground/50">
                  skillib — ~/your-project
                </span>
              </div>
              <SyntaxHighlight
                code={auditTerminal}
                language="shell"
                theme="dark"
                showLanguage={false}
                className="px-5 py-6 sm:px-7 border-none rounded-none text-sm sm:text-base"
              />
            </BorderBeam>
          </Reveal>
        </div>

        {/* Static signal strip — replaces any marquee/ticker, no motion, hairline-divided */}
        <div className="border-t border-border">
          <div className="page-shell grid grid-cols-2 sm:flex sm:flex-wrap">
            {signals.map((item, i) => (
              <span
                key={item}
                className={`whitespace-nowrap px-5 py-3.5 font-mono text-xs text-muted-foreground ${
                  i === 0
                    ? ""
                    : "border-t border-border sm:border-t-0 sm:border-l"
                }`}
              >
                {item}
              </span>
            ))}
          </div>
        </div>
        <WaveDivider fillClassName="fill-muted" />
      </section>

      {/* ---------------- REGISTRY SEARCH ---------------- */}
      <section className="border-b border-border bg-muted/45">
        <div className="page-shell py-20">
          <Reveal className="max-w-2xl">
            <span className="section-label">Skill registry</span>
            <h2 className="mt-4 font-display text-3xl font-bold tracking-tight sm:text-4xl">
              Find the workflow your AI is missing.
            </h2>
            <p className="mt-4 text-muted-foreground">
              Search public skills from individual developers and engineering
              organisations.
            </p>
          </Reveal>
          <Reveal className="mt-8 max-w-2xl">
            <RegistrySearch />
          </Reveal>
          <div className="mt-5 flex flex-wrap items-center gap-2 font-mono text-xs text-muted-foreground">
            <Search className="size-3.5" /> Popular:
            {[
              ["nextjs", "Next.js"],
              ["backend", "Backend review"],
              ["security", "Security"],
              ["testing", "Testing"],
            ].map(([query, label]) => (
              <Link
                key={query}
                href={`/skills?q=${query}`}
                className="rounded-full border border-border bg-background px-3 py-1.5 transition-colors hover:border-foreground hover:text-foreground"
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- WHY SKILLIB — joined hairline grid, not floating cards ---------------- */}
      <section className="border-b border-border">
        <div className="page-shell py-20">
          <Reveal className="max-w-2xl">
            <span className="section-label">Why Skillib</span>
            <h2 className="mt-4 font-display text-3xl font-bold tracking-tight sm:text-4xl">
              AI speed without the cleanup bill.
            </h2>
            <p className="mt-5 text-lg leading-8 text-muted-foreground">
              One project specification, one live watcher, one verification
              history, and one package-style registry.
            </p>
          </Reveal>
          <RevealStagger className="mt-12 grid overflow-hidden rounded-2xl border border-border bg-border md:grid-cols-2 md:gap-px">
            {values.map(({ icon: Icon, title, copy, note }) => (
              <article
                key={title}
                className="group flex min-h-72 flex-col bg-background p-8 transition-colors hover:bg-muted/35"
              >
                <div className="flex size-9 items-center justify-center rounded-md border border-foreground transition-transform duration-300 ease-out group-hover:-rotate-[8deg] group-hover:scale-105">
                  {/* <Icon className="size-4" /> */}
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
          </RevealStagger>
        </div>
      </section>

      {/* ---------------- WORKFLOW ---------------- */}
      <section>
        <div className="page-shell py-20">
          <Reveal className="max-w-2xl">
            <span className="section-label">One accountable workflow</span>
            <h2 className="mt-4 font-display text-3xl font-bold tracking-tight sm:text-4xl">
              Rules, runtime, registry.
            </h2>
            <p className="mt-4 text-muted-foreground">
              Skillib connects the project specification, live watcher, and
              shared skill ecosystem without putting extra configuration in your
              source root.
            </p>
          </Reveal>
          <RevealStagger
            className="mt-12 grid gap-8 lg:grid-cols-4"
            gapMs={100}
          >
            {workflow.map(([label, title, copy], index) => (
              <article key={label} className="border-t border-border pt-5">
                <div className="flex items-center gap-3 font-mono text-xs text-muted-foreground">
                  <span className="flex size-7 items-center justify-center rounded-full border border-foreground text-foreground">
                    {index + 1}
                  </span>
                  {label}
                </div>
                <h3 className="mt-5 font-display text-lg font-bold">{title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {copy}
                </p>
              </article>
            ))}
          </RevealStagger>
        </div>
        <WaveDivider fillClassName="fill-surface" />
      </section>

      {/* ---------------- PACKAGE-MANAGER DISCIPLINE ---------------- */}
      <section className="bg-surface text-foreground">
        <div className="page-shell grid gap-10 py-20 lg:grid-cols-2">
          <Reveal>
            <span className="font-mono text-xs uppercase tracking-[0.16em] text-muted-foreground">
              Package-manager discipline
            </span>
            <h2 className="mt-5 font-display text-4xl font-bold tracking-[-0.04em] sm:text-5xl">
              Skills install like dependencies, not copied snippets.
            </h2>
            <p className="mt-4 max-w-xl text-muted-foreground">
              Declare what your project needs, lock exact immutable versions,
              verify SHA-512 integrity, and keep installed skills in a generated
              read-only library.
            </p>
            <Link
              href="/guides#skills"
              className="mt-6 inline-flex font-semibold underline decoration-border underline-offset-4"
            >
              Read the skill specification <ArrowRight className="size-4" />
            </Link>
          </Reveal>
          <Reveal className="grid overflow-hidden rounded-2xl border border-border sm:grid-cols-2">
            <SyntaxHighlight
              code={skillManifest}
              language="yaml"
              className="rounded-none border-0 border-b sm:border-r sm:border-b-0"
            />
            <SyntaxHighlight
              code={pullOutput}
              language="console"
              className="rounded-none border-0"
            />
          </Reveal>
        </div>
        <WaveDivider fillClassName="fill-background" />
      </section>

      {/* ---------------- FROM THE REGISTRY ---------------- */}
      <section>
        <div className="page-shell py-20">
          <Reveal className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <span className="section-label">From the registry</span>
              <h2 className="mt-4 font-display text-3xl font-bold tracking-tight sm:text-4xl">
                Skills worth reusing.
              </h2>
              <p className="mt-5 text-lg leading-8 text-muted-foreground">
                Search public skills from developers and engineering
                organisations.
              </p>
            </div>
            <div className="w-full max-w-lg">
              <RegistrySearch />
            </div>
            <Link
              href="/skills"
              className="font-semibold underline decoration-border underline-offset-4"
            >
              Explore all skills →
            </Link>
          </Reveal>
          {featured.length > 0 ? (
            <RevealStagger className="skill-grid mt-10">
              {featured.map((skill) => (
                <SkillCard key={skill.id} skill={skill} />
              ))}
            </RevealStagger>
          ) : (
            <Reveal className="mt-10 flex flex-col items-center rounded-2xl border border-dashed border-border p-12 text-center">
              <Stamp label="AWAITING FIRST SKILL" />
              <h3 className="mt-5 font-display text-2xl font-bold">
                The registry is ready for its first skills.
              </h3>
              <p className="mx-auto mt-3 max-w-md text-muted-foreground">
                Turn a repeatable project practice into a versioned public or
                private skill.
              </p>
              <Button
                asChild
                className="mt-6 rounded-full shadow-none transition-transform hover:-translate-y-0.5"
              >
                <Link href="/signup">Publish the first skill</Link>
              </Button>
            </Reveal>
          )}
        </div>
        <WaveDivider fillClassName="fill-muted" />
      </section>

      {/* ---------------- GUIDES ---------------- */}
      <section className="bg-muted/45">
        <div className="page-shell py-20">
          <Reveal className="max-w-2xl">
            <span className="section-label">Guides</span>
            <h2 className="mt-4 font-display text-3xl font-bold tracking-tight sm:text-4xl">
              Build a better working relationship with coding AI.
            </h2>
            <p className="mt-4 text-muted-foreground">
              Practical guidance for protecting project logic, turning expertise
              into reusable skills, and getting more verified value from every
              token.
            </p>
          </Reveal>
          <RevealStagger className="mt-10 grid overflow-hidden rounded-2xl border border-border bg-border md:grid-cols-2 md:gap-px">
            {guides.map(([number, label, title, href]) => (
              <Link
                key={number}
                href={href}
                className="group flex items-center justify-between gap-6 bg-background p-6 transition-colors hover:bg-muted/40"
              >
                <div>
                  <span className="font-mono text-xs text-muted-foreground">
                    {number} · {label}
                  </span>
                  <h3 className="mt-2 font-display text-lg font-bold">
                    {title}
                  </h3>
                </div>
                <ArrowRight className="size-4 shrink-0 transition-transform group-hover:translate-x-1" />
              </Link>
            ))}
            <Link
              href="/guides#cli"
              className="group flex items-center justify-between gap-6 bg-primary/10 p-6 text-foreground transition-colors hover:bg-primary/15 md:col-span-2"
            >
              <div>
                <span className="font-mono text-xs text-muted-foreground">
                  05 · CLI quickstart
                </span>
                <h3 className="mt-2 font-display text-lg font-bold">
                  Init, watch, verify, publish.
                </h3>
              </div>
              <ArrowRight className="size-4 shrink-0 transition-transform group-hover:translate-x-1" />
            </Link>
          </RevealStagger>
        </div>
        <WaveDivider fillClassName="fill-surface" />
      </section>

      {/* ---------------- FINAL CTA ---------------- */}
      <section className="bg-surface text-foreground">
        <Reveal className="page-shell py-24 text-center">
          <span className="font-mono text-xs uppercase tracking-[0.16em] text-muted-foreground">
            Start accountable
          </span>
          <h2 className="mx-auto mt-5 max-w-2xl font-display text-4xl font-extrabold tracking-tight sm:text-5xl">
            Let AI move fast. Make it show its work.
          </h2>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button
              asChild
              size="lg"
              variant="accent"
              className="rounded-full shadow-none transition-transform hover:-translate-y-0.5"
            >
              <Link href="/signup">Create an account</Link>
            </Button>
            <Button
              asChild
              variant="secondary"
              size="lg"
              className="rounded-full border border-border bg-background/35 text-foreground shadow-none transition-transform hover:-translate-y-0.5 hover:bg-muted"
            >
              <Link href="/skills">Explore skills</Link>
            </Button>
          </div>
        </Reveal>
      </section>
    </main>
  );
}
