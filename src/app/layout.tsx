import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import AppShell from "@/components/AppShell";
import ThemeProvider from "@/components/ThemeProvider";

export const metadata: Metadata = {
  title: "Build Hub — Inventory & Sales Management",
  description: "Manage property projects, track client purchases, record installment payments, and generate legal sale documents.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-surface text-text-primary antialiased selection:bg-brand-500/20 selection:text-brand-900">
        <ThemeProvider>
          <AppShell>{children}</AppShell>
        </ThemeProvider>
      </body>
    </html>
  );
}
