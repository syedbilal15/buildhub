"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Building2,
  Layers,
  CheckCircle2,
  Clock,
  IndianRupee,
  AlertTriangle,
  ArrowRight,
  Plus,
  Activity,
  Users,
  CircleDashed,
  BadgeCheck,
} from "lucide-react";

interface DashboardData {
  totalProjects: number;
  totalUnits: number;
  availableUnits: number;
  reservedUnits: number;
  bookedUnits: number;
  soldUnits: number;
  totalRevenue: string;
  totalPaid: string;
  pendingInstallments: number;
  overdueInstallments: number;
  recentActivities: Array<{
    id: number;
    action: string;
    details: string;
    entityType: string | null;
    entityId: number | null;
    createdAt: string;
  }>;
}

function formatCurrency(amount: string | number) {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(num)) return "Rs. 0";
  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    maximumFractionDigits: 0,
  }).format(num);
}

function formatDate(dateStr: string) {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("en-PK", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-brand-500 border-t-transparent" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="py-20 text-center text-slate-500">
        Failed to load dashboard data.
      </div>
    );
  }

  const revenue = parseFloat(data.totalRevenue || "0");
  const paid = parseFloat(data.totalPaid || "0");

  const cards = [
    {
      label: "Total Projects",
      value: data.totalProjects,
      icon: Building2,
      gradient: "from-blue-500 to-blue-600",
    },
    {
      label: "Total Units",
      value: data.totalUnits,
      icon: Layers,
      gradient: "from-violet-500 to-violet-600",
    },
    {
      label: "Available Units",
      value: data.availableUnits,
      icon: CheckCircle2,
      gradient: "from-emerald-500 to-emerald-600",
    },
    {
      label: "Reserved",
      value: data.reservedUnits,
      icon: CircleDashed,
      gradient: "from-amber-500 to-amber-600",
    },
    {
      label: "Booked / Sold",
      value: `${data.bookedUnits} / ${data.soldUnits}`,
      icon: BadgeCheck,
      gradient: "from-cyan-500 to-cyan-600",
    },
    {
      label: "Total Revenue",
      value: formatCurrency(revenue),
      icon: IndianRupee,
      gradient: "from-brand-600 to-brand-700",
    },
    {
      label: "Payments Received",
      value: formatCurrency(paid),
      icon: IndianRupee,
      gradient: "from-teal-500 to-teal-600",
    },
    {
      label: "Pending Installments",
      value: data.pendingInstallments,
      icon: Clock,
      gradient: "from-orange-500 to-orange-600",
    },
    {
      label: "Overdue",
      value: data.overdueInstallments,
      icon: AlertTriangle,
      gradient: "from-red-500 to-red-600",
    },
  ];

  return (
    <div className="animate-fade-in">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Overview of Build Hub inventory and sales
          </p>
        </div>
        <Link
          href="/projects"
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-brand-600 to-brand-700 px-5 py-2.5 text-sm font-medium text-white shadow-lg shadow-brand-600/30 transition-all duration-200 hover:from-brand-700 hover:to-brand-800 hover:shadow-brand-600/40 active:scale-[0.97]"
        >
          <Plus size={16} />
          Add New Project
        </Link>
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {cards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="group card-hover rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
              style={{ animationDelay: `${idx * 50}ms` }}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${card.gradient} text-white shadow-sm`}
                >
                  <Icon size={20} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium text-slate-500">
                    {card.label}
                  </p>
                  <p className="truncate text-lg font-bold text-slate-900">
                    {card.value}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900">
              <Activity size={18} className="text-brand-500" />
              Recent Activity
            </h2>
          </div>
          <div className="divide-y divide-slate-100">
            {data.recentActivities.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-slate-400">
                No recent activity
              </p>
            ) : (
              data.recentActivities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex gap-3 px-5 py-3.5 transition-colors hover:bg-slate-50"
                >
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-50 ring-1 ring-brand-100">
                    <Activity size={14} className="text-brand-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-800">
                      {activity.action
                        .replace(/_/g, " ")
                        .replace(/\b\w/g, (c) => c.toUpperCase())}
                    </p>
                    <p className="truncate text-xs text-slate-500">
                      {activity.details}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-400">
                      {formatDate(activity.createdAt)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="text-base font-semibold text-slate-900">
              Quick Actions
            </h2>
          </div>
          <div className="space-y-2 p-5">
            <Link
              href="/projects"
              className="group flex items-center justify-between rounded-xl border border-slate-200 p-4 transition-all duration-200 hover:border-brand-200 hover:bg-brand-50/50 hover:shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-600 transition-colors group-hover:bg-brand-100">
                  <Building2 size={20} />
                </div>
                <span className="text-sm font-medium text-slate-800">
                  Manage Projects
                </span>
              </div>
              <ArrowRight
                size={16}
                className="text-slate-300 transition-all group-hover:translate-x-0.5 group-hover:text-brand-500"
              />
            </Link>
            <Link
              href="/units"
              className="group flex items-center justify-between rounded-xl border border-slate-200 p-4 transition-all duration-200 hover:border-brand-200 hover:bg-brand-50/50 hover:shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-50 text-violet-600 transition-colors group-hover:bg-violet-100">
                  <Layers size={20} />
                </div>
                <span className="text-sm font-medium text-slate-800">
                  View Units
                </span>
              </div>
              <ArrowRight
                size={16}
                className="text-slate-300 transition-all group-hover:translate-x-0.5 group-hover:text-brand-500"
              />
            </Link>
            <Link
              href="/bookings"
              className="group flex items-center justify-between rounded-xl border border-slate-200 p-4 transition-all duration-200 hover:border-brand-200 hover:bg-brand-50/50 hover:shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-amber-600 transition-colors group-hover:bg-amber-100">
                  <Clock size={20} />
                </div>
                <span className="text-sm font-medium text-slate-800">
                  View Bookings
                </span>
              </div>
              <ArrowRight
                size={16}
                className="text-slate-300 transition-all group-hover:translate-x-0.5 group-hover:text-brand-500"
              />
            </Link>
            <Link
              href="/documents"
              className="group flex items-center justify-between rounded-xl border border-slate-200 p-4 transition-all duration-200 hover:border-brand-200 hover:bg-brand-50/50 hover:shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 transition-colors group-hover:bg-emerald-100">
                  <CheckCircle2 size={20} />
                </div>
                <span className="text-sm font-medium text-slate-800">
                  Generate Documents
                </span>
              </div>
              <ArrowRight
                size={16}
                className="text-slate-300 transition-all group-hover:translate-x-0.5 group-hover:text-brand-500"
              />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
