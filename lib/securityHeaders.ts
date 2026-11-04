// Headers sent with every page. The booking link in the address bar is the client's key, so it must never
// travel to another site in a Referer header. The CSP below holds only the directives that cannot break a page;
// a script allow-list needs a nonce plan and a trial run first.
export const SECURITY_HEADERS: { key: string; value: string }[] = [
  { key: "Referrer-Policy", value: "same-origin" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'; base-uri 'self'; object-src 'none'; form-action 'self'" },
];
