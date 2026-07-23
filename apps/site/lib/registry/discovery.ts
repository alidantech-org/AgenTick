import "server-only";

import { desc, eq, sql } from "drizzle-orm";
import { database } from "@/lib/db/client";
import { skills } from "@/lib/db/schema";

export interface RegistryKeywordFacet {
  keyword: string;
  count: number;
}

export async function listPopularRegistryKeywords(
  limit = 18,
): Promise<RegistryKeywordFacet[]> {
  const rows = await database().execute<{
    keyword: string;
    count: number;
  }>(sql`
    SELECT lower(keyword.value) AS keyword, count(*)::int AS count
    FROM registry.packages p
    CROSS JOIN LATERAL jsonb_array_elements_text(p.keywords) AS keyword(value)
    WHERE p.visibility = 'public'
      AND p.status = 'active'
      AND p.deleted_at IS NULL
      AND length(trim(keyword.value)) > 0
    GROUP BY lower(keyword.value)
    ORDER BY count(*) DESC, lower(keyword.value) ASC
    LIMIT ${Math.min(Math.max(limit, 1), 50)}
  `);

  return rows.map((row) => ({
    keyword: row.keyword,
    count: Number(row.count),
  }));
}

export async function registryDiscoveryStats(): Promise<{
  packages: number;
  downloads: number;
  publishers: number;
}> {
  const rows = await database().execute<{
    packages: number;
    downloads: number;
    publishers: number;
  }>(sql`
    SELECT
      count(*)::int AS packages,
      coalesce(sum(downloads_count), 0)::bigint AS downloads,
      count(DISTINCT owner_account_id)::int AS publishers
    FROM registry.packages
    WHERE visibility = 'public'
      AND status = 'active'
      AND deleted_at IS NULL
  `);
  const row = rows[0];
  return {
    packages: Number(row?.packages ?? 0),
    downloads: Number(row?.downloads ?? 0),
    publishers: Number(row?.publishers ?? 0),
  };
}
