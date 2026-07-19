import type { Metadata } from "next";
import Link from "next/link";
import { JoinOrganisationForm } from "@/components/join-organisation-form";
import { optionalAccount } from "@/lib/auth/dal";

export const metadata: Metadata = { title: "Join organisation" };
export default async function JoinPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  const account = await optionalAccount();
  const { code } = await searchParams;
  return (
    <main className="page-shell standard-page narrow-page">
      <div className="auth-card standalone-card">
        <span className="kicker">Organisation invitation</span>
        <h1>Join a shared skill namespace</h1>
        <p>
          Invitation codes are long-lived enough to reach your inbox and complex
          enough to resist guessing.
        </p>
        {account ? (
          <JoinOrganisationForm initialCode={code ?? ""} />
        ) : (
          <>
            <div className="form-notice">
              Sign in with the email address that received the invitation.
            </div>
            <Link
              className="button button-wide"
              href={`/login?next=${encodeURIComponent(`/join${code ? `?code=${code}` : ""}`)}`}
            >
              Log in to continue
            </Link>
          </>
        )}
      </div>
    </main>
  );
}
