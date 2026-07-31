"use client";

import { usePathname } from "next/navigation";
import ShellLayout from "./ShellLayout";
import PageTransition from "./PageTransition";
import type { ReactNode } from "react";

export default function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/login";

  if (isLoginPage) {
    return <>{children}</>;
  }

  return (
    <ShellLayout>
      <PageTransition>{children}</PageTransition>
    </ShellLayout>
  );
}
