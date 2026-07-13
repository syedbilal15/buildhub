import Sidebar from "@/components/Sidebar";
import type { ReactNode } from "react";

export default function ShellLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-surface">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="mx-auto max-w-7xl p-4 pt-20 sm:p-6 lg:p-8 lg:pt-8">
          {children}
        </div>
      </main>
    </div>
  );
}
