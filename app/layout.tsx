
import "./globals.css";
import Link from "next/link";

export const metadata = { title: "Robot Vacuum Rankings", description: "Country-specific, desk-tested rankings" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <main className="container py-8">{children}</main>
        <footer className="container py-8 text-sm text-gray-500 border-t mt-8">
          © {new Date().getFullYear()} VacuumRank. Desk-only comparisons. Affiliate disclosure applies.
        </footer>
      </body>
    </html>
  );
}
