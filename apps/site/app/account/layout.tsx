import { AccountNav } from "@/components/account-nav";
import { requireAccount } from "@/lib/auth/dal";

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const account = await requireAccount();
  return (
    <main className="page-shell standard-page account-page">
      <header className="account-header">
        <div>
          <span className="section-label">Skillib account</span>
          <h1>{account.displayName ?? account.handle}</h1>
          <p>
            @{account.handle} · {account.email}
          </p>
        </div>
        <form action="/api/auth/logout" method="post">
          <button className="button button-secondary button-small">
            Log out
          </button>
        </form>
      </header>
      <AccountNav />
      {children}
    </main>
  );
}
