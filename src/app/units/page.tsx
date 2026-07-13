"use client";

import { useEffect, useState, useCallback, startTransition } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Plus, Search, Pencil, Trash2, Eye, X, Layers,
} from "lucide-react";

interface UnitWithProject {
  unit: {
    id: number;
    unitNumber: string;
    name: string | null;
    propertyType: string;
    area: string | null;
    price: string;
    status: string;
    projectId: number;
    createdAt: string;
  };
  project: { id: number; name: string; projectCode: string | null } | null;
}

const PROPERTY_TYPES: Record<string, string> = {
  apartment: "Apartment", office: "Office", shop: "Shop",
  villa: "Villa", plot: "Plot", warehouse: "Warehouse", commercial: "Commercial",
};

const STATUSES = [
  { value: "available", label: "Available", color: "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-600/20" },
  { value: "reserved", label: "Reserved", color: "bg-amber-100 text-amber-700 ring-1 ring-amber-600/20" },
  { value: "booked", label: "Booked", color: "bg-blue-100 text-blue-700 ring-1 ring-blue-600/20" },
  { value: "sold", label: "Sold", color: "bg-slate-100 text-slate-700 ring-1 ring-slate-600/20" },
  { value: "cancelled", label: "Cancelled", color: "bg-red-100 text-red-700 ring-1 ring-red-600/20" },
];

function formatCurrency(amount: string | number) {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(num)) return "Rs. 0";
  return new Intl.NumberFormat("en-PK", {
    style: "currency", currency: "PKR", maximumFractionDigits: 0,
  }).format(num);
}

export default function UnitsPage() {
  const searchParams = useSearchParams();
  const [units, setUnits] = useState<UnitWithProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [deleteError, setDeleteError] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchUnits = useCallback(async () => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (statusFilter) params.set("status", statusFilter);
    if (typeFilter) params.set("propertyType", typeFilter);
    const projId = searchParams.get("projectId");
    if (projId) params.set("projectId", projId);

    const res = await fetch(`/api/units?${params}`);
    const data = await res.json();
    setUnits(data);
    setLoading(false);
  }, [search, statusFilter, typeFilter, searchParams]);

  useEffect(() => {
    startTransition(() => fetchUnits());
  }, [fetchUnits]);

  const handleDelete = async (id: number) => {
    setDeleteLoading(true);
    setDeleteError("");
    try {
      const res = await fetch(`/api/units/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        setDeleteError(data.error || "Failed to delete unit");
        return;
      }
      setDeleteConfirm(null);
      fetchUnits();
    } catch {
      setDeleteError("Network error. Please try again.");
    } finally {
      setDeleteLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const s = STATUSES.find((st) => st.value === status);
    return s ? s.color : "bg-slate-100 text-slate-600";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-brand-500 border-t-transparent" />
      </div>
    );
  }

  const projectId = searchParams.get("projectId");

  return (
    <div className="animate-fade-in">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Units</h1>
          <p className="mt-1 text-sm text-slate-500">Manage all property units across projects</p>
        </div>
        {projectId && (
          <Link href={`/projects/${projectId}`}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-600 transition-all duration-200 hover:bg-slate-50">
            <Eye size={16} /> Back to Project
          </Link>
        )}
      </div>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="text" placeholder="Search units..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-4 text-sm text-slate-800 outline-none transition-all duration-200 placeholder:text-slate-400 focus:border-brand-400 focus:ring-2 focus:ring-brand-500/20" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition-all duration-200 focus:border-brand-400 focus:ring-2 focus:ring-brand-500/20">
          <option value="">All Statuses</option>
          {STATUSES.map((s) => (<option key={s.value} value={s.value}>{s.label}</option>))}
        </select>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition-all duration-200 focus:border-brand-400 focus:ring-2 focus:ring-brand-500/20">
          <option value="">All Types</option>
          {Object.entries(PROPERTY_TYPES).map(([k, v]) => (<option key={k} value={k}>{v}</option>))}
        </select>
      </div>

      {units.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white py-16 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-50"><Layers size={36} className="text-slate-300" /></div>
          <p className="text-sm font-medium text-slate-500">No units found</p>
          <p className="mt-1 text-xs text-slate-400">{search || statusFilter || typeFilter ? "Try adjusting your filters" : "Add units to a project to get started"}</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80">
                  <th className="px-5 py-3.5 font-semibold text-slate-600">Unit #</th>
                  <th className="px-5 py-3.5 font-semibold text-slate-600">Name</th>
                  <th className="hidden px-5 py-3.5 font-semibold text-slate-600 md:table-cell">Project</th>
                  <th className="hidden px-5 py-3.5 font-semibold text-slate-600 sm:table-cell">Type</th>
                  <th className="px-5 py-3.5 font-semibold text-slate-600">Price</th>
                  <th className="px-5 py-3.5 font-semibold text-slate-600">Status</th>
                  <th className="px-5 py-3.5 font-semibold text-slate-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {units.map((item) => (
                  <tr key={item.unit.id} className="transition-colors hover:bg-slate-50/50">
                    <td className="px-5 py-3.5 font-medium text-slate-900">{item.unit.unitNumber}</td>
                    <td className="px-5 py-3.5 text-slate-600">{item.unit.name || "—"}</td>
                    <td className="hidden px-5 py-3.5 text-slate-600 md:table-cell">
                      <Link href={`/projects/${item.unit.projectId}`} className="text-brand-600 hover:underline">
                        {item.project?.name || "Unknown"}
                      </Link>
                    </td>
                    <td className="hidden px-5 py-3.5 sm:table-cell">
                      <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                        {PROPERTY_TYPES[item.unit.propertyType] || item.unit.propertyType}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-medium text-slate-800">{formatCurrency(item.unit.price)}</td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusBadge(item.unit.status)}`}>
                        {item.unit.status.charAt(0).toUpperCase() + item.unit.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1">
                        <Link href={`/units/${item.unit.id}`} className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700" title="View"><Eye size={15} /></Link>
                        <button onClick={() => setDeleteConfirm(item.unit.id)} className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600" title="Delete"><Trash2 size={15} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="animate-scale-in w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900">Delete Unit?</h3>
            <p className="mt-2 text-sm text-slate-500">This action cannot be undone. The unit and all associated data will be permanently removed.</p>
            {deleteError && (
              <div className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-600">{deleteError}</div>
            )}
            <div className="mt-5 flex justify-end gap-3">
              <button onClick={() => { setDeleteConfirm(null); setDeleteError(""); }} disabled={deleteLoading}
                className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-600 transition-all duration-200 hover:bg-slate-50 active:scale-[0.97] disabled:opacity-50">Cancel</button>
              <button onClick={() => handleDelete(deleteConfirm)} disabled={deleteLoading}
                className="rounded-xl bg-gradient-to-br from-red-600 to-red-700 px-5 py-2.5 text-sm font-medium text-white shadow-md transition-all duration-200 hover:from-red-700 hover:to-red-800 active:scale-[0.97] disabled:opacity-50">
                {deleteLoading ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
