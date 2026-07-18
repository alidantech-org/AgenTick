import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthForm } from "@/components/auth-form";

export const metadata: Metadata = { title: "Log in" };
export default function LoginPage() {
  return (
    <main className="auth-page">
      <div className="auth-aside">
        <span>Accountable AI coding</span>
        <h2>Return to your skills, organisations, and publishing tokens.</h2>
        <p>One email. One short-lived code. No password.</p>
      </div>
      <Suspense>
        <AuthForm mode="login" />
      </Suspense>
    </main>
  );
}
