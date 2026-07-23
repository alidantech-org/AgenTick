"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const search = useSearchParams();
  const [step, setStep] = useState<"email" | "otp">("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  async function requestCode(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const response = await fetch("/api/auth/request-otp", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = (await response.json()) as { ok?: boolean; error?: string };
    setBusy(false);
    if (!response.ok) {
      setError(data.error ?? "Unable to send code");
      return;
    }
    setStep("otp");
    setNotice(`We sent an 8-digit code to ${email.trim().toLowerCase()}.`);
  }

  async function verifyCode(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const response = await fetch("/api/auth/verify-otp", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, otp }),
    });
    const data = (await response.json()) as { ok?: boolean; error?: string };
    setBusy(false);
    if (!response.ok) {
      setError(data.error ?? "Unable to sign in");
      return;
    }
    const next = search.get("next");
    const safeNext =
      next?.startsWith("/") && !next.startsWith("//") ? next : "/account";
    router.push(safeNext);
    router.refresh();
  }

  return (
    <div className="auth-card">
      <span className="kicker">Passwordless account</span>
      <h1>
        {mode === "signup" ? "Create your Skillib account" : "Welcome back"}
      </h1>
      <p>
        {mode === "signup"
          ? "Your email becomes your identity. No password to remember or leak."
          : "Enter your email and confirm the one-time code we send you."}
      </p>

      {step === "email" ? (
        <form onSubmit={requestCode} className="form-stack">
          <label>
            Work email
            <input
              autoFocus
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
          </label>
          <button className="button button-wide" disabled={busy}>
            {busy ? "Sending…" : "Email me a sign-in code"}
          </button>
        </form>
      ) : (
        <form onSubmit={verifyCode} className="form-stack">
          <label>
            8-digit code
            <input
              autoFocus
              inputMode="numeric"
              value={otp}
              onChange={(event) =>
                setOtp(event.target.value.replace(/\D/g, "").slice(0, 8))
              }
              placeholder="00000000"
              autoComplete="one-time-code"
              className="otp-input"
              required
            />
          </label>
          <button
            className="button button-wide"
            disabled={busy || otp.length !== 8}
          >
            {busy ? "Checking…" : "Continue to my account"}
          </button>
          <button
            type="button"
            className="text-button center-button"
            onClick={() => setStep("email")}
          >
            Use a different email
          </button>
        </form>
      )}

      {notice && <div className="form-notice">{notice}</div>}
      {error && <div className="form-error">{error}</div>}
      <p className="auth-switch">
        {mode === "signup" ? "Already have an account?" : "New to Skillib?"}{" "}
        <Link href={mode === "signup" ? "/login" : "/signup"}>
          {mode === "signup" ? "Log in" : "Create one"}
        </Link>
      </p>
    </div>
  );
}
