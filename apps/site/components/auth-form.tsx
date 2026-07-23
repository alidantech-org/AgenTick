"use client";

import { ArrowLeft, ArrowRight, CheckCircle2, KeyRound, Mail } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { FormField } from "@/components/form-field";

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
    setNotice("");

    try {
      const response = await fetch("/api/auth/request-otp", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = (await response.json()) as { ok?: boolean; error?: string };
      if (!response.ok) {
        setError(data.error ?? "Enter an email address that can receive a code");
        return;
      }
      setStep("otp");
      setNotice(`We sent an 8-digit code to ${email.trim().toLowerCase()}.`);
    } finally {
      setBusy(false);
    }
  }

  async function verifyCode(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");

    try {
      const response = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });
      const data = (await response.json()) as { ok?: boolean; error?: string };
      if (!response.ok) {
        setError(data.error ?? "Enter the latest 8-digit code from your email");
        return;
      }
      const next = search.get("next");
      const safeNext =
        next?.startsWith("/") && !next.startsWith("//") ? next : "/account";
      router.push(safeNext);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  function changeEmail() {
    setStep("email");
    setOtp("");
    setError("");
    setNotice("");
  }

  const isSignup = mode === "signup";

  return (
    <section className="auth-card" aria-labelledby="auth-title">
      <div className="auth-progress" aria-label="Authentication progress">
        <span className="active">1</span>
        <i aria-hidden="true" />
        <span className={step === "otp" ? "active" : ""}>2</span>
      </div>

      <div className="auth-card-heading">
        <span className="auth-icon" aria-hidden="true">
          {step === "email" ? <Mail /> : <KeyRound />}
        </span>
        <div>
          <span className="section-label">
            {step === "email" ? "Passwordless Access" : "Check Your Email"}
          </span>
          <h1 id="auth-title">
            {step === "email"
              ? isSignup
                ? "Create Your Skillib Account"
                : "Welcome Back"
              : "Enter Your Sign-In Code"}
          </h1>
          <p>
            {step === "email"
              ? isSignup
                ? "Use your email to create a secure publisher identity. No password required."
                : "Use the email linked to your Skillib account. We’ll send a short-lived code."
              : `Enter the code sent to ${email.trim().toLowerCase()}. It expires shortly.`}
          </p>
        </div>
      </div>

      {step === "email" ? (
        <form onSubmit={requestCode} className="auth-form" noValidate>
          <FormField
            id="auth-email"
            label="Email Address"
            hint="Use an address you can access now"
            error={error || undefined}
            required
          >
            <div className="input-with-icon">
              <Mail aria-hidden="true" />
              <input
                id="auth-email"
                name="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com…"
                autoComplete="email"
                spellCheck={false}
                inputMode="email"
                aria-describedby={error ? "auth-email-hint auth-email-error" : "auth-email-hint"}
                aria-invalid={Boolean(error)}
                required
              />
            </div>
          </FormField>

          <button className="button button-large button-wide" disabled={busy}>
            {busy ? "Sending Code…" : "Send Sign-In Code"}
            {!busy && <ArrowRight aria-hidden="true" />}
          </button>
        </form>
      ) : (
        <form onSubmit={verifyCode} className="auth-form" noValidate>
          {notice && (
            <div className="form-success" role="status" aria-live="polite">
              <CheckCircle2 aria-hidden="true" />
              <span>{notice}</span>
            </div>
          )}

          <FormField
            id="auth-code"
            label="8-Digit Code"
            hint="Paste or type the newest code from your email"
            error={error || undefined}
            required
          >
            <input
              id="auth-code"
              name="one-time-code"
              inputMode="numeric"
              value={otp}
              onChange={(event) =>
                setOtp(event.target.value.replace(/\D/g, "").slice(0, 8))
              }
              placeholder="00000000…"
              autoComplete="one-time-code"
              spellCheck={false}
              className="otp-input"
              aria-describedby={error ? "auth-code-hint auth-code-error" : "auth-code-hint"}
              aria-invalid={Boolean(error)}
              required
            />
          </FormField>

          <button
            className="button button-large button-wide"
            disabled={busy || otp.length !== 8}
          >
            {busy ? "Verifying Code…" : "Open My Account"}
            {!busy && <ArrowRight aria-hidden="true" />}
          </button>

          <button type="button" className="auth-back-button" onClick={changeEmail}>
            <ArrowLeft aria-hidden="true" />
            Use a Different Email
          </button>
        </form>
      )}

      <div className="auth-divider" aria-hidden="true">
        <span />
        <b>or</b>
        <span />
      </div>

      <p className="auth-switch">
        {isSignup ? "Already have an account?" : "New to Skillib?"}{" "}
        <Link href={isSignup ? "/login" : "/signup"}>
          {isSignup ? "Log In" : "Create an Account"}
        </Link>
      </p>

      <p className="auth-legal">
        By continuing, you agree to use Skillib responsibly and protect access to
        your publishing identity.
      </p>
    </section>
  );
}
