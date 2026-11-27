import type { NextConfig } from "next";

// Sent with every page. Booking and invoice links carry a private token in the address, so the
// referrer policy keeps that address from travelling to other sites (the Google review link, for one).
export const SECURITY_HEADERS = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(self), microphone=(), geolocation=(), payment=()" },
  { key: "Strict-Transport-Security", value: "max-age=31536000" },
  // Not a full script policy (Next needs inline scripts): it stops framing, plugins and base-tag tricks.
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'; object-src 'none'; base-uri 'self'" },
];

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: SECURITY_HEADERS }];
  },
  // Phone photos are shrunk before upload; this leaves room for a few at once.
  // The draft control-plan PDFs are read from disk by a route, so make sure they ship with it.
  outputFileTracingIncludes: { "/resources/home-environmental-control-plan/**": ["./content/guides/home-plan/**"] },
  experimental: { serverActions: { bodySizeLimit: "12mb" } },
};

export default nextConfig;
