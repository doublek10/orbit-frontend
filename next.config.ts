import type { NextConfig } from "next";

const GATEWAY_URL = process.env.GATEWAY_URL ?? "http://localhost:3001";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      // Proxies all Gateway calls through the frontend's own origin so
      // the Gateway's session cookie is a normal first-party cookie in
      // the browser. The frontend still never talks to the Kernel, and
      // never implements Gateway logic here - this is transport only.
      {
        source: "/gateway/:path*",
        destination: `${GATEWAY_URL}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
