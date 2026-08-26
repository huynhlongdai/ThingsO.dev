import type { Metadata } from "next";
import Script from "next/script";
import { DecisionAnalyticsObserver } from "@/components/decision-analytics-observer";
import "./globals.css";
import "./product.css";
import "./theme-v2.css";
import "./surface-v3.css";
import "./surface-v4.css";
import "./readiness-v1.css";

const configuredUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
const metadataBase = new URL(configuredUrl);

export const metadata: Metadata = {
  metadataBase,
  title: { default: "ThingsO — Open-source decision intelligence", template: "%s | ThingsO" },
  description: "Discover, analyze, compare and build with open-source software using source facts, deterministic project health and reviewed evidence-backed intelligence.",
  applicationName: "ThingsO",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    title: "ThingsO — Open-source decision intelligence",
    description: "Evidence-backed discovery, comparison and build guidance for open-source software.",
    url: "/",
    siteName: "ThingsO",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const analyticsToken = process.env.NEXT_PUBLIC_CF_WEB_ANALYTICS_TOKEN;
  return (
    <html lang="en">
      <body>
        <a className="skip-link" href="#app-content">Skip to content</a>
        <DecisionAnalyticsObserver />
        <div id="app-content" tabIndex={-1}>{children}</div>
      </body>
      {analyticsToken ? (
        <Script
          defer
          src="https://static.cloudflareinsights.com/beacon.min.js"
          data-cf-beacon={JSON.stringify({ token: analyticsToken })}
          strategy="afterInteractive"
        />
      ) : null}
    </html>
  );
}
