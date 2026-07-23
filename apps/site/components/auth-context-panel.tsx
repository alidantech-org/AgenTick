import { CheckCircle2, Code2, PackageCheck, ShieldCheck } from "lucide-react";
import Link from "next/link";

export function AuthContextPanel({ mode }: { mode: "login" | "signup" }) {
  const isSignup = mode === "signup";
  return (
    <aside className="auth-context" aria-label="Why use Skillib">
      <Link href="/" className="auth-wordmark" translate="no">
        <span className="auth-wordmark-mark">✓</span>
        Skillib
      </Link>

      <div className="auth-context-copy">
        <span className="section-label">
          {isSignup ? "Build a Publisher Identity" : "Return to Your Workspace"}
        </span>
        <h2>
          {isSignup
            ? "Turn proven AI workflows into trusted engineering assets."
            : "Manage every skill, release, token, and team from one secure workspace."}
        </h2>
        <p>
          {isSignup
            ? "Publish reusable skills, maintain private team packages, and help developers get more value from every AI-assisted coding session."
            : "Your account keeps publishing access, package history, organization membership, and local CLI credentials connected."}
        </p>
      </div>

      <div className="auth-benefit-list">
        <article>
          <PackageCheck aria-hidden="true" />
          <div>
            <strong>Immutable Releases</strong>
            <span>Every published release keeps its integrity and history</span>
          </div>
        </article>
        <article>
          <ShieldCheck aria-hidden="true" />
          <div>
            <strong>Passwordless Security</strong>
            <span>Short-lived codes remove passwords from the attack surface</span>
          </div>
        </article>
        <article>
          <Code2 aria-hidden="true" />
          <div>
            <strong>CLI Publishing</strong>
            <span>Use scoped tokens without exposing your account session</span>
          </div>
        </article>
      </div>

      <div className="auth-context-proof">
        <CheckCircle2 aria-hidden="true" />
        <span>Codes are never shown in the UI or stored as plaintext</span>
      </div>
    </aside>
  );
}
