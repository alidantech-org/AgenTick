import "./tokens.css";
import type { Metadata } from "next";
import { TokenManager } from "@/components/token-manager";
import { listApiTokens } from "@/lib/account/service";
import { requireAccount } from "@/lib/auth/dal";

export const metadata: Metadata = {
  title: "Access tokens",
  description: "Manage Skillib CLI and publishing credentials.",
};

export default async function AccountTokensPage() {
  const account = await requireAccount();
  const tokens = await listApiTokens(account.id);

  return (
    <div className="account-content-stack">
      <section className="account-page-heading">
        <div>
          <span className="section-label">Publishing credentials</span>
          <h2>Access tokens</h2>
          <p>
            Create scoped credentials for CLI pull and push operations. Tokens
            are displayed once and can be revoked at any time.
          </p>
        </div>
      </section>
      <TokenManager initialTokens={tokens} />
    </div>
  );
}
