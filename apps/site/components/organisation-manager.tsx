"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function OrganisationManager({
  organizations,
}: {
  organizations: Array<{
    id: string;
    name: string;
    slug: string;
    role: string;
  }>;
}) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function submit(endpoint: string, payload: Record<string, string>) {
    setError("");
    setMessage("");
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = (await response.json()) as {
      error?: string;
      name?: string;
      slug?: string;
      email?: string;
    };
    if (!response.ok) {
      setError(data.error ?? "Request failed");
      return;
    }
    setMessage(
      data.email
        ? `Invitation sent to ${data.email}`
        : `${data.name ?? "Organization"} is ready`,
    );
    router.refresh();
  }

  return (
    <div className="manager-grid">
      <section className="account-panel">
        <span className="kicker">New namespace</span>
        <h2>Create an organisation</h2>
        <form
          className="form-stack"
          onSubmit={(event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            void submit("/api/account/organizations", {
              name: String(form.get("name") ?? ""),
              slug: String(form.get("slug") ?? ""),
              description: String(form.get("description") ?? ""),
            });
          }}
        >
          <label>
            Name
            <input name="name" required placeholder="AgenTick Labs" />
          </label>
          <label>
            Registry slug
            <input name="slug" required placeholder="agentick-labs" />
          </label>
          <label>
            Description
            <textarea
              name="description"
              rows={3}
              placeholder="What your team builds and shares."
            />
          </label>
          <button className="button">Create organisation</button>
        </form>
      </section>

      <section className="account-panel">
        <span className="kicker">Email invitation</span>
        <h2>Invite a teammate</h2>
        {organizations.length === 0 ? (
          <p>Create an organisation first.</p>
        ) : (
          <form
            className="form-stack"
            onSubmit={(event) => {
              event.preventDefault();
              const form = new FormData(event.currentTarget);
              void submit("/api/account/organizations/invite", {
                organizationId: String(form.get("organizationId") ?? ""),
                email: String(form.get("email") ?? ""),
                role: String(form.get("role") ?? "member"),
              });
            }}
          >
            <label>
              Organisation
              <select name="organizationId">
                {organizations.map((organization) => (
                  <option key={organization.id} value={organization.id}>
                    {organization.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Email
              <input
                name="email"
                type="email"
                required
                placeholder="teammate@example.com"
              />
            </label>
            <label>
              Role
              <select name="role">
                <option value="member">Member</option>
                <option value="publisher">Publisher</option>
                <option value="admin">Admin</option>
              </select>
            </label>
            <button className="button">Send invitation code</button>
          </form>
        )}
      </section>

      <section className="account-panel full-span">
        <span className="kicker">Have a code?</span>
        <h2>Join an organisation</h2>
        <form
          className="inline-form"
          onSubmit={(event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            void submit("/api/account/organizations/join", {
              code: String(form.get("code") ?? ""),
            });
          }}
        >
          <input name="code" required minLength={12} placeholder="agt_join_…" />
          <button className="button">Join organisation</button>
        </form>
      </section>
      {message && <div className="form-notice full-span">{message}</div>}
      {error && <div className="form-error full-span">{error}</div>}
    </div>
  );
}
