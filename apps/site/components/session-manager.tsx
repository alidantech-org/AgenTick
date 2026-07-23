import { Laptop, ShieldCheck, Smartphone, Trash2 } from "lucide-react";
import type { AccountSessionSummary } from "@/lib/account/security";
import {
  revokeOtherSessionsAction,
  revokeSessionAction,
} from "@/app/account/security/actions";
import { formatDate } from "@/lib/format";

function deviceIcon(userAgent: string | null) {
  return /mobile|android|iphone|ipad/i.test(userAgent ?? "")
    ? Smartphone
    : Laptop;
}

function deviceName(userAgent: string | null): string {
  if (!userAgent) return "Unknown device";
  if (/iphone/i.test(userAgent)) return "iPhone";
  if (/ipad/i.test(userAgent)) return "iPad";
  if (/android/i.test(userAgent)) return "Android device";
  if (/windows/i.test(userAgent)) return "Windows computer";
  if (/macintosh|mac os/i.test(userAgent)) return "Mac";
  if (/linux/i.test(userAgent)) return "Linux computer";
  return "Browser session";
}

export function SessionManager({ sessions }: { sessions: AccountSessionSummary[] }) {
  const otherCount = sessions.filter((session) => !session.current).length;

  return (
    <section className="account-panel security-panel">
      <div className="account-panel-heading">
        <div>
          <span className="section-label">Account security</span>
          <h2>Active sessions</h2>
          <p>
            Review every signed-in device and revoke anything you do not
            recognise.
          </p>
        </div>
        {otherCount > 0 && (
          <form action={revokeOtherSessionsAction}>
            <button className="button button-secondary button-small" type="submit">
              <ShieldCheck size={16} />
              Revoke other sessions
            </button>
          </form>
        )}
      </div>

      <div className="session-list">
        {sessions.map((session) => {
          const Icon = deviceIcon(session.userAgent);
          return (
            <article className="session-row" key={session.id}>
              <div className="session-icon" aria-hidden="true">
                <Icon size={18} />
              </div>
              <div className="session-copy">
                <div className="session-title-row">
                  <strong>{deviceName(session.userAgent)}</strong>
                  {session.current && <span className="status-pill">Current session</span>}
                </div>
                <p>{session.userAgent ?? "User agent unavailable"}</p>
                <div className="session-meta">
                  <span>Last active {formatDate(session.lastSeenAt)}</span>
                  <span>Created {formatDate(session.createdAt)}</span>
                  {session.ipFingerprint && (
                    <span>IP fingerprint {session.ipFingerprint}</span>
                  )}
                </div>
              </div>
              {!session.current && (
                <form action={revokeSessionAction}>
                  <input name="sessionId" type="hidden" value={session.id} />
                  <button
                    aria-label="Revoke session"
                    className="icon-button destructive-icon-button"
                    type="submit"
                  >
                    <Trash2 size={16} />
                  </button>
                </form>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
