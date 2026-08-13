"use client";

import { useCallback, useEffect, useState, startTransition } from "react";
import Link from "next/link";
import { Building2, Eye, Home, Bed, Bath, Layers, MapPin, IndianRupee } from "lucide-react";
import Button from "@/components/Button";
import Select from "@/components/Select";
import SearchInput from "@/components/SearchInput";
import Badge from "@/components/Badge";
import Spinner from "@/components/Spinner";

interface UnitListItem {
  unit: {
    id: number; unitNumber: string; name: string | null; floor: string | null;
    tower: string | null; block: string | null; propertyType: string; area: string | null;
    areaUnit: string; bedrooms: number | null; bathrooms: number | null; price: string | number;
    facing: string | null; cornerUnit: boolean; status: string; projectId: number;
  };
  project: { id: number; name: string; projectCode: string | null } | null;
  assignedProjects?: { id: number; name: string; projectCode: string | null }[];
}

const PROPERTY_TYPES: Record<string, string> = {
  apartment: "Apartment", shop: "Shop", openRoof: "Open Roof", pentHouse: "Pent House",
};

function formatCurrency(amount: string | number) {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(num)) return "Rs. 0";
  return new Intl.NumberFormat("en-PK", { style: "currency", currency: "PKR", maximumFractionDigits: 0 }).format(num);
}

export default function UnitsPage() {
  const [units, setUnits] = useState<UnitListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [propertyFilter, setPropertyFilter] = useState("");

  const fetchUnits = useCallback(async () => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (statusFilter) params.set("status", statusFilter);
    if (propertyFilter) params.set("propertyType", propertyFilter);
    const res = await fetch(`/api/units?${params}`);
    setUnits(await res.json());
    setLoading(false);
  }, [search, statusFilter, propertyFilter]);

  useEffect(() => { startTransition(() => fetchUnits()); }, [fetchUnits]);

  if (loading) return <Spinner />;

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Units</h1>
          <p className="mt-1 text-sm text-slate-500">Manage project units and availability</p>
        </div>
      </div>

      <div className="flex flex-col gap-3 md:flex-row">
        <SearchInput value={search} onChange={setSearch} placeholder="Search unit number or name..." />
        <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} placeholder="All Statuses"
          options={[
            { value: "available", label: "Available" }, { value: "reserved", label: "Reserved" },
            { value: "booked", label: "Booked" }, { value: "sold", label: "Sold" },
            { value: "cancelled", label: "Cancelled" },
          ]}
          className="sm:w-40"
        />
        <Select value={propertyFilter} onChange={(e) => setPropertyFilter(e.target.value)} placeholder="All Types"
          options={Object.entries(PROPERTY_TYPES).map(([k, v]) => ({ value: k, label: v }))}
          className="sm:w-40"
        />
      </div>

      {units.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white py-16 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-50">
            <Building2 size={36} className="text-slate-300" />
          </div>
          <p className="text-sm font-medium text-slate-500">No units found</p>
          <p className="mt-1 text-xs text-slate-400">Try adjusting your filters or add a new unit</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-5 py-3 font-semibold uppercase tracking-wider">Unit</th>
                <th className="px-5 py-3 font-semibold uppercase tracking-wider hidden sm:table-cell">Project</th>
                <th className="px-5 py-3 font-semibold uppercase tracking-wider">Type</th>
                <th className="px-5 py-3 font-semibold uppercase tracking-wider hidden md:table-cell">Area</th>
                <th className="px-5 py-3 font-semibold uppercase tracking-wider">Price</th>
                <th className="px-5 py-3 font-semibold uppercase tracking-wider">Status</th>
                <th className="px-5 py-3 font-semibold uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {units.map((item) => (
                <tr key={item.unit.id} className="hover:bg-slate-50">
                  <td className="px-5 py-4 align-top">
                    <p className="font-semibold text-slate-900">{item.unit.name || item.unit.unitNumber}</p>
                    <p className="text-xs text-slate-500">Unit #{item.unit.unitNumber}</p>
                  </td>
                  <td className="hidden px-5 py-4 align-top sm:table-cell">
                    <p className="font-medium text-slate-900">{item.project?.name || "Unassigned project"}</p>
                    <p className="text-xs text-slate-500">{item.project?.projectCode || "—"}</p>
                  </td>
                  <td className="px-5 py-4 align-top text-slate-600">
                    {PROPERTY_TYPES[item.unit.propertyType] || item.unit.propertyType}
                  </td>
                  <td className="hidden px-5 py-4 align-top text-slate-600 md:table-cell">
                    {item.unit.area ? `${item.unit.area} ${item.unit.areaUnit}` : "—"}
                  </td>
                  <td className="px-5 py-4 align-top font-medium text-slate-900">
                    {formatCurrency(item.unit.price)}
                  </td>
                  <td className="px-5 py-4 align-top">
                    <Badge>{item.unit.status}</Badge>
                  </td>
                  <td className="px-5 py-4 align-top">
                    <Link href={`/units/${item.unit.id}`} className="rounded-lg bg-brand-50 px-3 py-1.5 text-xs font-medium text-brand-700 hover:bg-brand-100">
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
