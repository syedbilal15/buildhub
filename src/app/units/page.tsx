"use client";

import { useCallback, useEffect, useState, startTransition } from "react";
import Link from "next/link";
import {
  Search,
  Building2,
  Eye,
  Home,
  Bed,
  Bath,
  Layers,
  MapPin,
  IndianRupee,
} from "lucide-react";

interface UnitListItem {
  unit: {
    id: number;
    unitNumber: string;
    name: string | null;
    floor: string | null;
    tower: string | null;
    block: string | null;
    propertyType: string;
    area: string | null;
    areaUnit: string;
    bedrooms: number | null;
    bathrooms: number | null;
    price: string | number;
    facing: string | null;
    cornerUnit: boolean;
    status: string;
    projectId: number;
  };
  project: {
    id: number;
    name: string;
    projectCode: string | null;
  } | null;
}

const PROPERTY_TYPES: Record<string, string> = {
  apartment: "Apartment",
  office: "Office",
  shop: "Shop",
  villa: "Villa",
  plot: "Plot",
  warehouse: "Warehouse",
  commercial: "Commercial",
};

const STATUS_STYLES: Record<string, string> = {
  available: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20",
  reserved: "bg-amber-50 text-amber-700 ring-1 ring-amber-600/20",
  booked: "bg-blue-50 text-blue-700 ring-1 ring-blue-600/20",
  sold: "bg-slate-50 text-slate-700 ring-1 ring-slate-600/20",
  cancelled: "bg-red-50 text-red-700 ring-1 ring-red-600/20",
};

function formatCurrency(amount: string | number) {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(num)) return "Rs. 0";
  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    maximumFractionDigits: 0,
  }).format(num);
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
    const data = await res.json();

    setUnits(data);
    setLoading(false);
  }, [search, statusFilter, propertyFilter]);

  useEffect(() => {
    startTransition(() => {
      fetchUnits();
    });
  }, [fetchUnits]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-brand-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Units</h1>
          <p className="mt-1 text-sm text-slate-500">Manage project units and availability</p>
        </div>
      </div>

      <div className="mb-6 flex flex-col gap-3 md:flex-row">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search unit number or name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-4 text-sm text-slate-800 outline-none transition-all duration-200 placeholder:text-slate-400 focus:border-brand-400 focus:ring-2 focus:ring-brand-500/20"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition-all duration-200 focus:border-brand-400 focus:ring-2 focus:ring-brand-500/20"
        >
          <option value="">All Statuses</option>
          <option value="available">Available</option>
          <option value="reserved">Reserved</option>
          <option value="booked">Booked</option>
          <option value="sold">Sold</option>
          <option value="cancelled">Cancelled</option>
        </select>

        <select
          value={propertyFilter}
          onChange={(e) => setPropertyFilter(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition-all duration-200 focus:border-brand-400 focus:ring-2 focus:ring-brand-500/20"
        >
          <option value="">All Types</option>
          <option value="apartment">Apartment</option>
          <option value="villa">Villa</option>
          <option value="plot">Plot</option>
          <option value="office">Office</option>
          <option value="shop">Shop</option>
          <option value="commercial">Commercial</option>
          <option value="warehouse">Warehouse</option>
        </select>
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
            <div key={item.unit.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    {item.project?.projectCode || "Project"}
                  </p>
                  <h3 className="text-base font-semibold text-slate-900">
                    {item.unit.name || item.unit.unitNumber}
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    {item.project?.name || "Unassigned project"}
                  </p>
                </div>
                <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLES[item.unit.status] || "bg-slate-100 text-slate-600"}`}>
                  {item.unit.status.charAt(0).toUpperCase() + item.unit.status.slice(1)}
                </span>
              </div>

              <div className="mb-4 grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
                <div className="flex items-center gap-2">
                  <Home size={14} className="text-slate-400" />
                  <span>Unit #{item.unit.unitNumber}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Building2 size={14} className="text-slate-400" />
                  <span>{PROPERTY_TYPES[item.unit.propertyType] || item.unit.propertyType}</span>
                </div>
                {item.unit.bedrooms !== null && (
                  <div className="flex items-center gap-2">
                    <Bed size={14} className="text-slate-400" />
                    <span>{item.unit.bedrooms} Beds</span>
                  </div>
                )}
                {item.unit.bathrooms !== null && (
                  <div className="flex items-center gap-2">
                    <Bath size={14} className="text-slate-400" />
                    <span>{item.unit.bathrooms} Baths</span>
                  </div>
                )}
                {item.unit.area && (
                  <div className="flex items-center gap-2">
                    <Layers size={14} className="text-slate-400" />
                    <span>{item.unit.area} {item.unit.areaUnit}</span>
                  </div>
                )}
                {item.unit.facing && (
                  <div className="flex items-center gap-2">
                    <MapPin size={14} className="text-slate-400" />
                    <span>{item.unit.facing}</span>
                  </div>
                )}
              </div>

              <div className="mb-4 flex items-center gap-2 text-sm font-medium text-brand-700">
                <IndianRupee size={14} />
                <span>{formatCurrency(item.unit.price)}</span>
              </div>

              <Link
                href={`/units/${item.unit.id}`}
                className="inline-flex items-center gap-2 rounded-xl border border-brand-200 bg-brand-50 px-3 py-2 text-sm font-medium text-brand-700 transition-all duration-200 hover:bg-brand-100"
              >
                <Eye size={14} /> View Details
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
