"use client";

import { Building2, Check, MailPlus, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { FormField } from "@/components/form-field";

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
  const [busyAction, setBusyAction] = useState<"create" | "invite" | "join" | null>(null);
  const [createStep, setCreateStep] = useState<"details" | "review">("details");
  const [organisation, setOrganisation] = useState({ name: "", slug: "", description: "" });
  const [invite, setInvite] = useState({ organizationId: organizations[0]?.id ?? "", email: "", role: "member" });
  const [joinCode, setJoinCode] = useState("");

  async function submit(
    action: "create" | "invite" | "join",
    endpoint: string,
    payload: Record<string, string>,
  ) {
    setBusyAction(action);
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
    setBusyAction(null);
    if (!response.ok) {
      setError(data.error ?? "Request failed");
      return;
    }
    setMessage(
      data.email
        ? `Invitation sent to ${data.email}`
        : data.slug
          ? `${data.name ?? "Organization"} is ready`
          : "Organisation joined successfully",
    );
    if (action === "create") {
      setOrganisation({ name: "", slug: "", description: "" });
      setCreateStep("details");
    }
    if (action === "invite") setInvite((current) => ({ ...current, email: "" }));
    if (action === "join") setJoinCode("");
    router.refresh();
  }

  function updateOrganisationName(name: string) {
    const slug = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    setOrganisation((current) => ({ ...current, name, slug: current.slug || slug }));
  }

  return (
    <div className="organisation-manager">
      <section className="organisation-form-card organisation-create-card">
        <header className="organisation-card-header">
          <span className="organisation-card-icon"><Building2 aria-hidden="true" /></span>
          <div>
            <span className="kicker">New namespace</span>
            <h2>Create an organisation</h2>
            <p>Set up a shared publisher identity for your team.</p>
          </div>
        </header>

        <div className="mini-stepper" aria-label="Organisation creation progress">
          <span className={createStep === "details" ? "active" : "complete"}>1. Details</span>
          <span className={createStep === "review" ? "active" : ""}>2. Review</span>
        </div>

        {createStep === "details" ? (
          <div className="organisation-form-stack">
            <FormField id="organisation-name" label="Organisation name" hint="Visible to members and package users." required>
              <input
                id="organisation-name"
                value={organisation.name}
                onChange={(event) => updateOrganisationName(event.target.value)}
                placeholder="Skillib Labs"
                autoComplete="organization"
              />
            </FormField>
            <FormField id="organisation-slug" label="Registry namespace" hint="Used in package names and URLs." required>
              <div className="prefixed-input"><span>@</span><input id="organisation-slug" value={organisation.slug} onChange={(event) => setOrganisation((current) => ({ ...current, slug: event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") }))} placeholder="skillib-labs" autoComplete="off" /></div>
            </FormField>
            <FormField id="organisation-description" label="Description" hint={`${organisation.description.length}/280 characters`}>
              <textarea id="organisation-description" value={organisation.description} onChange={(event) => setOrganisation((current) => ({ ...current, description: event.target.value }))} maxLength={280} rows={4} placeholder="What your team builds and shares." />
            </FormField>
            <button type="button" className="button" onClick={() => setCreateStep("review")} disabled={organisation.name.trim().length < 2 || organisation.slug.length < 2}>
              Review organisation
            </button>
          </div>
        ) : (
          <div className="organisation-review">
            <dl>
              <div><dt>Name</dt><dd>{organisation.name}</dd></div>
              <div><dt>Namespace</dt><dd>@{organisation.slug}</dd></div>
              <div><dt>Description</dt><dd>{organisation.description || "No description"}</dd></div>
            </dl>
            <div className="organisation-review-note">
              <Check aria-hidden="true" />
              <p>You will become the first owner and can invite publishers after creation.</p>
            </div>
            <div className="organisation-card-actions">
              <button type="button" className="button button-secondary" onClick={() => setCreateStep("details")}>Back</button>
              <button type="button" className="button" disabled={busyAction === "create"} onClick={() => void submit("create", "/api/account/organizations", organisation)}>
                {busyAction === "create" ? "Creating Organisation…" : "Create Organisation"}
              </button>
            </div>
          </div>
        )}
      </section>

      <section className="organisation-form-card">
        <header className="organisation-card-header">
          <span className="organisation-card-icon"><MailPlus aria-hidden="true" /></span>
          <div>
            <span className="kicker">Email invitation</span>
            <h2>Invite a teammate</h2>
            <p>Choose the minimum role they need.</p>
          </div>
        </header>
        {organizations.length === 0 ? (
          <div className="compact-empty-state">Create an organisation before inviting teammates.</div>
        ) : (
          <form className="organisation-form-stack" onSubmit={(event) => { event.preventDefault(); void submit("invite", "/api/account/organizations/invite", invite); }}>
            <FormField id="invite-organisation" label="Organisation" required>
              <select id="invite-organisation" value={invite.organizationId} onChange={(event) => setInvite((current) => ({ ...current, organizationId: event.target.value }))}>
                {organizations.map((organization) => <option key={organization.id} value={organization.id}>{organization.name}</option>)}
              </select>
            </FormField>
            <FormField id="invite-email" label="Email address" hint="The invitation is bound to this address." required>
              <input id="invite-email" value={invite.email} onChange={(event) => setInvite((current) => ({ ...current, email: event.target.value }))} type="email" autoComplete="email" required placeholder="teammate@example.com" />
            </FormField>
            <FormField id="invite-role" label="Role" hint="Member reads, publisher releases, admin manages." required>
              <select id="invite-role" value={invite.role} onChange={(event) => setInvite((current) => ({ ...current, role: event.target.value }))}>
                <option value="member">Member — collaborate and read</option>
                <option value="publisher">Publisher — publish releases</option>
                <option value="admin">Admin — manage members and packages</option>
              </select>
            </FormField>
            <button className="button" disabled={busyAction === "invite"}>{busyAction === "invite" ? "Sending Invitation…" : "Send Invitation"}</button>
          </form>
        )}
      </section>

      <section className="organisation-form-card organisation-join-card">
        <header className="organisation-card-header">
          <span className="organisation-card-icon"><Users aria-hidden="true" /></span>
          <div>
            <span className="kicker">Have a code?</span>
            <h2>Join an organisation</h2>
            <p>Paste the invitation exactly as it appears in your email.</p>
          </div>
        </header>
        <form className="organisation-join-form" onSubmit={(event) => { event.preventDefault(); void submit("join", "/api/account/organizations/join", { code: joinCode }); }}>
          <FormField id="join-organisation-code" label="Invitation code" hint="Codes contain at least 12 characters." required>
            <input id="join-organisation-code" value={joinCode} onChange={(event) => setJoinCode(event.target.value.trim())} required minLength={12} spellCheck={false} autoComplete="off" placeholder="skl_join_…" />
          </FormField>
          <button className="button" disabled={busyAction === "join" || joinCode.length < 12}>{busyAction === "join" ? "Joining Organisation…" : "Join Organisation"}</button>
        </form>
      </section>

      {message && <div className="form-notice" role="status">{message}</div>}
      {error && <div className="form-error" role="alert">{error}</div>}
    </div>
  );
}
