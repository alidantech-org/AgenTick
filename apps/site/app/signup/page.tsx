import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthForm } from "@/components/auth-form";

export const metadata: Metadata = { title: "Create account" };
export default function SignupPage() {
  return (
    <main className="auth-page">
      <div className="auth-aside">
        <span>Start publishing</span>
        <h2>Turn your best AI workflows into durable engineering assets.</h2>
        <p>
          Create public skills, private team packages, and scoped CLI tokens.
        </p>
      </div>
      <Suspense>
        <AuthForm mode="signup" />
      </Suspense>
    </main>
  );
}
