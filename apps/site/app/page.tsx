import Link from "next/link";
import { LogoMark } from "@/components/logo";
import { RegistrySearch } from "@/components/registry-search";
import { SkillCard } from "@/components/skill-card";
import { searchPublicSkills } from "@/lib/registry/service";

export default async function HomePage() {
  const featured = await searchPublicSkills({ sort: "popular", limit: 3 });
  return (
    <main>
      <section className="hero-section">
        <div className="hero-grid-bg" />
        <div className="hero-content page-shell">
          <div className="hero-copy">
            <div className="eyebrow-pill">
              <LogoMark size={20} /> Agent + tick. Proof over promises.
            </div>
            <h1>
              Build with AI.
              <br />
              <span>Keep control.</span>
            </h1>
            <p className="hero-lead">
              AgenTick watches every change, checks work against your
              project&apos;s own rules, and turns hard-won prompting knowledge
              into reusable, versioned skills.
            </p>
            <div className="hero-actions">
              <Link href="/signup" className="button button-large">
                Start with AgenTick
              </Link>
              <Link
                href="/guides#cli"
                className="button button-large button-secondary"
              >
                Read the quickstart
              </Link>
            </div>
            <div className="hero-proof">
              <span>
                <b>✓</b> Project-local rules
              </span>
              <span>
                <b>✓</b> Immutable skill versions
              </span>
              <span>
                <b>✓</b> Evidence-backed audits
              </span>
            </div>
          </div>
          <div className="terminal-card" aria-label="AgenTick CLI example">
            <div className="terminal-bar">
              <i />
              <i />
              <i />
              <span>agentick — ~/your-project</span>
            </div>
            <div className="terminal-body">
              <p>
                <span className="prompt">$</span> pnpm dlx @alidantech/agentick
                init
              </p>
              <p className="terminal-success">
                ✓ agents/ initialized without touching your source
              </p>
              <p>
                <span className="prompt">$</span> agentick watch
              </p>
              <p className="terminal-muted">
                watching 218 files · dashboard :4317
              </p>
              <p className="terminal-event">
                CHANGE <span>src/modules/payments/service.ts</span>
              </p>
              <p className="terminal-warning">
                FINDING protected boundary crossed
              </p>
              <p className="terminal-success">
                ✓ fixed · typecheck · tests · audit recorded
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="registry-search-section page-shell">
        <span className="section-label">Skill registry</span>
        <h2>Find the workflow your AI is missing.</h2>
        <p>
          Search public skills from individual developers and engineering
          organisations.
        </p>
        <RegistrySearch />
        <div className="popular-links">
          <span>Popular:</span>
          <Link href="/skills?q=nextjs">Next.js</Link>
          <Link href="/skills?q=backend">Backend review</Link>
          <Link href="/skills?q=security">Security</Link>
          <Link href="/skills?q=testing">Testing</Link>
        </div>
      </section>

      <section className="problem-section">
        <div className="page-shell">
          <div className="section-heading split-heading">
            <div>
              <span className="section-label">Why AgenTick</span>
              <h2>AI speed without the cleanup bill.</h2>
            </div>
            <p>
              Move quickly without letting context drift, silent shortcuts, or
              invented completion claims leave your repository in a mess.
            </p>
          </div>
          <div className="value-grid">
            <article className="value-card value-card-featured">
              <span className="card-number">01</span>
              <h3>Don&apos;t let AI quietly destroy your codebase.</h3>
              <p>
                Watch protected files, project boundaries, task scope,
                verification commands, and the evidence behind every completion
                claim.
              </p>
              <div className="mini-audit">
                <span className="audit-dot danger" /> scope drift detected
                <strong>blocked before handoff</strong>
              </div>
            </article>
            <article className="value-card">
              <span className="card-number">02</span>
              <h3>Stop leaving your best prompts in chat history.</h3>
              <p>
                Package repeatable expertise as Agent Skills, publish immutable
                versions, and pull them into any project with integrity checks.
              </p>
            </article>
            <article className="value-card">
              <span className="card-number">03</span>
              <h3>Become genuinely better at coding with AI.</h3>
              <p>
                Turn audits, patterns, and project rules into a feedback loop
                that improves both developer judgment and agent output.
              </p>
            </article>
            <article className="value-card">
              <span className="card-number">04</span>
              <h3>Make every token produce useful progress.</h3>
              <p>
                Less repeated context, fewer speculative rewrites, clearer next
                steps, and verifiable work that survives beyond one
                conversation.
              </p>
            </article>
          </div>
        </div>
      </section>

      <section className="workflow-section page-shell">
        <div className="section-heading centered-heading">
          <span className="section-label">One accountable workflow</span>
          <h2>Rules, runtime, registry.</h2>
          <p>
            AgenTick connects the project specification, live watcher, and
            shared skill ecosystem without putting extra configuration in your
            source root.
          </p>
        </div>
        <div className="workflow-line">
          <article>
            <span>1</span>
            <h3>Describe the project</h3>
            <p>
              Keep architecture, rules, patterns, templates, and active work
              entirely inside <code>agents/</code>.
            </p>
          </article>
          <article>
            <span>2</span>
            <h3>Watch the work</h3>
            <p>
              Capture file events, Git state, protected changes, findings,
              commands, and audit history as coding happens.
            </p>
          </article>
          <article>
            <span>3</span>
            <h3>Verify the result</h3>
            <p>
              Run deterministic checks and require evidence before a task is
              considered complete.
            </p>
          </article>
          <article>
            <span>4</span>
            <h3>Share what works</h3>
            <p>
              Publish public or private skills under your personal or
              organisation namespace.
            </p>
          </article>
        </div>
      </section>

      <section className="package-manager-section">
        <div className="page-shell package-manager-grid">
          <div>
            <span className="section-label light-label">
              Package-manager discipline
            </span>
            <h2>
              Skills should install like dependencies, not copied snippets.
            </h2>
            <p>
              Declare what your project needs, lock exact immutable versions,
              verify SHA-512 integrity, and keep installed skills in a generated
              read-only library.
            </p>
            <Link href="/guides#skills" className="arrow-link light-link">
              See the skill format →
            </Link>
          </div>
          <pre className="code-window">
            <span># agents/skills.yml</span>
            {`\n`}version: 1{`\n`}skills:{`\n`} - id: johnte/backend-review
            {`\n`} version: ^2.1.0{`\n`} enabled: true{`\n\n`}
            <b>$ agentick pull</b>
            {`\n`}✓ resolved 2.3.1{`\n`}✓ sha512 integrity verified{`\n`}✓
            installed read-only
          </pre>
        </div>
      </section>

      <section className="featured-section page-shell">
        <div className="section-heading split-heading">
          <div>
            <span className="section-label">From the registry</span>
            <h2>Skills worth reusing.</h2>
          </div>
          <Link href="/skills" className="arrow-link">
            Explore all skills →
          </Link>
        </div>
        {featured.length > 0 ? (
          <div className="skill-grid">
            {featured.map((skill) => (
              <SkillCard key={skill.id} skill={skill} />
            ))}
          </div>
        ) : (
          <div className="empty-registry-promo">
            <LogoMark size={54} />
            <div>
              <h3>The registry is ready for its first skills.</h3>
              <p>
                Publish a workflow you trust and make it useful beyond one
                project.
              </p>
            </div>
            <Link className="button" href="/signup">
              Publish the first skill
            </Link>
          </div>
        )}
      </section>

      <section className="cta-section page-shell">
        <div className="cta-card">
          <div>
            <span className="section-label light-label">Start accountable</span>
            <h2>Let AI move fast. Make it show its work.</h2>
          </div>
          <div className="cta-actions">
            <Link href="/signup" className="button button-light button-large">
              Create an account
            </Link>
            <Link
              href="/guides"
              className="button button-outline-light button-large"
            >
              Read product guides
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
