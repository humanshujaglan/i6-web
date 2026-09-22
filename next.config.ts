import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {},
  images: {
    minimumCacheTTL: 0,
  },
  serverExternalPackages: [
    "@coinbase/cdp-sdk",
    "@base-org/account",
    "pino-pretty",
    "lokijs",
    "encoding",
  ],
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };
    config.externals.push("pino-pretty", "lokijs", "encoding");
    return config;
  },
};

export default nextConfig;
