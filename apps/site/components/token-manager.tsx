"use client";

import { useState } from "react";

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
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function createToken(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
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

  async function revoke(id: string) {
    if (
      !window.confirm("Revoke this token? Any CLI using it will stop working.")
    )
      return;
    const response = await fetch(`/api/account/tokens/${id}`, {
      method: "DELETE",
    });
    if (response.ok)
      setTokens((current) => current.filter((token) => token.id !== id));
  }

  return (
    <section className="account-panel">
      <div className="panel-heading">
        <div>
          <span className="kicker">CLI access</span>
          <h2>Publishing tokens</h2>
          <p>
            Create a token, run <code>skillib login</code>, then paste it when
            prompted.
          </p>
        </div>
      </div>

      <form className="inline-form" onSubmit={createToken}>
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Token name"
        />
        <button className="button" disabled={busy}>
          {busy ? "Creating…" : "Create token"}
        </button>
      </form>

      {createdToken && (
        <div className="secret-reveal">
          <div>
            <strong>Copy this token now</strong>
            <p>It will not be shown again.</p>
          </div>
          <code>{createdToken}</code>
          <button
            className="button button-small"
            onClick={() => void navigator.clipboard.writeText(createdToken)}
          >
            Copy token
          </button>
        </div>
      )}
      {error && <div className="form-error">{error}</div>}

      <div className="token-list">
        {tokens.length === 0 ? (
          <p className="empty-state">No active CLI tokens.</p>
        ) : (
          tokens.map((token) => (
            <div className="token-row" key={token.id}>
              <div>
                <strong>{token.name}</strong>
                <code>{token.prefix}…</code>
              </div>
              <div className="token-meta">
                <span>{token.scopes.join(", ")}</span>
                <span>
                  {token.lastUsedAt
                    ? `Used ${new Date(token.lastUsedAt).toLocaleDateString()}`
                    : "Never used"}
                </span>
              </div>
              <button
                className="danger-link"
                onClick={() => void revoke(token.id)}
              >
                Revoke
              </button>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
