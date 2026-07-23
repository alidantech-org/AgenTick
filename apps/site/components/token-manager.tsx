"use client";

import { Check, Clipboard, KeyRound, ShieldCheck, Trash2 } from "lucide-react";
import { useState } from "react";
import { FormField } from "@/components/form-field";

interface TokenRecord {
  id: string;
  prefix: string;
  name: string;
  scopes: string[];
  lastUsedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
}

export function TokenManager({
  initialTokens,
}: {
  initialTokens: TokenRecord[];
}) {
  const [tokens, setTokens] = useState(initialTokens);
  const [name, setName] = useState("My computer");
  const [createdToken, setCreatedToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [pendingRevoke, setPendingRevoke] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function createToken(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setCopied(false);
    const response = await fetch("/api/account/tokens", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name }),
    });
    const data = (await response.json()) as { token?: string; error?: string };
    if (!response.ok || !data.token) {
      setError(data.error ?? "Unable to create token");
      setBusy(false);
      return;
    }
    setCreatedToken(data.token);
    const tokensResponse = await fetch("/api/account/tokens");
    const tokensData = (await tokensResponse.json()) as {
      tokens: TokenRecord[];
    };
    setTokens(tokensData.tokens);
    setBusy(false);
  }

  async function copyToken() {
    if (!createdToken) return;
    await navigator.clipboard.writeText(createdToken);
    setCopied(true);
  }

  async function revoke(id: string) {
    const response = await fetch(`/api/account/tokens/${id}`, {
      method: "DELETE",
    });
    if (response.ok) {
      setTokens((current) => current.filter((token) => token.id !== id));
      setPendingRevoke(null);
    } else {
      setError("Unable to revoke this token. Try again.");
    }
  }

  return (
    <div className="token-workspace">
      <section className="token-create-card">
        <header className="token-card-header">
          <span><KeyRound aria-hidden="true" /></span>
          <div>
            <h2>Create a publishing token</h2>
            <p>Name the device or automation that will use this credential.</p>
          </div>
        </header>
        {!createdToken ? (
          <form className="token-create-form" onSubmit={createToken}>
            <FormField
              id="token-name"
              label="Token name"
              hint="Use a recognisable device or workflow name."
              required
            >
              <input
                id="token-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                minLength={2}
                maxLength={60}
                required
                autoComplete="off"
                placeholder="Work laptop"
              />
            </FormField>
            <div className="token-scope-summary">
              <ShieldCheck aria-hidden="true" />
              <div>
                <strong>Default registry access</strong>
                <p>Read and publish skills in namespaces your account can access.</p>
              </div>
            </div>
            <button className="button" disabled={busy || name.trim().length < 2}>
              {busy ? "Creating Token…" : "Create Token"}
            </button>
          </form>
        ) : (
          <div className="token-secret-step" role="status">
            <header>
              <span><Check aria-hidden="true" /></span>
              <div>
                <strong>Token created</strong>
                <p>Copy it now. Skillib stores only a secure hash and cannot show it again.</p>
              </div>
            </header>
            <code>{createdToken}</code>
            <div className="token-secret-actions">
              <button type="button" className="button" onClick={() => void copyToken()}>
                {copied ? <Check aria-hidden="true" /> : <Clipboard aria-hidden="true" />}
                {copied ? "Copied" : "Copy Token"}
              </button>
              <button type="button" className="button button-secondary" onClick={() => { setCreatedToken(null); setCopied(false); setName("My computer"); }}>
                Done
              </button>
            </div>
            <p className="token-cli-hint">Run <code>skillib login</code>, then paste this token when prompted.</p>
          </div>
        )}
        {error && <div className="form-error" role="alert">{error}</div>}
      </section>

      <section className="token-list-card">
        <header className="token-list-heading">
          <div>
            <h2>Active tokens</h2>
            <p>Review where credentials are used and revoke anything unfamiliar.</p>
          </div>
          <span>{tokens.length} active</span>
        </header>
        <div className="token-list">
          {tokens.length === 0 ? (
            <div className="compact-empty-state">No active CLI tokens.</div>
          ) : (
            tokens.map((token) => (
              <article className="token-row" key={token.id}>
                <div className="token-identity">
                  <span><KeyRound aria-hidden="true" /></span>
                  <div>
                    <strong>{token.name}</strong>
                    <code>{token.prefix}…</code>
                  </div>
                </div>
                <dl className="token-meta">
                  <div><dt>Permissions</dt><dd>{token.scopes.join(", ")}</dd></div>
                  <div><dt>Last used</dt><dd>{token.lastUsedAt ? new Date(token.lastUsedAt).toLocaleDateString() : "Never"}</dd></div>
                  <div><dt>Expires</dt><dd>{token.expiresAt ? new Date(token.expiresAt).toLocaleDateString() : "No expiry"}</dd></div>
                </dl>
                {pendingRevoke === token.id ? (
                  <div className="token-revoke-confirm">
                    <span>Revoke this token?</span>
                    <button type="button" className="button button-small button-secondary" onClick={() => setPendingRevoke(null)}>Cancel</button>
                    <button type="button" className="button button-small token-danger-button" onClick={() => void revoke(token.id)}>Revoke</button>
                  </div>
                ) : (
                  <button type="button" className="icon-button destructive-icon-button" aria-label={`Revoke ${token.name}`} onClick={() => setPendingRevoke(token.id)}>
                    <Trash2 aria-hidden="true" />
                  </button>
                )}
              </article>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
