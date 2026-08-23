import type { Metadata } from "next";
import "./globals.css";

const configuredUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
const metadataBase = new URL(configuredUrl);

export const metadata: Metadata = {
  metadataBase,
  title: {
    default: "ThingsO — Open-source decision intelligence",
    template: "%s | ThingsO",
  },
  description: "Discover, analyze, compare and build with open-source software using source facts, deterministic project health and reviewed AI inference.",
  applicationName: "ThingsO",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    title: "ThingsO — Open-source decision intelligence",
    description: "Evidence-backed discovery, comparison and Build Ideas for open-source software.",
    url: "/",
    siteName: "ThingsO",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
