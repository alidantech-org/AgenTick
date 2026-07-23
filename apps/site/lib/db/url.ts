export function normalizePostgresUrl(rawValue: string): string {
  const value = rawValue.trim();
  if (!/^postgres(?:ql)?:\/\//i.test(value)) {
    throw new Error("DATABASE_URL must use the postgresql:// protocol");
  }

  const url = new URL(value);

  // Prisma-style URLs commonly include ?schema=public. postgres.js treats
  // unknown query parameters as startup parameters, but PostgreSQL has no
  // `schema` GUC, so the connection fails before migrations can run.
  url.searchParams.delete("schema");

  return url.toString();
}
