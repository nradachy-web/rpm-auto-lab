import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  basePath: "/rpm-auto-lab",
  images: {
    unoptimized: true,
  },
  // Skip TypeScript/ESLint checks during build — this project uses tsc directly
  // in CI. Inline checks were hanging during build (known Next 16 issue on
  // iCloud-synced paths).
  typescript: { ignoreBuildErrors: true },
};

export default nextConfig;
