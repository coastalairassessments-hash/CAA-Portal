import type { Metadata } from "next";

// Makes "Add to Home Screen" install this as a small app named CAA with the logo.
export const metadata: Metadata = {
  manifest: "/admin.webmanifest",
  icons: { apple: "/apple-touch-icon.png" },
  appleWebApp: { capable: true, title: "CAA", statusBarStyle: "default" },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <div className="adm">{children}</div>;
}
