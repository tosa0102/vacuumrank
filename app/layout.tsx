// app/layout.tsx — clean root layout (no global topbar)
import "./globals.css";
import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  metadataBase: new URL("https://rankpilot.co.uk"),
  title: {
    default: "RankPilot",
    template: "%s — RankPilot",
  },
  description:
    "Independent, lab-style rankings that convert — starting with robot vacuums.",
};

export const viewport: Viewport = {
  colorScheme: "light",
  themeColor: "#0F172A",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-white text-slate-900 antialiased">
        {/* anchor so `#top` links work */}
        <div id="top" />
        {children}
      </body>
    </html>
  );
}
