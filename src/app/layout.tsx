import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import AppShell from "@/components/AppShell";

export const metadata: Metadata = {
  title: "Al Hamd Real Estate — Inventory & Sales Management",
  description:
    "Manage property projects, track client purchases, record installment payments, and generate legal sale documents.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-surface text-slate-900 antialiased selection:bg-brand-500/20 selection:text-brand-900">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
