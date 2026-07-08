import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VulnScanner | Security Dashboard",
  description: "Enterprise vulnerability scanning and orchestration platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-navy-900 text-slate-100 min-h-screen antialiased">
        {children}
      </body>
    </html>
  );
}
