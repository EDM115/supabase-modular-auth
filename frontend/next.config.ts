import type { NextConfig } from "next";

const proxyTarget = process.env.FRONTEND_PROXY_TARGET;

const nextConfig: NextConfig = {
  async rewrites() {
    if (!proxyTarget) {
      return [];
    }

    return [
      {
        source: "/auth/:path*",
        destination: `${proxyTarget}/auth/:path*`,
      },
      {
        source: "/health",
        destination: `${proxyTarget}/health`,
      },
    ];
  },
};

export default nextConfig;
