import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Product guides" };

export default function GuidesPage() {
  return (
    <main className="page-shell standard-page">
      <header className="page-hero compact-hero">
        <span className="section-label">Product guides</span>
        <h1>Build a better working relationship with coding AI.</h1>
        <p>
          Practical guidance for protecting project logic, turning expertise
          into reusable skills, and getting more verified value from every
          token.
        </p>
      </header>
      <div className="guide-layout">
        <aside className="guide-nav">
          <a href="#control">Keep control</a>
          <a href="#skills">Publish your skills</a>
          <a href="#productivity">Improve productivity</a>
          <a href="#tokens">Make tokens count</a>
          <a href="#cli">CLI quickstart</a>
        </aside>
        <div className="guide-content">
          <section id="control">
            <span>01</span>
            <h2>Don&apos;t let AI leave your repository in a mess.</h2>
            <p>
              Place the project&apos;s non-negotiable architecture, boundaries,
              patterns, and active task scope inside <code>agents/</code>.
              AgenTick observes source changes against that specification and
              records findings rather than trusting an agent&apos;s own summary.
            </p>
            <div className="guide-callout">
              A rule is only useful when it is specific enough to verify and
              protected from being rewritten during the task.
            </div>
          </section>
          <section id="skills">
            <span>02</span>
            <h2>Don&apos;t let valuable prompting expertise disappear.</h2>
            <p>
              A strong review checklist, migration workflow, code pattern, or
              domain procedure is reusable engineering knowledge. Package it as
              a versioned skill with a clear <code>SKILL.md</code>, optional
              references, scripts, and assets. Publish it publicly or keep it
              private to your organisation.
            </p>
            <Link href="/account/skills" className="arrow-link">
              Publish a skill →
            </Link>
          </section>
          <section id="productivity">
            <span>03</span>
            <h2>Upskill while you automate.</h2>
            <p>
              Use findings and audit history as feedback. The goal is not merely
              more generated code; it is better project decisions, smaller
              corrections, clearer boundaries, and developers who understand why
              the accepted solution is sound.
            </p>
          </section>
          <section id="tokens">
            <span>04</span>
            <h2>Make every token count.</h2>
            <p>
              Keep stable project context in the repository, pull reusable
              skills instead of repeating long prompts, and require
              deterministic verification. This reduces context repetition and
              prevents expensive speculative rewrites.
            </p>
          </section>
          <section id="cli">
            <span>05</span>
            <h2>CLI quickstart</h2>
            <pre className="guide-code">
              pnpm dlx @alidantech/agentick init{`\n`}agentick watch{`\n`}
              agentick verify{`\n\n`}# authenticate with a token created in
              /account{`\n`}agentick login{`\n`}agentick pull{`\n`}agentick
              skill add johnte/backend-review@2.3.1{`\n`}agentick push
              agents/skills/my-skill --id your-handle/my-skill --version 1.0.0
              --visibility private
            </pre>
          </section>
        </div>
      </div>
    </main>
  );
}
