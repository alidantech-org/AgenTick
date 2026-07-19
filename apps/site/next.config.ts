import type { NextConfig } from "next";

const config: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // CI runs the site's strict `tsc --noEmit` gate before `next build`.
  // Avoid a second Next-managed compiler resolution step inside the pnpm workspace.
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default config;
