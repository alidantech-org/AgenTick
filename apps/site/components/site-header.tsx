import Link from "next/link";
import { optionalAccount } from "@/lib/auth/dal";
import { Wordmark } from "./logo";
import { RegistrySearch } from "./registry-search";

export async function SiteHeader() {
  const account = await optionalAccount();
  return (
    <header className="site-header">
      <div className="header-inner">
        <Wordmark compact />
        <div className="header-search">
          <RegistrySearch compact />
        </div>
        <nav className="main-nav" aria-label="Main navigation">
          <Link href="/skills">Skills</Link>
          <Link href="/guides">Guides</Link>
          <a
            href="https://github.com/alidantech-org/AgenTick"
            target="_blank"
            rel="noreferrer"
          >
            GitHub
          </a>
        </nav>
        <div className="header-actions">
          {account ? (
            <Link className="button button-small button-dark" href="/account">
              @{account.handle}
            </Link>
          ) : (
            <>
              <Link className="text-button" href="/login">
                Log in
              </Link>
              <Link className="button button-small" href="/signup">
                Get started
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
