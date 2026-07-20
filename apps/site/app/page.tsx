import Link from "next/link";
import {
  ArrowRight,
  Check,
  CircleAlert,
  RefreshCcw,
  Search,
  Sigma,
  TextQuote,
} from "lucide-react";
import { LogoMark } from "@/components/logo";
import { RegistrySearch } from "@/components/registry-search";
import { SkillCard } from "@/components/skill-card";
import { Button } from "@/components/ui/button";
import { searchPublicSkills } from "@/lib/registry/service";

const values = [
  {
    icon: CircleAlert,
    title: "Don’t let AI quietly destroy your codebase.",
    copy: "Watch protected files, project boundaries, task scope, verification commands, and the evidence behind every completion claim.",
    note: "scope drift detected · blocked before handoff",
  },
  {
    icon: TextQuote,
    title: "Stop leaving your best prompts in chat history.",
    copy: "Package repeatable expertise as Agent Skills, publish immutable versions, and pull them into any project with integrity checks.",
  },
  {
    icon: RefreshCcw,
    title: "Become genuinely better at coding with AI.",
    copy: "Turn audits, patterns, and project rules into a feedback loop that improves both developer judgment and agent output.",
  },
  {
    icon: Sigma,
    title: "Make every token produce useful progress.",
    copy: "Less repeated context, fewer speculative rewrites, clearer next steps, and verifiable work that survives beyond one conversation.",
  },
];

