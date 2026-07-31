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
  Bell,
  Moon,
  Sun,
  ChevronDown,
  User,
} from "lucide-react";
import { useState, useEffect, startTransition, type ReactNode, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "./ThemeProvider";
import Toast, { type ToastData } from "./Toast";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/projects", label: "Projects", icon: Building2 },
  { href: "/units", label: "Units", icon: Layers },
  { href: "/bookings", label: "Bookings", icon: ClipboardList },
  { href: "/documents", label: "Documents", icon: FileText },
];

function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
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
      } catch { /* ignore */ }
    }
  }, []);

  useEffect(() => { startTransition(() => setMobileOpen(false)); }, [pathname]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
  };

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  const sidebarVariants = {
    open: { width: collapsed ? 72 : 256, transition: { duration: 0.25, ease: [0.25, 0.1, 0.25, 1] } },
    closed: { width: collapsed ? 72 : 256, transition: { duration: 0.25, ease: [0.25, 0.1, 0.25, 1] } },
  };

  return (
    <>
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="fixed top-4 left-4 z-50 rounded-lg bg-sidebar p-2.5 text-slate-300 shadow-lg transition-colors hover:text-white lg:hidden"
      >
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      <motion.aside
        initial={false}
        animate={collapsed ? { width: 72 } : { width: 256 }}
        transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
        className={`fixed inset-y-0 left-0 z-40 flex flex-col bg-sidebar shadow-2xl lg:static ${mobileOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 overflow-hidden`}
      >
        <div className="flex items-center gap-3 border-b border-white/5 px-5 py-5">
          <motion.div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 font-bold text-white shadow-lg shadow-brand-600/30"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            BH
          </motion.div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.15 }}
              >
                <h1 className="text-base font-bold text-white">Build Hub</h1>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <nav className="flex flex-1 flex-col gap-0.5 px-3 py-4 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link key={item.href} href={item.href}>
                <motion.div
                  className={`group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-150 ${
                    active
                      ? "bg-brand-600/20 text-brand-400"
                      : "text-slate-400 hover:bg-sidebar-hover hover:text-slate-200"
                  }`}
                  whileHover={{ x: 2 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {active && (
                    <motion.span
                      layoutId="sidebar-active"
                      className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r bg-brand-400"
                      transition={{ duration: 0.2 }}
                    />
                  )}
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-all duration-200 ${
                      active
                        ? "bg-brand-600 text-white shadow-sm shadow-brand-600/40"
                        : "text-slate-400 group-hover:text-slate-200"
                    }`}
                  >
                    <Icon size={16} />
                  </div>
                  <AnimatePresence>
                    {!collapsed && (
                      <motion.span
                        initial={{ opacity: 0, x: -6 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -6 }}
                        transition={{ duration: 0.15 }}
                        className="truncate"
                      >
                        {item.label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                  {active && !collapsed && (
                    <ChevronRight size={14} className="ml-auto shrink-0 text-brand-400/60" />
                  )}
                </motion.div>
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-white/5 p-4">
          <div className="mb-2 flex items-center gap-3 rounded-lg bg-white/5 px-3 py-2.5">
            <motion.div
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-600/30 text-xs font-bold text-brand-400"
              whileHover={{ scale: 1.1 }}
            >
              {userName.charAt(0).toUpperCase()}
            </motion.div>
            <AnimatePresence>
              {!collapsed && (
                <motion.div
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -6 }}
                  transition={{ duration: 0.15 }}
                  className="min-w-0 flex-1"
                >
                  <p className="truncate text-xs font-medium text-slate-300">{userName}</p>
                  {userEmail && <p className="truncate text-xs text-slate-500">{userEmail}</p>}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <motion.button
            onClick={handleLogout}
            className="flex w-full items-center justify-center gap-3 rounded-lg px-3 py-2.5 text-xs font-medium text-slate-400 transition-colors hover:bg-red-500/10 hover:text-red-400"
            whileHover={{ x: 2 }}
            whileTap={{ scale: 0.97 }}
          >
            <LogOut size={14} />
            <AnimatePresence>{!collapsed && <span>Sign Out</span>}</AnimatePresence>
          </motion.button>
        </div>

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden border-t border-white/5 p-3 text-center text-xs text-slate-500 transition-colors hover:text-slate-300 lg:block"
        >
          {collapsed ? "\u2192" : "\u2190"}
        </button>
      </motion.aside>
    </>
  );
}

// ─── Header ──────────────────────────────────────────────────────────────────

function Header() {
  const router = useRouter();
  const { theme, toggle } = useTheme();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [userName, setUserName] = useState("Admin User");
  const [toast, setToast] = useState<ToastData | null>(null);

  const handleSignOut = useCallback(() => {
    try {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      setUserMenuOpen(false);
      setToast({ message: "Signed out successfully.", type: "success" });
      setTimeout(() => router.push("/login"), 800);
    } catch {
      setToast({ message: "Failed to sign out. Please try again.", type: "error" });
    }
  }, [router]);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) {
      try {
        const u = JSON.parse(stored);
        startTransition(() => setUserName(u.name || "Admin User"));
      } catch { /* ignore */ }
    }
  }, []);

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-surface/80 backdrop-blur-xl">
      <div className="flex h-14 items-center justify-end gap-2 px-4 sm:px-6">
        <div className="relative">
          <motion.button
            onClick={() => { setNotifOpen(!notifOpen); setUserMenuOpen(false); }}
            className="relative flex h-8 w-8 items-center justify-center rounded-lg text-text-secondary transition-colors hover:bg-surface-card hover:text-text-primary"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <Bell size={16} />
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-brand-500 ring-2 ring-surface" />
          </motion.button>
          <AnimatePresence>
            {notifOpen && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.96 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-full mt-2 w-72 rounded-xl border border-border bg-surface-card p-4 shadow-xl"
              >
                <p className="text-xs font-semibold text-text-primary">Notifications</p>
                <p className="mt-2 text-xs text-text-secondary">No new notifications</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <motion.button
          onClick={toggle}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-text-secondary transition-colors hover:bg-surface-card hover:text-text-primary"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
        >
          {theme === "light" ? <Moon size={16} /> : <Sun size={16} />}
        </motion.button>

        <div className="relative">
          <motion.button
            onClick={() => { setUserMenuOpen(!userMenuOpen); setNotifOpen(false); }}
            className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-text-secondary transition-colors hover:bg-surface-card hover:text-text-primary"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-600/20 text-xs font-bold text-brand-600">
              {userName.charAt(0).toUpperCase()}
            </div>
            <span className="hidden text-xs font-medium sm:inline">{userName}</span>
            <ChevronDown size={12} className="hidden sm:inline" />
          </motion.button>
          <AnimatePresence>
            {userMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.96 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-full mt-2 w-48 rounded-xl border border-border bg-surface-card p-1.5 shadow-xl"
              >
                <motion.button
                  onClick={() => { setUserMenuOpen(false); router.push("/profile"); }}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-text-secondary transition-colors hover:bg-surface hover:text-text-primary"
                  whileHover={{ x: 2 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <User size={14} />
                  Profile
                </motion.button>
                <motion.button
                  onClick={handleSignOut}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-red-500 transition-colors hover:bg-red-500/10"
                  whileHover={{ x: 2 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <LogOut size={14} />
                  Sign Out
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      <Toast toast={toast} onDismiss={() => setToast(null)} />
    </header>
  );
}

// ─── Shell Layout ────────────────────────────────────────────────────────────

export default function ShellLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-surface">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header />
        <main className="flex-1 overflow-auto">
          <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
