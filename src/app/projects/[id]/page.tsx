"use client";

import { useEffect, useState, useCallback, startTransition } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  MapPin,
  Layers,
  IndianRupee,
  Calendar,
  Plus,
  Pencil,
  Trash2,
  Eye,
  X,
  User,
  Code,
  CheckCircle2,
  CircleDashed,
  ClipboardList,
} from "lucide-react";

interface Project {
  id: number;
  name: string;
  projectCode: string | null;
  location: string | null;
  description: string | null;
  status: string;
  launchDate: string | null;
  completionDate: string | null;
  amenities: string[] | null;
  createdAt: string;
}

interface Unit {
  id: number;
  unitNumber: string;
  name: string | null;
  propertyType: string;
  area: string | null;
  price: string;
  status: string;
  bedrooms: number | null;
  bathrooms: number | null;
}

interface BookingItem {
  booking: { id: number; salePrice: string; status: string; bookingDate: string; referenceNumber: string | null };
  client: { id: number; name: string; cnic: string } | null;
  unit: { id: number; unitNumber: string } | null;
}

const STATUS_COLORS: Record<string, string> = {
  active: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20",
  completed: "bg-blue-50 text-blue-700 ring-1 ring-blue-600/20",
  on_hold: "bg-amber-50 text-amber-700 ring-1 ring-amber-600/20",
};

const UNIT_STATUS_COLORS: Record<string, string> = {
  available: "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-600/20",
  reserved: "bg-amber-100 text-amber-700 ring-1 ring-amber-600/20",
  booked: "bg-blue-100 text-blue-700 ring-1 ring-blue-600/20",
  sold: "bg-slate-100 text-slate-700 ring-1 ring-slate-600/20",
  cancelled: "bg-red-100 text-red-700 ring-1 ring-red-600/20",
};

const PROPERTY_TYPES: Record<string, string> = {
  apartment: "Apartment", office: "Office", shop: "Shop",
  villa: "Villa", plot: "Plot", warehouse: "Warehouse", commercial: "Commercial",
};

