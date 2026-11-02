import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  // Phone photos are shrunk before upload; this leaves room for a few at once.
  // The draft control-plan PDFs are read from disk by a route, so make sure they ship with it.
  outputFileTracingIncludes: { "/resources/home-environmental-control-plan/**": ["./content/guides/home-plan/**"] },
  experimental: { serverActions: { bodySizeLimit: "12mb" } },
};

export default nextConfig;
