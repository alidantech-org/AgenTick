import type { Metadata } from "next";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const metadata: Metadata = {
  title: {
    default: "AgenTick — Make AI coding accountable",
    template: "%s · AgenTick",
  },
  description:
    "Watch AI-assisted software work in real time, verify it against project rules, and publish reusable Agent Skills with immutable versions.",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  ),
  openGraph: {
    title: "AgenTick — Make AI coding accountable",
    description:
      "Watch AI-assisted software work, verify it against project rules, and share versioned Agent Skills.",
    type: "website",
  },
  twitter: { card: "summary_large_image" },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <SiteHeader />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
