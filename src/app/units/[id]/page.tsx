"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Layers, MapPin, IndianRupee, Ruler, Home, Bed, Bath, Building2, ClipboardList } from "lucide-react";
import Button from "@/components/Button";
import Badge from "@/components/Badge";
import Spinner from "@/components/Spinner";

interface UnitDetail {
  unit: { id: number; unitNumber: string; name: string | null; floor: string | null; tower: string | null;
    block: string | null; propertyType: string; area: string | null; areaUnit: string; bedrooms: number | null;
    bathrooms: number | null; price: string; facing: string | null; cornerUnit: boolean; status: string;
    description: string | null; projectId: number; };
  project: { id: number; name: string; projectCode: string | null; location: string | null } | null;
  bookings: Array<{ booking: { id: number; salePrice: string; status: string; bookingDate: string; referenceNumber: string | null }; client: { id: number; name: string; cnic: string; phone: string } | null }>;
}

const PROPERTY_TYPES: Record<string, string> = {
  apartment: "Apartment", shop: "Shop", openRoof: "Open Roof", pentHouse: "Pent House",
};

function formatCurrency(amount: string | number) {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(num)) return "Rs. 0";
  return new Intl.NumberFormat("en-PK", { style: "currency", currency: "PKR", maximumFractionDigits: 0 }).format(num);
}

export default function UnitDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [data, setData] = useState<UnitDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/units/${params.id}`).then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then((d) => { setData(d); setLoading(false); }).catch(() => setLoading(false));
  }, [params.id]);

  if (loading) return <Spinner />;

  if (!data) return (
    <div className="py-20 text-center">
      <p className="text-lg font-medium text-slate-500">Unit not found</p>
      <Link href="/units" className="mt-4 inline-flex items-center gap-2 text-sm text-brand-600 hover:underline">
        <ArrowLeft size={14} /> Back to Units
      </Link>
    </div>
  );

  const { unit, project, bookings } = data;

  return (
    <div className="animate-fade-in space-y-6">
      <button onClick={() => router.push("/units")} className="inline-flex items-center gap-2 text-sm text-slate-500 transition-colors hover:text-brand-600">
        <ArrowLeft size={16} /> Back to Units
      </button>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">{unit.name || unit.unitNumber}</h1>
            <Badge>{unit.status}</Badge>
          </div>
          <p className="text-sm text-slate-500">
            Unit #{unit.unitNumber} &middot; {PROPERTY_TYPES[unit.propertyType] || unit.propertyType}
            {project && <> &middot; <Link href={`/projects/${project.id}`} className="text-brand-600 hover:underline">{project.name}</Link></>}
          </p>
        </div>
        {unit.status === "available" && (
          <Link href={`/bookings/new?projectId=${unit.projectId}&unitId=${unit.id}`}>
            <Button><ClipboardList size={16} /> Book This Unit</Button>
          </Link>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-slate-900">
              <Home size={16} className="text-brand-500" /> Unit Details
            </h2>
            <div className="grid gap-4 sm:grid-cols-3">
              {[
                { icon: Ruler, label: "Area", value: unit.area ? `${unit.area} ${unit.areaUnit}` : "—" },
                ...(unit.bedrooms !== null ? [{ icon: Bed, label: "Bedrooms", value: String(unit.bedrooms) }] : []),
                ...(unit.bathrooms !== null ? [{ icon: Bath, label: "Bathrooms", value: String(unit.bathrooms) }] : []),
                { icon: IndianRupee, label: "Price", value: formatCurrency(unit.price), bold: true, brand: true },
                ...(unit.facing ? [{ icon: MapPin, label: "Facing", value: unit.facing }] : []),
                ...(unit.floor ? [{ icon: Layers, label: "Floor", value: unit.floor }] : []),
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3 rounded-xl bg-slate-50 p-3.5">
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-slate-400 shadow-sm">
                    <item.icon size={16} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-slate-500">{item.label}</p>
                    <p className={`text-sm ${item.bold ? "font-bold" : "font-medium"} ${item.brand ? "text-brand-700" : "text-slate-800"} truncate`}>
                      {item.value}
                    </p>
                  </div>
                </div>
              ))}
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
            ) : <p className="text-xs text-slate-400">Not assigned</p>}
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
          <div className="py-12 text-center"><p className="text-sm text-slate-400">No booking history for this unit</p></div>
        ) : (
          <div className="divide-y divide-slate-100">
            {bookings.map((item) => (
              <div key={item.booking.id} className="flex items-center justify-between px-5 py-4 transition-colors hover:bg-slate-50">
                <div>
                  <p className="text-sm font-medium text-slate-800">Ref: {item.booking.referenceNumber || "—"}</p>
                  <p className="text-xs text-slate-500">{item.client?.name || "Unknown Client"} &middot; {new Date(item.booking.bookingDate).toLocaleDateString("en-PK")}</p>
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
