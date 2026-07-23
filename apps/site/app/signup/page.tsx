import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthContextPanel } from "@/components/auth-context-panel";
import { AuthForm } from "@/components/auth-form";

export const metadata: Metadata = {
  title: "Create Account",
  description: "Create a Skillib publisher account with secure passwordless access.",
};

export default function SignupPage() {
  return (
    <main className="auth-page" id="main-content">
      <AuthContextPanel mode="signup" />
      <div className="auth-form-column">
        <Suspense fallback={<div className="auth-card auth-card-skeleton">Loading…</div>}>
          <AuthForm mode="signup" />
        </Suspense>
      </div>
    </main>
  );
}
