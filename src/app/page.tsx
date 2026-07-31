"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Building2, Layers, CheckCircle2, Clock, IndianRupee, AlertTriangle,
  ArrowRight, Activity, CircleDashed, BadgeCheck, TrendingUp,
} from "lucide-react";
import Button from "@/components/Button";
import Spinner from "@/components/Spinner";
import AnimatedCounter from "@/components/AnimatedCounter";
import Skeleton from "@/components/Skeleton";

interface DashboardData {
  totalProjects: number; totalUnits: number; availableUnits: number;
  reservedUnits: number; bookedUnits: number; soldUnits: number;
  totalRevenue: string; totalPaid: string; pendingInstallments: number;
  overdueInstallments: number;
  recentActivities: Array<{ id: number; action: string; details: string; entityType: string | null; entityId: number | null; createdAt: string }>;
}

function formatCurrency(amount: string | number) {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(num)) return "Rs. 0";
  return new Intl.NumberFormat("en-PK", { style: "currency", currency: "PKR", maximumFractionDigits: 0 }).format(num);
}

function formatDate(dateStr: string) {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("en-PK", { year: "numeric", month: "short", day: "numeric" });
}

const containerVariants: any = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
};

const itemVariants: any = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard").then((r) => r.json()).then((d) => { setData(d); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between"><Skeleton className="h-8 w-48" /><Skeleton className="h-10 w-36" /></div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {Array.from({ length: 9 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
      </div>
    );
  }

  if (!data) return <div className="py-20 text-center text-slate-500">Failed to load dashboard data.</div>;

  const revenue = parseFloat(data.totalRevenue || "0");
  const paid = parseFloat(data.totalPaid || "0");

  const cards = [
    { label: "Total Projects", value: data.totalProjects, icon: Building2, gradient: "from-blue-500 to-blue-600", hue: "blue" },
    { label: "Total Units", value: data.totalUnits, icon: Layers, gradient: "from-violet-500 to-violet-600", hue: "violet" },
    { label: "Available Units", value: data.availableUnits, icon: CheckCircle2, gradient: "from-emerald-500 to-emerald-600", hue: "emerald" },
    { label: "Reserved", value: data.reservedUnits, icon: CircleDashed, gradient: "from-amber-500 to-amber-600", hue: "amber" },
    { label: "Booked / Sold", value: `${data.bookedUnits} / ${data.soldUnits}`, icon: BadgeCheck, gradient: "from-cyan-500 to-cyan-600", hue: "cyan" },
    { label: "Total Revenue", value: formatCurrency(revenue), icon: IndianRupee, gradient: "from-brand-600 to-brand-700", hue: "brand", large: true },
    { label: "Payments Received", value: formatCurrency(paid), icon: TrendingUp, gradient: "from-teal-500 to-teal-600", hue: "teal", large: true },
    { label: "Pending Installments", value: data.pendingInstallments, icon: Clock, gradient: "from-orange-500 to-orange-600", hue: "orange" },
    { label: "Overdue", value: data.overdueInstallments, icon: AlertTriangle, gradient: "from-red-500 to-red-600", hue: "red" },
  ];

  const unitStatusData = [
    { label: "Available", value: data.availableUnits, color: "bg-emerald-500" },
    { label: "Reserved", value: data.reservedUnits, color: "bg-amber-500" },
    { label: "Booked", value: data.bookedUnits, color: "bg-blue-500" },
    { label: "Sold", value: data.soldUnits, color: "bg-brand-700" },
  ];
  const maxUnitVal = Math.max(...unitStatusData.map(d => d.value), 1);

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={itemVariants} className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">Dashboard</h1>
          <p className="mt-1 text-sm text-text-secondary">Overview of Build Hub inventory and sales</p>
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {cards.map((card, idx) => {
          const Icon = card.icon;
          const isNumeric = typeof card.value === "number";
          const val = card.value;
          return (
            <motion.div
              key={card.label}
              variants={itemVariants}
              className="card-hover rounded-xl border border-border bg-surface-card p-5 shadow-sm"
              whileHover={{ y: -2, boxShadow: "0 8px 30px rgba(0,0,0,0.08)" }}
            >
              <div className="flex items-center gap-3">
                <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${card.gradient} text-white shadow-sm`}>
                  <Icon size={20} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium text-text-secondary">{card.label}</p>
                  <p className="truncate text-lg font-bold text-text-primary">
                    {typeof val === "number" && val > 0 ? (
                      <AnimatedCounter value={val} />
                    ) : (
                      val
                    )}
                  </p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-3">
        <motion.div variants={itemVariants} className="lg:col-span-2 rounded-xl border border-border bg-surface-card shadow-sm">
          <div className="border-b border-border px-5 py-4">
            <h2 className="flex items-center gap-2 text-base font-semibold text-text-primary">
              <Activity size={18} className="text-brand-500" /> Recent Activity
            </h2>
          </div>
          <div className="divide-y divide-border">
            {data.recentActivities.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-text-secondary">No recent activity</p>
            ) : (
              data.recentActivities.map((activity, i) => (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03, duration: 0.25 }}
                  className="flex gap-3 px-5 py-3.5 transition-colors hover:bg-surface"
                >
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-50 ring-1 ring-brand-100">
                    <Activity size={14} className="text-brand-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-text-primary">
                      {activity.action.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase())}
                    </p>
                    <p className="truncate text-xs text-text-secondary">{activity.details}</p>
                    <p className="mt-0.5 text-xs text-slate-400">{formatDate(activity.createdAt)}</p>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </motion.div>

        <div className="space-y-6">
          <motion.div variants={itemVariants} className="rounded-xl border border-border bg-surface-card p-5 shadow-sm">
            <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-text-primary">
              <Layers size={16} className="text-brand-500" /> Unit Status
            </h3>
            <div className="space-y-3">
              {unitStatusData.map((item) => (
                <div key={item.label}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="font-medium text-text-secondary">{item.label}</span>
                    <span className="font-semibold text-text-primary">{item.value}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <motion.div
                      className={`h-full rounded-full ${item.color}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${(item.value / maxUnitVal) * 100}%` }}
                      transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1], delay: 0.2 }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="rounded-xl border border-border bg-surface-card shadow-sm">
            <div className="border-b border-border px-5 py-4">
              <h2 className="text-base font-semibold text-text-primary">Quick Actions</h2>
            </div>
            <div className="space-y-2 p-5">
              {[
                { href: "/projects", icon: Building2, label: "Manage Projects", color: "bg-brand-50 text-brand-600" },
                { href: "/units", icon: Layers, label: "View Units", color: "bg-violet-50 text-violet-600" },
                { href: "/bookings", icon: Clock, label: "View Bookings", color: "bg-amber-50 text-amber-600" },
                { href: "/documents", icon: CheckCircle2, label: "Generate Documents", color: "bg-emerald-50 text-emerald-600" },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <Link key={item.href} href={item.href}>
                    <motion.div
                      className="group flex items-center justify-between rounded-xl border border-border p-4 transition-all duration-200 hover:border-brand-200 hover:bg-brand-50/50 hover:shadow-sm"
                      whileHover={{ x: 3 }}
                      whileTap={{ scale: 0.99 }}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${item.color}`}>
                          <Icon size={20} />
                        </div>
                        <span className="text-sm font-medium text-text-primary">{item.label}</span>
                      </div>
                      <ArrowRight size={16} className="text-slate-300 transition-all group-hover:translate-x-0.5 group-hover:text-brand-500" />
                    </motion.div>
                  </Link>
                );
              })}
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
