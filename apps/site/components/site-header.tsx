import Link from "next/link";
import { Github, TerminalSquare } from "lucide-react";
import { optionalAccount } from "@/lib/auth/dal";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { Wordmark } from "./logo";
import { RegistrySearch } from "./registry-search";

export async function SiteHeader() {
  const account = await optionalAccount();
  return (
    <header className="site-header">
      <div className="header-inner">
        <Wordmark compact />
        <nav className="main-nav hidden md:flex" aria-label="Main navigation">
          <Link href="/skills">Skills</Link>
          <Link href="/guides">Guides</Link>
        </nav>
        <div className="header-search">
          <RegistrySearch compact />
        </div>
        <div className="header-actions">
          <Button
            asChild
            variant="ghost"
            size="icon"
            className="hidden sm:inline-flex"
          >
            <a
              href="https://github.com/alidantech-org/AgenTick"
              target="_blank"
              rel="noreferrer"
              aria-label="Skillib on GitHub"
            >
              <Github className="size-4" />
            </a>
          </Button>
          <Button
            asChild
            variant="ghost"
            size="icon"
            className="hidden sm:inline-flex"
          >
            <Link href="/guides#cli" aria-label="CLI quickstart">
              <TerminalSquare className="size-4" />
            </Link>
          </Button>
          <ThemeToggle />
          {account ? (
            <Button asChild size="sm">
              <Link href="/account">@{account.handle}</Link>
            </Button>
          ) : (
            <>
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="hidden sm:inline-flex"
              >
                <Link href="/login">Log in</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/signup">Get started</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