function formatCurrency(amount: string | number) {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(num)) return "Rs. 0";
  return new Intl.NumberFormat("en-PK", {
    style: "currency", currency: "PKR", maximumFractionDigits: 0,
  }).format(num);
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-PK", {
    year: "numeric", month: "short", day: "numeric",
  });
}

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUnitForm, setShowUnitForm] = useState(false);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  const [savingUnit, setSavingUnit] = useState(false);
  const [deleteUnitConfirm, setDeleteUnitConfirm] = useState<number | null>(null);
  const [deleteUnitError, setDeleteUnitError] = useState("");
  const [deleteUnitLoading, setDeleteUnitLoading] = useState(false);
  const [projectBookings, setProjectBookings] = useState<BookingItem[]>([]);
  const [unitForm, setUnitForm] = useState({
    unitNumber: "", name: "", propertyType: "apartment",
    area: "", price: "", status: "available",
    bedrooms: "", bathrooms: "", facing: "", cornerUnit: false,
  });

  const fetchData = useCallback(async () => {
    const [projRes, unitsRes] = await Promise.all([
      fetch(`/api/projects/${params.id}`),
      fetch(`/api/projects/${params.id}/units`),
    ]);
    if (projRes.ok) {
      setProject(await projRes.json());
    }
    if (unitsRes.ok) {
      setUnits(await unitsRes.json());
    }
    setLoading(false);
  }, [params.id]);

  const fetchBookings = useCallback(async () => {
    try {
      const allBookings = await fetch("/api/bookings").then(r => r.json());
      const filtered = allBookings.filter(
        (b: { booking: { projectId?: number } } & BookingItem) =>
          Number(b.booking.projectId) === Number(params.id)
      );
      setProjectBookings(filtered.slice(0, 10));
    } catch { /* ignore */ }
  }, [params.id]);

  useEffect(() => {
    startTransition(() => fetchData());
  }, [fetchData]);

  useEffect(() => {
    startTransition(() => fetchBookings());
  }, [fetchBookings]);

  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.get("addUnit") === "true") {
      setShowUnitForm(true);
      url.searchParams.delete("addUnit");
      window.history.replaceState({}, "", url.toString());
    }
  }, []);

  const openAddUnit = () => {
    setEditingUnit(null);
    setUnitForm({ unitNumber: "", name: "", propertyType: "apartment", area: "", price: "", status: "available", bedrooms: "", bathrooms: "", facing: "", cornerUnit: false });
    setShowUnitForm(true);
  };

  const openEditUnit = (unit: Unit) => {
    setEditingUnit(unit);
    setUnitForm({
      unitNumber: unit.unitNumber,
      name: unit.name || "",
      propertyType: unit.propertyType,
      area: unit.area || "",
      price: unit.price,
      status: unit.status,
      bedrooms: unit.bedrooms?.toString() || "",
      bathrooms: unit.bathrooms?.toString() || "",
      facing: "",
      cornerUnit: false,
    });
    setShowUnitForm(true);
  };

  const handleUnitSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingUnit(true);
    try {
      const body = { ...unitForm, projectId: Number(params.id) };
      if (editingUnit) {
        await fetch(`/api/units/${editingUnit.id}`, {
          method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
        });
      } else {
        await fetch("/api/units", {
          method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
        });
      }
      setShowUnitForm(false);
      fetchData();
    } catch (err) { console.error(err); }
    finally { setSavingUnit(false); }
  };

  const handleDeleteUnit = async (id: number) => {
    setDeleteUnitLoading(true);
    setDeleteUnitError("");
    try {
      const res = await fetch(`/api/units/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        setDeleteUnitError(data.error || "Failed to delete unit");
        return;
      }
      setDeleteUnitConfirm(null);
      fetchData();
    } catch {
      setDeleteUnitError("Network error. Please try again.");
    } finally {
      setDeleteUnitLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-brand-500 border-t-transparent" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="py-20 text-center">
        <p className="text-lg font-medium text-slate-500">Project not found</p>
        <Link href="/projects" className="mt-4 inline-flex items-center gap-2 text-sm text-brand-600 hover:underline">
          <ArrowLeft size={14} /> Back to Projects
        </Link>
      </div>
    );
  }

  const stats = [
    { label: "Total Units", value: units.length, color: "bg-violet-50 text-violet-700", valueColor: "text-violet-900" },
    { label: "Available", value: units.filter(u => u.status === "available").length, color: "bg-emerald-50 text-emerald-700", valueColor: "text-emerald-900" },
    { label: "Reserved", value: units.filter(u => u.status === "reserved").length, color: "bg-amber-50 text-amber-700", valueColor: "text-amber-900" },
    { label: "Booked", value: units.filter(u => u.status === "booked").length, color: "bg-blue-50 text-blue-700", valueColor: "text-blue-900" },
    { label: "Sold", value: units.filter(u => u.status === "sold").length, color: "bg-slate-50 text-slate-700", valueColor: "text-slate-900" },
  ];

  return (
    <div className="animate-fade-in">
      <button onClick={() => router.push("/projects")} className="mb-6 inline-flex items-center gap-2 text-sm text-slate-500 transition-colors hover:text-brand-600">
        <ArrowLeft size={16} /> Back to Projects
      </button>

      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">{project.name}</h1>
            <span className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${STATUS_COLORS[project.status] || "bg-slate-100 text-slate-600"}`}>
              {project.status.charAt(0).toUpperCase() + project.status.slice(1).replace("_", " ")}
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            {project.projectCode && <>{project.projectCode} &middot; </>}
            {project.location || "No location set"}
          </p>
        </div>
        <Link href={`/bookings/new?projectId=${project.id}`}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-brand-600 to-brand-700 px-5 py-2.5 text-sm font-medium text-white shadow-lg shadow-brand-600/30 transition-all duration-200 hover:from-brand-700 hover:to-brand-800 active:scale-[0.97]">
          <Plus size={16} /> New Booking
        </Link>
      </div>

      {/* Project Details */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm mb-6">
        <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-slate-900">
          <Building2 size={16} className="text-brand-500" /> Project Information
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex items-start gap-3 rounded-xl bg-slate-50 p-3.5">
            <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg bg-white text-slate-400 shadow-sm"><Code size={16} /></div>
            <div><p className="text-xs font-medium text-slate-500">Project Code</p><p className="text-sm font-medium text-slate-800">{project.projectCode || "—"}</p></div>
          </div>
          <div className="flex items-start gap-3 rounded-xl bg-slate-50 p-3.5">
            <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg bg-white text-slate-400 shadow-sm"><MapPin size={16} /></div>
            <div><p className="text-xs font-medium text-slate-500">Location</p><p className="text-sm font-medium text-slate-800">{project.location || "—"}</p></div>
          </div>
          <div className="flex items-start gap-3 rounded-xl bg-slate-50 p-3.5">
            <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg bg-white text-slate-400 shadow-sm"><Calendar size={16} /></div>
            <div><p className="text-xs font-medium text-slate-500">Date Added</p><p className="text-sm font-medium text-slate-800">{formatDate(project.createdAt)}</p></div>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid gap-4 sm:grid-cols-5 mb-6">
        {stats.map((s) => (
          <div key={s.label} className={`rounded-xl ${s.color} p-4`}>
            <p className="text-xs font-medium">{s.label}</p>
            <p className={`text-2xl font-bold ${s.valueColor}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Units Section */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm mb-6">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900">
            <Layers size={16} className="text-brand-500" /> Units
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">{units.length}</span>
          </h2>
          <button onClick={openAddUnit} className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-br from-brand-600 to-brand-700 px-4 py-2 text-sm font-medium text-white shadow-md transition-all duration-200 hover:from-brand-700 hover:to-brand-800 active:scale-[0.97]">
            <Plus size={14} /> Add Unit
          </button>
        </div>

        {units.length === 0 ? (
          <div className="py-12 text-center">
            <Layers size={36} className="mx-auto text-slate-300" />
            <p className="mt-3 text-sm font-medium text-slate-500">No units added yet</p>
            <button onClick={openAddUnit} className="mt-3 inline-flex items-center gap-1 rounded-xl bg-brand-50 px-4 py-2 text-sm font-medium text-brand-700 hover:bg-brand-100">
              <Plus size={14} /> Add First Unit
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="px-5 py-3 font-semibold text-slate-600">Unit #</th>
                  <th className="px-5 py-3 font-semibold text-slate-600">Name</th>
                  <th className="hidden px-5 py-3 font-semibold text-slate-600 sm:table-cell">Type</th>
                  <th className="hidden px-5 py-3 font-semibold text-slate-600 md:table-cell">Area</th>
                  <th className="px-5 py-3 font-semibold text-slate-600">Price</th>
                  <th className="px-5 py-3 font-semibold text-slate-600">Status</th>
                  <th className="px-5 py-3 font-semibold text-slate-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {units.map((unit) => (
                  <tr key={unit.id} className="transition-colors hover:bg-slate-50/50">
                    <td className="px-5 py-3 font-medium text-slate-900">{unit.unitNumber}</td>
                    <td className="px-5 py-3 text-slate-600">{unit.name || "—"}</td>
                    <td className="hidden px-5 py-3 text-slate-600 sm:table-cell">
                      <span className="rounded-lg bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                        {PROPERTY_TYPES[unit.propertyType] || unit.propertyType}
                      </span>
                    </td>
                    <td className="hidden px-5 py-3 text-slate-600 md:table-cell">{unit.area ? `${unit.area} sq ft` : "—"}</td>
                    <td className="px-5 py-3 font-medium text-slate-800">{formatCurrency(unit.price)}</td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${UNIT_STATUS_COLORS[unit.status] || "bg-slate-100 text-slate-600"}`}>
                        {unit.status.charAt(0).toUpperCase() + unit.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1">
                        <Link href={`/units/${unit.id}`} className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700" title="View Unit">
                          <Eye size={15} />
                        </Link>
                        <button onClick={() => openEditUnit(unit)} className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-brand-50 hover:text-brand-600" title="Edit Unit">
                          <Pencil size={15} />
                        </button>
                        <button onClick={() => setDeleteUnitConfirm(unit.id)} className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600" title="Delete Unit">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Recent Bookings */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900">
            <ClipboardList size={16} className="text-brand-500" /> Recent Bookings
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">{projectBookings.length}</span>
          </h2>
        </div>
        {projectBookings.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-sm text-slate-400">No bookings for this project yet</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {projectBookings.map((item) => (
              <div key={item.booking.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-slate-50 transition-colors">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-800">{item.booking.referenceNumber || "—"}</p>
                  <p className="text-xs text-slate-500">
                    {item.client?.name || "Unknown"} &middot; Unit #{item.unit?.unitNumber || "—"} &middot; {formatDate(item.booking.bookingDate)}
                  </p>
                </div>
                <div className="flex items-center gap-3 ml-4">
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

      {/* Unit Form Modal */}
      {showUnitForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="animate-scale-in max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">{editingUnit ? "Edit Unit" : "Add New Unit"}</h2>
              <button onClick={() => setShowUnitForm(false)} className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleUnitSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-600">Unit Number *</label>
                  <input type="text" required value={unitForm.unitNumber} onChange={(e) => setUnitForm({ ...unitForm, unitNumber: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none transition-all duration-200 placeholder:text-slate-400 focus:border-brand-400 focus:ring-2 focus:ring-brand-500/20" placeholder="e.g., V-001" />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-600">Name</label>
                  <input type="text" value={unitForm.name} onChange={(e) => setUnitForm({ ...unitForm, name: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none transition-all duration-200 placeholder:text-slate-400 focus:border-brand-400 focus:ring-2 focus:ring-brand-500/20" placeholder="e.g., Villa A" />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-600">Property Type</label>
                  <select value={unitForm.propertyType} onChange={(e) => setUnitForm({ ...unitForm, propertyType: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none transition-all duration-200 focus:border-brand-400 focus:ring-2 focus:ring-brand-500/20">
                    {Object.entries(PROPERTY_TYPES).map(([k, v]) => (<option key={k} value={k}>{v}</option>))}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-600">Area (sq ft)</label>
                  <input type="number" step="0.01" value={unitForm.area} onChange={(e) => setUnitForm({ ...unitForm, area: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none transition-all duration-200 placeholder:text-slate-400 focus:border-brand-400 focus:ring-2 focus:ring-brand-500/20" placeholder="e.g., 5000" />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-600">Price (PKR) *</label>
                  <input type="number" required value={unitForm.price} onChange={(e) => setUnitForm({ ...unitForm, price: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none transition-all duration-200 placeholder:text-slate-400 focus:border-brand-400 focus:ring-2 focus:ring-brand-500/20" placeholder="e.g., 25000000" />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-600">Status</label>
                  <select value={unitForm.status} onChange={(e) => setUnitForm({ ...unitForm, status: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none transition-all duration-200 focus:border-brand-400 focus:ring-2 focus:ring-brand-500/20">
                    <option value="available">Available</option>
                    <option value="reserved">Reserved</option>
                    <option value="booked">Booked</option>
                    <option value="sold">Sold</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowUnitForm(false)} className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-600 transition-all duration-200 hover:bg-slate-50 active:scale-[0.97]">Cancel</button>
                <button type="submit" disabled={savingUnit} className="rounded-xl bg-gradient-to-br from-brand-600 to-brand-700 px-5 py-2.5 text-sm font-medium text-white shadow-md transition-all duration-200 hover:from-brand-700 hover:to-brand-800 active:scale-[0.97] disabled:opacity-50">
                  {savingUnit ? "Saving..." : editingUnit ? "Update Unit" : "Add Unit"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Unit Confirmation */}
      {deleteUnitConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="animate-scale-in w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900">Delete Unit?</h3>
            <p className="mt-2 text-sm text-slate-500">
              This action cannot be undone. The unit and all associated data will be permanently removed.
            </p>
            {deleteUnitError && (
              <div className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-600">{deleteUnitError}</div>
            )}
            <div className="mt-5 flex justify-end gap-3">
              <button onClick={() => { setDeleteUnitConfirm(null); setDeleteUnitError(""); }} disabled={deleteUnitLoading}
                className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-600 transition-all duration-200 hover:bg-slate-50 active:scale-[0.97] disabled:opacity-50">Cancel</button>
              <button onClick={() => handleDeleteUnit(deleteUnitConfirm)} disabled={deleteUnitLoading}
                className="rounded-xl bg-gradient-to-br from-red-600 to-red-700 px-5 py-2.5 text-sm font-medium text-white shadow-md transition-all duration-200 hover:from-red-700 hover:to-red-800 active:scale-[0.97] disabled:opacity-50">
                {deleteUnitLoading ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
