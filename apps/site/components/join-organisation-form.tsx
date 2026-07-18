"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

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
    const response = await fetch("/api/account/organizations/join", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ code }),
    });
    const data = (await response.json()) as { slug?: string; error?: string };
    setBusy(false);
    if (!response.ok || !data.slug) {
      setError(data.error ?? "Unable to join organisation");
      return;
    }
    router.push(`/account/organisation/${data.slug}/skills`);
    router.refresh();
  }

  return (
    <form className="form-stack" onSubmit={submit}>
      <label>
        Invitation code
        <input
          value={code}
          onChange={(event) => setCode(event.target.value)}
          minLength={12}
          required
          placeholder="agt_join_…"
        />
      </label>
      <button className="button button-wide" disabled={busy}>
        {busy ? "Joining…" : "Join organisation"}
      </button>
      {error && <div className="form-error">{error}</div>}
    </form>
  );
}
