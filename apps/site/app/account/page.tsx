import { TokenManager } from "@/components/token-manager";
import { getAccountOverview, listApiTokens } from "@/lib/account/service";
import { requireAccount } from "@/lib/auth/dal";
import { formatNumber } from "@/lib/format";

export default async function AccountPage() {
  const account = await requireAccount();
  const [overview, tokens] = await Promise.all([
    getAccountOverview(account.id),
    listApiTokens(account.id),
  ]);
  return (
    <>
      <section className="account-stat-grid">
        <article>
          <span>Skills</span>
          <strong>{overview.skillCount}</strong>
          <p>Personal packages</p>
        </article>
        <article>
          <span>Downloads</span>
          <strong>{formatNumber(overview.downloadCount)}</strong>
          <p>Across your skills</p>
        </article>
        <article>
          <span>Organisations</span>
          <strong>{overview.organizationCount}</strong>
          <p>Team namespaces</p>
        </article>
        <article>
          <span>CLI tokens</span>
          <strong>{overview.tokenCount}</strong>
          <p>Active credentials</p>
        </article>
      </section>
      <TokenManager initialTokens={tokens} />
    </>
  );
}
