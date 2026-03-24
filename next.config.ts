import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  basePath: "/rpm-auto-lab",
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
