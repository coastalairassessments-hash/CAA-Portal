import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  // Phone photos are shrunk before upload; this leaves room for a few at once.
  experimental: { serverActions: { bodySizeLimit: "12mb" } },
};

export default nextConfig;
