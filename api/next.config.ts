import type { NextConfig } from "next";

const config: NextConfig = {
  typescript: { ignoreBuildErrors: false },
  eslint: { ignoreDuringBuilds: true },
  // This project is API-only — no pages rendered. Reduce output footprint.
  outputFileTracingIncludes: {
    "/api/**": ["./prisma/**"],
  },
};

export default config;
