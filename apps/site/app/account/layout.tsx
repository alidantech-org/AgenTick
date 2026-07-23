import "./account.css";
import { LogOut } from "lucide-react";
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
          <span className="section-label">Publisher workspace</span>
          <h1>{account.displayName ?? account.handle}</h1>
          <p>
            @{account.handle} · {account.email}
          </p>
        </div>
        <form action="/api/auth/logout" method="post">
          <button className="button button-secondary button-small" type="submit">
            <LogOut size={16} />
            Log out
          </button>
        </form>
      </header>
      <AccountNav />
      {children}
    </main>
  );
}
