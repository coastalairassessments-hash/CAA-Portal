import type { MetadataRoute } from "next";

// Private pages (a client's booking, invoice and payment links, the admin, the contractor portal)
// are reached only by their own link and should never be listed by a search engine.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/booking/", "/pay/", "/invoice/", "/contractor", "/api/"] }],
  };
}