const workflow = [
  [
    "Specify",
    "Describe the project",
    "Keep architecture, rules, patterns, templates, and active work entirely inside agents/.",
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
    "Don’t let AI leave your repository in a mess.",
    "/guides#control",
  ],
  [
    "02",
    "Publish your skills",
    "Don’t let valuable prompting expertise disappear.",
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

export default async function HomePage() {
  const featured = await searchPublicSkills({ sort: "popular", limit: 3 });

  return (
    <main className="overflow-hidden">
      <section className="border-b border-border">
        <div className="page-shell grid gap-14 py-20 sm:py-28 lg:grid-cols-[1.05fr_.95fr] lg:items-start">
          <div>
            <div className="mb-6 flex items-center gap-2 font-mono text-xs uppercase tracking-[0.16em] text-muted-foreground">
              <LogoMark size={18} /> Agent + tick — proof over promises
            </div>
            <h1 className="max-w-3xl font-display text-5xl font-extrabold leading-[1.02] tracking-[-0.045em] sm:text-6xl lg:text-7xl">
              Build with AI.
              <br />
              <span className="text-muted-foreground">Keep control.</span>
            </h1>
            <p className="mt-7 max-w-xl text-lg leading-relaxed text-muted-foreground">
              AgenTick watches every change, checks the work against your
              project’s own rules, and turns hard-won prompting knowledge into
              reusable, versioned skills.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/signup">
                  Start with AgenTick <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild variant="secondary" size="lg">
                <Link href="/guides#cli">Read the quickstart</Link>
              </Button>
            </div>
            <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-3 font-mono text-xs text-muted-foreground">
              {[
                "Project-local rules",
                "Immutable skill versions",
                "Evidence-backed audits",
              ].map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <Check className="size-4 text-foreground" /> {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="overflow-hidden rounded-[1.75rem] border border-border bg-primary text-primary-foreground">
            <div className="flex items-center justify-between border-b border-primary-foreground/15 px-5 py-3">
              <div className="flex gap-1.5">
                {[0, 1, 2].map((dot) => (
                  <span
                    key={dot}
                    className="size-2 rounded-full bg-primary-foreground/25"
                  />
                ))}
              </div>
              <span className="font-mono text-xs text-primary-foreground/50">
                agentick — ~/your-project
              </span>
            </div>
            <div className="space-y-1 px-5 py-6 font-mono text-[13px] leading-7 text-primary-foreground/75 sm:px-7">
              <p>
                <span className="text-primary-foreground/40">$</span>{" "}
                <span className="text-primary-foreground">
                  pnpm dlx agentick init
                </span>
              </p>
              <p className="text-primary-foreground">
                ✓ agents/ initialized without touching your source
              </p>
              <p>&nbsp;</p>
              <p>
                <span className="text-primary-foreground/40">$</span>{" "}
                <span className="text-primary-foreground">agentick watch</span>
              </p>
              <p className="pl-4 text-primary-foreground/45">
                watching 218 files · dashboard :4317
              </p>
              <p>&nbsp;</p>
              <p>
                <span className="text-primary-foreground/45">CHANGE</span>{" "}
                <span className="font-semibold text-primary-foreground">
                  src/modules/payments/service.ts
                </span>
              </p>
              <p className="inline-flex rounded-md border border-primary-foreground/15 bg-primary-foreground/10 px-2 text-primary-foreground">
                FINDING · protected boundary crossed
              </p>
              <p className="text-primary-foreground">
                ✓ fixed · typecheck · tests · audit recorded
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-border bg-muted/45">
        <div className="page-shell py-20">
          <div className="max-w-2xl">
            <span className="section-label">Skill registry</span>
            <h2 className="mt-4 font-display text-3xl font-bold tracking-tight sm:text-4xl">
              Find the workflow your AI is missing.
            </h2>
            <p className="mt-4 text-muted-foreground">
              Search public skills from individual developers and engineering
              organisations.
            </p>
          </div>
          <div className="mt-8 max-w-2xl">
            <RegistrySearch />
          </div>
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
                className="rounded-full border border-border bg-background px-3 py-1.5 hover:border-foreground hover:text-foreground"
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-border">
        <div className="page-shell py-20">
          <div className="max-w-2xl">
            <span className="section-label">Why AgenTick</span>
            <h2 className="mt-4 font-display text-3xl font-bold tracking-tight sm:text-4xl">
              AI speed without the cleanup bill.
            </h2>
            <p className="mt-4 text-muted-foreground">
              Move quickly without letting context drift, silent shortcuts, or
              invented completion claims leave your repository in a mess.
            </p>
          </div>
          <div className="mt-12 grid overflow-hidden rounded-2xl border border-border bg-border md:grid-cols-2 md:gap-px">
            {values.map(({ icon: Icon, title, copy, note }) => (
              <article
                key={title}
                className="flex min-h-72 flex-col bg-background p-8 transition-colors hover:bg-muted/35"
              >
                <div className="flex size-9 items-center justify-center rounded-md border border-foreground">
                  <Icon className="size-4" />
                </div>
                <h3 className="mt-6 font-display text-xl font-bold tracking-tight">
                  {title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {copy}
                </p>
                {note && (
                  <code className="mt-auto w-fit rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
                    {note}
                  </code>
                )}
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-border">
        <div className="page-shell py-20">
          <div className="max-w-2xl">
            <span className="section-label">One accountable workflow</span>
            <h2 className="mt-4 font-display text-3xl font-bold tracking-tight sm:text-4xl">
              Rules, runtime, registry.
            </h2>
            <p className="mt-4 text-muted-foreground">
              AgenTick connects the project specification, live watcher, and
              shared skill ecosystem without putting extra configuration in your
              source root.
            </p>
          </div>
          <div className="mt-12 grid gap-8 lg:grid-cols-4">
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
          </div>
        </div>
      </section>

      <section className="border-b border-border bg-primary text-primary-foreground">
        <div className="page-shell grid gap-10 py-20 lg:grid-cols-2">
          <div>
            <span className="font-mono text-xs uppercase tracking-[0.16em] text-primary-foreground/50">
              Package-manager discipline
            </span>
            <h2 className="mt-4 max-w-xl font-display text-3xl font-bold tracking-tight sm:text-4xl">
              Skills should install like dependencies, not copied snippets.
            </h2>
            <p className="mt-4 max-w-xl text-primary-foreground/65">
              Declare what your project needs, lock exact immutable versions,
              verify SHA-512 integrity, and keep installed skills in a generated
              read-only library.
            </p>
            <Link
              href="/guides#skills"
              className="mt-6 inline-flex font-semibold underline decoration-primary-foreground/30 underline-offset-4"
            >
              See the skill format →
            </Link>
          </div>
          <div className="grid overflow-hidden rounded-2xl border border-primary-foreground/15 sm:grid-cols-2">
            <pre className="border-b border-primary-foreground/15 bg-primary-foreground/5 p-5 text-xs leading-6 sm:border-b-0 sm:border-r">
              # agents/skills.yml{`\n`}version: 1{`\n`}skills:{`\n`} - id:
              johnte/backend-review{`\n`} version: ^2.1.0{`\n`} enabled: true
            </pre>
            <pre className="bg-primary-foreground/5 p-5 text-xs leading-6">
              $ agentick pull{`\n`}✓ resolved 2.3.1{`\n`}✓ sha512 integrity
              verified{`\n`}✓ installed read-only
            </pre>
          </div>
        </div>
      </section>

      <section className="border-b border-border">
        <div className="page-shell py-20">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <span className="section-label">From the registry</span>
              <h2 className="mt-4 font-display text-3xl font-bold tracking-tight sm:text-4xl">
                Skills worth reusing.
              </h2>
            </div>
            <Link
              href="/skills"
              className="font-semibold underline decoration-border underline-offset-4"
            >
              Explore all skills →
            </Link>
          </div>
          {featured.length > 0 ? (
            <div className="skill-grid mt-10">
              {featured.map((skill) => (
                <SkillCard key={skill.id} skill={skill} />
              ))}
            </div>
          ) : (
            <div className="mt-10 flex flex-col items-center rounded-2xl border border-dashed border-border p-12 text-center">
              <LogoMark size={54} />
              <h3 className="mt-5 font-display text-2xl font-bold">
                The registry is ready for its first skills.
              </h3>
              <p className="mt-3 max-w-md text-muted-foreground">
                Publish a workflow you trust and make it useful beyond one
                project.
              </p>
              <Button asChild className="mt-6">
                <Link href="/signup">Publish the first skill</Link>
              </Button>
            </div>
          )}
        </div>
      </section>

      <section className="border-b border-border bg-muted/45">
        <div className="page-shell py-20">
          <div className="max-w-2xl">
            <span className="section-label">Guides</span>
            <h2 className="mt-4 font-display text-3xl font-bold tracking-tight sm:text-4xl">
              Build a better working relationship with coding AI.
            </h2>
            <p className="mt-4 text-muted-foreground">
              Practical guidance for protecting project logic, turning expertise
              into reusable skills, and getting more verified value from every
              token.
            </p>
          </div>
          <div className="mt-10 grid overflow-hidden rounded-2xl border border-border bg-border md:grid-cols-2 md:gap-px">
            {guides.map(([number, label, title, href]) => (
              <Link
                key={number}
                href={href}
                className="group flex items-center justify-between gap-6 bg-background p-6 hover:bg-muted/40"
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
              className="group flex items-center justify-between gap-6 bg-primary p-6 text-primary-foreground md:col-span-2"
            >
              <div>
                <span className="font-mono text-xs text-primary-foreground/50">
                  05 · CLI quickstart
                </span>
                <h3 className="mt-2 font-display text-lg font-bold">
                  Init, watch, verify, publish.
                </h3>
              </div>
              <ArrowRight className="size-4 shrink-0 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-primary text-primary-foreground">
        <div className="page-shell py-24 text-center">
          <span className="font-mono text-xs uppercase tracking-[0.16em] text-primary-foreground/50">
            Start accountable
          </span>
          <h2 className="mx-auto mt-5 max-w-2xl font-display text-4xl font-extrabold tracking-tight sm:text-5xl">
            Let AI move fast. Make it show its work.
          </h2>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button
              asChild
              size="lg"
              className="bg-background text-foreground hover:bg-background/85"
            >
              <Link href="/signup">Create an account</Link>
            </Button>
            <Button
              asChild
              variant="secondary"
              size="lg"
              className="border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10"
            >
              <Link href="/guides">Read product guides</Link>
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
