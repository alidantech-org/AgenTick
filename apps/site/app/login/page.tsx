import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthContextPanel } from "@/components/auth-context-panel";
import { AuthForm } from "@/components/auth-form";

export const metadata: Metadata = {
  title: "Log In",
  description: "Access your Skillib publisher workspace with a secure one-time code.",
};

export default function LoginPage() {
  return (
    <main className="auth-page" id="main-content">
      <AuthContextPanel mode="login" />
      <div className="auth-form-column">
        <Suspense fallback={<div className="auth-card auth-card-skeleton">Loading…</div>}>
          <AuthForm mode="login" />
        </Suspense>
      </div>
    </main>
  );
}
