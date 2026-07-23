import { ArrowRight, Building2, MailCheck, ShieldCheck } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { JoinOrganisationForm } from "@/components/join-organisation-form";
import { optionalAccount } from "@/lib/auth/dal";

export const metadata: Metadata = {
  title: "Join Organization",
  description: "Accept an invitation to a shared Skillib organization and package namespace.",
};

export default async function JoinPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  const account = await optionalAccount();
  const { code } = await searchParams;
  const nextPath = `/join${code ? `?code=${code}` : ""}`;

  return (
    <main className="join-page" id="main-content">
      <section className="join-context">
        <span className="section-label">Organization Invitation</span>
        <h1>Join a Shared Skill Namespace</h1>
        <p>
          Collaborate on private packages, publishing workflows, and reusable AI
          engineering knowledge under one organization identity.
        </p>

        <div className="join-benefits">
          <article>
            <Building2 aria-hidden="true" />
            <div>
              <strong>Shared Namespace</strong>
              <span>Publish and maintain packages under the organization slug</span>
            </div>
          </article>
          <article>
            <ShieldCheck aria-hidden="true" />
            <div>
              <strong>Role-Based Access</strong>
              <span>Your permissions are assigned by organization administrators</span>
            </div>
          </article>
          <article>
            <MailCheck aria-hidden="true" />
            <div>
              <strong>Email-Bound Invitation</strong>
              <span>Sign in with the same address that received the invitation</span>
            </div>
          </article>
        </div>
      </section>

      <section className="join-card" aria-labelledby="join-title">
        <div className="auth-card-heading">
          <span className="auth-icon" aria-hidden="true">
            <Building2 />
          </span>
          <div>
            <span className="section-label">Accept Membership</span>
            <h2 id="join-title">
              {account ? "Enter Your Invitation Code" : "Sign In to Continue"}
            </h2>
            <p>
              {account
                ? `Signed in as ${account.email}. The invitation must match this email address.`
                : "Your invitation remains attached while you complete passwordless sign-in."}
            </p>
          </div>
        </div>

        {account ? (
          <JoinOrganisationForm initialCode={code ?? ""} />
        ) : (
          <div className="join-signed-out-state">
            <div className="form-success" role="status">
              <MailCheck aria-hidden="true" />
              <span>Use the email address that received the invitation</span>
            </div>
            <Link
              className="button button-large button-wide"
              href={`/login?next=${encodeURIComponent(nextPath)}`}
            >
              Log In to Accept Invitation
              <ArrowRight aria-hidden="true" />
            </Link>
            <p>
              New to Skillib? Your account is created automatically after you verify
              your email.
            </p>
          </div>
        )}
      </section>
    </main>
  );
}
