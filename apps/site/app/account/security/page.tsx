import type { Metadata } from "next";
import { KeyRound, LockKeyhole, MailCheck } from "lucide-react";
import { SessionManager } from "@/components/session-manager";
import { listAccountSessions } from "@/lib/account/security";
import { requireAccount } from "@/lib/auth/dal";

export const metadata: Metadata = {
  title: "Account security",
  description: "Manage Skillib sessions and account security.",
};

export default async function AccountSecurityPage() {
  const account = await requireAccount();
  const sessions = await listAccountSessions(account.id);

  return (
    <div className="account-content-stack">
      <section className="account-page-heading">
        <div>
          <span className="section-label">Security</span>
          <h2>Protect your Skillib account</h2>
          <p>
            Manage active devices, publishing credentials, and verified account
            access from one place.
          </p>
        </div>
      </section>

      <div className="security-summary-grid">
        <article>
          <MailCheck size={20} />
          <div>
            <strong>Passwordless email</strong>
            <p>{account.email}</p>
          </div>
        </article>
        <article>
          <LockKeyhole size={20} />
          <div>
            <strong>
              {sessions.length} active session{sessions.length === 1 ? "" : "s"}
            </strong>
            <p>Thirty-day session expiry with device tracking</p>
          </div>
        </article>
        <article>
          <KeyRound size={20} />
          <div>
            <strong>Scoped publishing tokens</strong>
            <p>Create and revoke CLI credentials from the Tokens page</p>
          </div>
        </article>
      </div>

      <SessionManager sessions={sessions} />
    </div>
  );
}
