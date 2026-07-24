"use client";

import { ArrowRight, Building2, KeyRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { FormField } from "@/components/form-field";

export function JoinOrganisationForm({
  initialCode = "",
}: {
  initialCode?: string;
}) {
  const router = useRouter();
  const [code, setCode] = useState(initialCode);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");

    try {
      const response = await fetch("/api/account/organizations/join", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ code: code.trim() }),
      });
      const data = (await response.json()) as { slug?: string; error?: string };
      if (!response.ok || !data.slug) {
        setError(
          data.error ??
            "Enter the complete invitation code from the email you received",
        );
        return;
      }
      router.push(`/account/organisation/${data.slug}/skills`);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="auth-form join-form" onSubmit={submit} noValidate>
      <FormField
        id="invitation-code"
        label="Invitation Code"
        hint="The code starts with skl_join_ and is at least 12 characters"
        error={error || undefined}
        required
      >
        <div className="input-with-icon">
          <KeyRound aria-hidden="true" />
          <input
            id="invitation-code"
            name="invitation-code"
            value={code}
            onChange={(event) => setCode(event.target.value)}
            minLength={12}
            required
            placeholder="skl_join_…"
            autoComplete="off"
            spellCheck={false}
            aria-describedby={
              error
                ? "invitation-code-hint invitation-code-error"
                : "invitation-code-hint"
            }
            aria-invalid={Boolean(error)}
          />
        </div>
      </FormField>

      <button
        className="button button-large button-wide"
        disabled={busy || code.trim().length < 12}
      >
        {busy ? "Joining Organization…" : "Accept Invitation"}
        {!busy && <ArrowRight aria-hidden="true" />}
      </button>

      <div className="join-form-note">
        <Building2 aria-hidden="true" />
        <p>
          Membership grants access only to the organization and package
          permissions assigned by its administrators.
        </p>
      </div>
    </form>
  );
}
