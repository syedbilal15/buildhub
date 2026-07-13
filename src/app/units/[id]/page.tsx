"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Layers, MapPin, IndianRupee, Ruler,
  Home, User, Calendar, Building2, Bed, Bath,
  ClipboardList,
} from "lucide-react";

interface UnitDetail {
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
    price: string;
    facing: string | null;
    cornerUnit: boolean;
    status: string;
    description: string | null;
    projectId: number;
  };
  project: { id: number; name: string; projectCode: string | null; location: string | null } | null;
  bookings: Array<{
    booking: { id: number; salePrice: string; status: string; bookingDate: string; referenceNumber: string | null };
    client: { id: number; name: string; cnic: string; phone: string } | null;
  }>;
}

const PROPERTY_TYPES: Record<string, string> = {
  apartment: "Apartment", office: "Office", shop: "Shop",
  villa: "Villa", plot: "Plot", warehouse: "Warehouse", commercial: "Commercial",
};

const STATUS_COLORS: Record<string, string> = {
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
    style: "currency", currency: "PKR", maximumFractionDigits: 0,
  }).format(num);
}

export default function UnitDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [data, setData] = useState<UnitDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/units/${params.id}`)
      .then((r) => { if (!r.ok) throw new Error("Not found"); return r.json(); })
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-brand-500 border-t-transparent" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="py-20 text-center">
        <p className="text-lg font-medium text-slate-500">Unit not found</p>
        <Link href="/units" className="mt-4 inline-flex items-center gap-2 text-sm text-brand-600 hover:underline">
          <ArrowLeft size={14} /> Back to Units
        </Link>
      </div>
    );
  }

  const { unit, project, bookings } = data;

  return (
    <div className="animate-fade-in">
      <button onClick={() => router.push("/units")} className="mb-6 inline-flex items-center gap-2 text-sm text-slate-500 transition-colors hover:text-brand-600">
        <ArrowLeft size={16} /> Back to Units
      </button>

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">{unit.name || unit.unitNumber}</h1>
            <span className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${STATUS_COLORS[unit.status] || "bg-slate-100 text-slate-600"}`}>
              {unit.status.charAt(0).toUpperCase() + unit.status.slice(1)}
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Unit #{unit.unitNumber} &middot; {PROPERTY_TYPES[unit.propertyType] || unit.propertyType}
            {project && <> &middot; <Link href={`/projects/${project.id}`} className="text-brand-600 hover:underline">{project.name}</Link></>}
          </p>
        </div>
        {unit.status === "available" && (
          <Link href={`/bookings/new?projectId=${unit.projectId}&unitId=${unit.id}`}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-brand-600 to-brand-700 px-5 py-2.5 text-sm font-medium text-white shadow-lg shadow-brand-600/30 transition-all duration-200 hover:from-brand-700 hover:to-brand-800 active:scale-[0.97]">
            <ClipboardList size={16} /> Book This Unit
          </Link>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3 mb-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-slate-900">
              <Home size={16} className="text-brand-500" /> Unit Details
            </h2>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="flex items-start gap-3 rounded-xl bg-slate-50 p-3.5">
                <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg bg-white text-slate-400 shadow-sm"><Ruler size={16} /></div>
                <div><p className="text-xs font-medium text-slate-500">Area</p><p className="text-sm font-medium text-slate-800">{unit.area ? `${unit.area} ${unit.areaUnit}` : "—"}</p></div>
              </div>
              {unit.bedrooms !== null && (
                <div className="flex items-start gap-3 rounded-xl bg-slate-50 p-3.5">
                  <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg bg-white text-slate-400 shadow-sm"><Bed size={16} /></div>
                  <div><p className="text-xs font-medium text-slate-500">Bedrooms</p><p className="text-sm font-medium text-slate-800">{unit.bedrooms}</p></div>
                </div>
              )}
              {unit.bathrooms !== null && (
                <div className="flex items-start gap-3 rounded-xl bg-slate-50 p-3.5">
                  <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg bg-white text-slate-400 shadow-sm"><Bath size={16} /></div>
                  <div><p className="text-xs font-medium text-slate-500">Bathrooms</p><p className="text-sm font-medium text-slate-800">{unit.bathrooms}</p></div>
                </div>
              )}
              <div className="flex items-start gap-3 rounded-xl bg-slate-50 p-3.5">
                <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg bg-white text-slate-400 shadow-sm"><IndianRupee size={16} /></div>
                <div><p className="text-xs font-medium text-slate-500">Price</p><p className="text-sm font-bold text-brand-700">{formatCurrency(unit.price)}</p></div>
              </div>
              {unit.facing && (
                <div className="flex items-start gap-3 rounded-xl bg-slate-50 p-3.5">
                  <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg bg-white text-slate-400 shadow-sm"><MapPin size={16} /></div>
                  <div><p className="text-xs font-medium text-slate-500">Facing</p><p className="text-sm font-medium text-slate-800">{unit.facing}</p></div>
                </div>
              )}
              {unit.floor && (
                <div className="flex items-start gap-3 rounded-xl bg-slate-50 p-3.5">
                  <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg bg-white text-slate-400 shadow-sm"><Layers size={16} /></div>
                  <div><p className="text-xs font-medium text-slate-500">Floor</p><p className="text-sm font-medium text-slate-800">{unit.floor}</p></div>
                </div>
              )}
            </div>
            {unit.description && (
              <div className="mt-4"><p className="text-sm leading-relaxed text-slate-600">{unit.description}</p></div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900">
              <Building2 size={16} className="text-brand-500" /> Project
            </h3>
            {project ? (
              <div>
                <Link href={`/projects/${project.id}`} className="font-medium text-brand-600 hover:underline">{project.name}</Link>
                <p className="text-xs text-slate-500 mt-1">{project.projectCode && <>{project.projectCode}<br /></>}{project.location || ""}</p>
              </div>
            ) : (
              <p className="text-xs text-slate-400">Not assigned</p>
            )}
          </div>

          {unit.cornerUnit && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
              <p className="text-sm font-medium text-amber-800">Corner Unit</p>
              <p className="text-xs text-amber-600">Corner unit with additional land</p>
            </div>
          )}
        </div>
      </div>

      {/* Booking History */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900">
            <ClipboardList size={16} className="text-brand-500" /> Booking History
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">{bookings.length}</span>
          </h2>
        </div>
        {bookings.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-sm text-slate-400">No booking history for this unit</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {bookings.map((item) => (
              <div key={item.booking.id} className="flex items-center justify-between px-5 py-4">
                <div>
                  <p className="text-sm font-medium text-slate-800">
                    Ref: {item.booking.referenceNumber || "—"}
                  </p>
                  <p className="text-xs text-slate-500">
                    {item.client?.name || "Unknown Client"} &middot; {new Date(item.booking.bookingDate).toLocaleDateString("en-PK")}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-slate-800">{formatCurrency(item.booking.salePrice)}</span>
                  <Link href={`/bookings/${item.booking.id}`} className="rounded-lg bg-brand-50 px-3 py-1.5 text-xs font-medium text-brand-700 hover:bg-brand-100">
                    View
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
