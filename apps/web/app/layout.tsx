import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "ThingsO — Open-source decision intelligence",
    template: "%s | ThingsO",
  },
  description: "Discover, analyze, compare and build with open-source software.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
