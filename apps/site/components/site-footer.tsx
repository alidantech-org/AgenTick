import Link from "next/link";
import { Wordmark } from "./logo";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-grid">
        <div>
          <Wordmark />
          <p className="footer-copy">
            Watch AI-assisted work, verify the evidence, and share skills
            without losing control of your codebase.
          </p>
        </div>
        <div>
          <h3>Product</h3>
          <Link href="/skills">Skill registry</Link>
          <Link href="/guides">Guides</Link>
          <Link href="/account">Account</Link>
        </div>
        <div>
          <h3>Developers</h3>
          <a
            href="https://github.com/alidantech-org/AgenTick"
            target="_blank"
            rel="noreferrer"
          >
            GitHub
          </a>
          <Link href="/guides#cli">CLI quickstart</Link>
          <Link href="/guides#skills">Skill publishing</Link>
        </div>
        <div>
          <h3>Principles</h3>
          <span>Project-local rules</span>
          <span>Immutable versions</span>
          <span>Auditable evidence</span>
        </div>
      </div>
      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} AgenTick</span>
        <span>Agent + tick ✓</span>
      </div>
    </footer>
  );
}
