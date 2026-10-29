import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  // Self-contained server bundle for the Docker image (frontend/Dockerfile).
  output: "standalone",
};

export default nextConfig;
