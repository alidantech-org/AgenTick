import type { Metadata } from "next";
import { AtSign, Mail, UserRound } from "lucide-react";
import { requireAccount } from "@/lib/auth/dal";

export const metadata: Metadata = {
  title: "Profile",
  description: "Manage your public Skillib identity.",
};

export default async function AccountProfilePage() {
  const account = await requireAccount();

  return (
    <div className="account-content-stack">
      <section className="account-page-heading">
        <div>
          <span className="section-label">Public identity</span>
          <h2>Your profile</h2>
          <p>
            This information identifies you as a publisher and organisation
            member across Skillib.
          </p>
        </div>
      </section>

      <section className="account-panel profile-overview-panel">
        <div className="profile-avatar" aria-hidden="true">
          {(account.displayName ?? account.handle).slice(0, 1).toUpperCase()}
        </div>
        <div className="profile-fields">
          <article>
            <UserRound size={18} />
            <div>
              <span>Display name</span>
              <strong>{account.displayName ?? "Not set"}</strong>
            </div>
          </article>
          <article>
            <AtSign size={18} />
            <div>
              <span>Registry handle</span>
              <strong>@{account.handle}</strong>
            </div>
          </article>
          <article>
            <Mail size={18} />
            <div>
              <span>Primary email</span>
              <strong>{account.email}</strong>
            </div>
          </article>
        </div>
        <p className="muted-notice">
          Profile editing, additional verified emails, country, timezone, and
          locale controls are tracked in the active registry upgrade plan.
        </p>
      </section>
    </div>
  );
}
