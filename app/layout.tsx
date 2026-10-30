import type { Metadata, Viewport } from "next";
import { Manrope, Inter } from "next/font/google";
import "./globals.css";

const display = Manrope({
  variable: "--font-display",
  subsets: ["latin"],
});

const body = Inter({
  variable: "--font-body",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Coastal Air Assessments | Request a mold or air quality assessment",
  description:
    "Mold and indoor air quality assessments in Martin, St. Lucie and Palm Beach counties. See pricing and request a date online.",
};

export const viewport: Viewport = {
  themeColor: "#1F5078",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body>{children}</body>
    </html>
  );
}
