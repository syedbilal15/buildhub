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
  apartment: "Apartment", office: "Office", shop: "Shop",
  villa: "Villa", plot: "Plot", warehouse: "Warehouse", commercial: "Commercial",
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
        <div className="grid gap-4 lg:grid-cols-2">
          {units.map((item) => (
            <div key={item.unit.id} className="card-hover rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    {item.project?.projectCode || "Project"}
                  </p>
                  <h3 className="truncate text-base font-semibold text-slate-900">
                    {item.unit.name || item.unit.unitNumber}
                  </h3>
                  <p className="mt-0.5 text-sm text-slate-500 truncate">
                    {item.project?.name || "Unassigned project"}
                  </p>
                </div>
                <Badge>{item.unit.status}</Badge>
              </div>

              <div className="mb-4 grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
                <div className="flex items-center gap-2">
                  <Home size={14} className="text-slate-400 shrink-0" />
                  <span className="truncate">Unit #{item.unit.unitNumber}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Building2 size={14} className="text-slate-400 shrink-0" />
                  <span>{PROPERTY_TYPES[item.unit.propertyType] || item.unit.propertyType}</span>
                </div>
                {item.unit.bedrooms !== null && (
                  <div className="flex items-center gap-2">
                    <Bed size={14} className="text-slate-400 shrink-0" />
                    <span>{item.unit.bedrooms} Beds</span>
                  </div>
                )}
                {item.unit.bathrooms !== null && (
                  <div className="flex items-center gap-2">
                    <Bath size={14} className="text-slate-400 shrink-0" />
                    <span>{item.unit.bathrooms} Baths</span>
                  </div>
                )}
                {item.unit.area && (
                  <div className="flex items-center gap-2">
                    <Layers size={14} className="text-slate-400 shrink-0" />
                    <span>{item.unit.area} {item.unit.areaUnit}</span>
                  </div>
                )}
                {item.unit.facing && (
                  <div className="flex items-center gap-2">
                    <MapPin size={14} className="text-slate-400 shrink-0" />
                    <span>{item.unit.facing}</span>
                  </div>
                )}
              </div>

              <div className="mb-3 flex items-center gap-2 text-sm font-medium text-brand-700">
                <IndianRupee size={14} />
                <span>{formatCurrency(item.unit.price)}</span>
              </div>

              {item.assignedProjects && item.assignedProjects.length > 0 && (
                <div className="mb-3 flex flex-wrap items-center gap-1.5 text-xs">
                  <span className="text-slate-400">Also in:</span>
                  {item.assignedProjects.map((ap) => (
                    <Link key={ap.id} href={`/projects/${ap.id}`}
                      className="rounded-md bg-slate-100 px-2 py-0.5 font-medium text-slate-600 hover:bg-brand-50 hover:text-brand-700"
                    >
                      {ap.projectCode || ap.name}
                    </Link>
                  ))}
                </div>
              )}

              <Link href={`/units/${item.unit.id}`}>
                <Button variant="outline" size="sm"><Eye size={14} /> View Details</Button>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
