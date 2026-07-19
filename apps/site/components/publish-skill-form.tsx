"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function PublishSkillForm({ namespaces }: { namespaces: string[] }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function publish(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const payload = Object.fromEntries(form.entries());
    const response = await fetch("/api/account/skills/publish", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = (await response.json()) as { id?: string; error?: string };
    setBusy(false);
    if (!response.ok || !data.id) {
      setError(data.error ?? "Unable to publish skill");
      return;
    }
    router.push(`/skills/${data.id}`);
    router.refresh();
  }

  return (
    <section className="account-panel publish-panel">
      <div className="panel-heading">
        <div>
          <span className="kicker">Browser publisher</span>
          <h2>Publish a focused skill</h2>
          <p>
            This creates a valid one-file <code>SKILL.md</code> package. Use the
            CLI for multi-file skills with references, scripts, or assets.
          </p>
        </div>
      </div>
      <form className="form-grid" onSubmit={publish}>
        <label>
          Namespace
          <select name="namespace">
            {namespaces.map((namespace) => (
              <option key={namespace}>{namespace}</option>
            ))}
          </select>
        </label>
        <label>
          Skill name
          <input
            name="name"
            required
            pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
            placeholder="nextjs-review"
          />
        </label>
        <label>
          Version
          <input
            name="version"
            required
            defaultValue="1.0.0"
            pattern="\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?"
          />
        </label>
        <label>
          Visibility
          <select name="visibility">
            <option value="public">Public</option>
            <option value="private">Private</option>
          </select>
        </label>
        <label className="full-span">
          Description
          <input
            name="description"
            required
            maxLength={1024}
            placeholder="Review Next.js changes for server/client boundary mistakes."
          />
        </label>
        <label>
          License
          <input name="license" placeholder="MIT" />
        </label>
        <label>
          Keywords
          <input
            name="keywords"
            placeholder="nextjs, review, server components"
          />
        </label>
        <label className="full-span">
          Skill instructions
          <textarea
            name="instructions"
            required
            rows={12}
            placeholder="# Review workflow&#10;&#10;Inspect the changed route, verify data boundaries, and report concrete findings…"
          />
        </label>
        <div className="full-span publish-actions">
          <button className="button" disabled={busy}>
            {busy ? "Publishing…" : "Publish immutable version"}
          </button>
          <span>Published versions cannot be replaced.</span>
        </div>
      </form>
      {error && <div className="form-error">{error}</div>}
    </section>
  );
}
