"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  Layers,
  FileText,
  ClipboardList,
  Menu,
  X,
  ChevronRight,
  LogOut,
} from "lucide-react";
import { useState, useEffect, startTransition } from "react";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/projects", label: "Projects", icon: Building2 },
  { href: "/units", label: "Units", icon: Layers },
  { href: "/bookings", label: "Bookings", icon: ClipboardList },
  { href: "/documents", label: "Documents", icon: FileText },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userName, setUserName] = useState("Admin User");
  const [userEmail, setUserEmail] = useState("admin@buildhub.com");

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) {
      try {
        const u = JSON.parse(stored);
        startTransition(() => {
          setUserName(u.name || "Admin User");
          setUserEmail(u.email || "");
        });
      } catch {
        // ignore
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
  };

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  const nav = (
    <nav className="flex flex-1 flex-col gap-0.5 px-3 py-4">
      {navItems.map((item) => {
        const Icon = item.icon;
        const active = isActive(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setMobileOpen(false)}
            className={`group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
              active
                ? "bg-brand-600/20 text-brand-400"
                : "text-slate-400 hover:bg-sidebar-hover hover:text-slate-200"
            }`}
          >
            {active && (
              <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r bg-brand-400" />
            )}
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-200 ${
                active
                  ? "bg-brand-600 text-white shadow-sm shadow-brand-600/40"
                  : "text-slate-400 group-hover:text-slate-200"
              }`}
            >
              <Icon size={16} />
            </div>
            <span>{item.label}</span>
            {active && (
              <ChevronRight
                size={14}
                className="ml-auto text-brand-400/60"
              />
            )}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <>
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="fixed top-4 left-4 z-50 rounded-lg bg-sidebar p-2.5 text-slate-300 shadow-lg transition-colors hover:text-white lg:hidden"
      >
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-sidebar shadow-2xl transition-transform duration-300 lg:static lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center gap-3 border-b border-slate-800/80 px-5 py-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 font-bold text-white shadow-lg shadow-brand-600/30">
            BH
          </div>
          <div>
            <h1 className="text-base font-bold text-white">Build Hub</h1>
          </div>
        </div>

        {nav}

        <div className="border-t border-slate-800/80 p-4">
          <div className="mb-2 flex items-center gap-3 rounded-lg bg-slate-800/40 px-3 py-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-600/30 text-xs font-bold text-brand-400">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="truncate text-xs font-medium text-slate-300">
                {userName}
              </p>
              {userEmail && (
                <p className="truncate text-xs text-slate-500">{userEmail}</p>
              )}
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-xs font-medium text-slate-400 transition-colors hover:bg-red-500/10 hover:text-red-400"
          >
            <LogOut size={14} />
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
}
