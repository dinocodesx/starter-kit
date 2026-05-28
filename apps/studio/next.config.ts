import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: [
    "@creator-suite/auth",
    "@creator-suite/db",
    "@creator-suite/email"
  ]
};

export default nextConfig;
