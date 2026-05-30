import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: [
    "@creator-suite/auth",
    "@creator-suite/db-pg",
    "@creator-suite/email",
    "@creator-suite/analytics",
    "@repo/ui"
  ]
};

export default nextConfig;
