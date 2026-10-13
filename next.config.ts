import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1"],
  output: "standalone",
  // Maintainer instructions are versioned; development must not rewrite them.
  agentRules: false,
};

export default nextConfig;
