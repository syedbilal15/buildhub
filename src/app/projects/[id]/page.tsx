"use client";

import { useEffect, useState, useCallback, startTransition } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  MapPin,
  Layers,
  Calendar,
  Plus,
  Pencil,
  Trash2,
  Eye,
  ClipboardList,
  Code,
  DollarSign,
  Download,
} from "lucide-react";
import Button from "@/components/Button";
import Input from "@/components/Input";
import Select from "@/components/Select";
import Modal from "@/components/Modal";
import Badge from "@/components/Badge";
import Spinner from "@/components/Spinner";
import ConfirmDialog from "@/components/ConfirmDialog";

interface Project {
  id: number; name: string; projectCode: string | null; location: string | null;
  description: string | null; status: string; launchDate: string | null;
  completionDate: string | null; amenities: string[] | null; createdAt: string;
  images?: string[] | null; documents?: { name: string; url: string }[] | null;
  assignedUnits?: { id: number; unitNumber: string; name: string | null; propertyType: string; area: string | null; price: string; status: string }[];
}

interface Unit {
  id: number; unitNumber: string; name: string | null; propertyType: string;
  area: string | null; price: string; status: string; bedrooms: number | null; bathrooms: number | null;
}

interface BookingItem {
  booking: { id: number; salePrice: string; status: string; bookingDate: string; referenceNumber: string | null };
  client: { id: number; name: string; cnic: string } | null;
  unit: { id: number; unitNumber: string } | null;
}

const PROPERTY_TYPES: Record<string, string> = {
  apartment: "Apartment", shop: "Shop", openRoof: "Open Roof", pentHouse: "Pent House",
};

const FLOOR_OPTIONS = [
  { value: "ground", label: "Ground" },
  { value: "mezzanine", label: "Mezzanine" },
  { value: "first", label: "First" },
  { value: "second", label: "Second" },
  { value: "third", label: "Third" },
  { value: "fourth", label: "Fourth" },
  { value: "fifth", label: "Fifth" },
  { value: "sixth", label: "Sixth" },
  { value: "seventh", label: "Seventh" },
  { value: "eighth", label: "Eighth" },
  { value: "ninth", label: "Ninth" },
  { value: "tenth", label: "Tenth" },
];

function formatCurrency(amount: string | number) {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(num)) return "Rs. 0";
  return new Intl.NumberFormat("en-PK", { style: "currency", currency: "PKR", maximumFractionDigits: 0 }).format(num);
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-PK", { year: "numeric", month: "short", day: "numeric" });
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
  const [deleteUnitId, setDeleteUnitId] = useState<number | null>(null);
  const [deleteUnitError, setDeleteUnitError] = useState("");
  const [deleteUnitLoading, setDeleteUnitLoading] = useState(false);
  const [projectBookings, setProjectBookings] = useState<BookingItem[]>([]);
  const [unitForm, setUnitForm] = useState({
    unitNumber: "", name: "", propertyType: "apartment", floor: "", area: "", price: "", status: "available",
    bedrooms: "", bathrooms: "", facing: "", cornerUnit: false,
  });

  const fetchData = useCallback(async () => {
    const [projRes, unitsRes] = await Promise.all([
      fetch(`/api/projects/${params.id}`),
      fetch(`/api/projects/${params.id}/units`),
    ]);
    if (projRes.ok) setProject(await projRes.json());
    if (unitsRes.ok) setUnits(await unitsRes.json());
    setLoading(false);
  }, [params.id]);

  const fetchBookings = useCallback(async () => {
    try {
      const allBookings = await fetch("/api/bookings").then(r => r.json());
      const filtered = allBookings.filter(
        (b: { booking: { projectId?: number } } & BookingItem) => Number(b.booking.projectId) === Number(params.id)
      );
      setProjectBookings(filtered.slice(0, 10));
    } catch { /* ignore */ }
  }, [params.id]);

  useEffect(() => { startTransition(() => fetchData()); }, [fetchData]);
  useEffect(() => { startTransition(() => fetchBookings()); }, [fetchBookings]);

  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.get("addUnit") === "true") {
      startTransition(() => setShowUnitForm(true));
      url.searchParams.delete("addUnit");
      window.history.replaceState({}, "", url.toString());
    }
  }, []);

  const openAddUnit = () => {
    setEditingUnit(null);
    setUnitForm({ unitNumber: "", name: "", propertyType: "apartment", floor: "", area: "", price: "", status: "available", bedrooms: "", bathrooms: "", facing: "", cornerUnit: false });
    setShowUnitForm(true);
  };

  const openEditUnit = (unit: Unit) => {
    setEditingUnit(unit);
    setUnitForm({
      unitNumber: unit.unitNumber, name: unit.name || "", propertyType: unit.propertyType, floor: unit.floor || "",
      area: unit.area || "", price: unit.price, status: unit.status,
      bedrooms: unit.bedrooms?.toString() || "", bathrooms: unit.bathrooms?.toString() || "",
      facing: "", cornerUnit: false,
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
    } catch { /* ignore */ }
    finally { setSavingUnit(false); }
  };

  const handleDeleteUnit = async () => {
    if (!deleteUnitId) return;
    setDeleteUnitLoading(true);
    setDeleteUnitError("");
    try {
      const res = await fetch(`/api/units/${deleteUnitId}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) { setDeleteUnitError(data.error || "Failed to delete unit"); return; }
      setDeleteUnitId(null);
      fetchData();
    } catch { setDeleteUnitError("Network error."); }
    finally { setDeleteUnitLoading(false); }
  };

  if (loading) return <Spinner />;

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
    { label: "Total Units", value: units.length, color: "bg-violet-50 text-violet-900" },
    { label: "Available", value: units.filter(u => u.status === "available").length, color: "bg-emerald-50 text-emerald-900" },
    { label: "Reserved", value: units.filter(u => u.status === "reserved").length, color: "bg-amber-50 text-amber-900" },
    { label: "Booked", value: units.filter(u => u.status === "booked").length, color: "bg-blue-50 text-blue-900" },
    { label: "Sold", value: units.filter(u => u.status === "sold").length, color: "bg-slate-50 text-slate-900" },
  ];

  return (
    <div className="animate-fade-in space-y-6">
      {/* Back */}
      <button onClick={() => router.push("/projects")} className="inline-flex items-center gap-2 text-sm text-slate-500 transition-colors hover:text-brand-600">
        <ArrowLeft size={16} /> Back to Projects
      </button>

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">{project.name}</h1>
            <Badge>{project.status}</Badge>
          </div>
          <p className="text-sm text-slate-500">
            {project.projectCode && <>{project.projectCode} &middot; </>}
            {project.location || "No location set"}
          </p>
        </div>
      </div>

      {/* Project Info */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-slate-900">
          <Building2 size={16} className="text-brand-500" /> Project Information
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: Code, label: "Project Code", value: project.projectCode || "—" },
            { icon: MapPin, label: "Location", value: project.location || "—" },
            { icon: Calendar, label: "Date Added", value: formatDate(project.createdAt) },
            { icon: DollarSign, label: "Launch Date", value: formatDate(project.launchDate) },
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-3 rounded-xl bg-slate-50 p-3.5">
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-slate-400 shadow-sm">
                <item.icon size={16} />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-slate-500">{item.label}</p>
                <p className="text-sm font-medium text-slate-800 truncate">{item.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {(project.images?.length ?? 0) > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-slate-900">
            <Building2 size={16} className="text-brand-500" /> Project Images
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {project.images?.map((src, index) => (
              <img
                key={`${src}-${index}`}
                src={src}
                alt={`Project image ${index + 1}`}
                className="h-40 w-full rounded-2xl object-cover"
              />
            ))}
          </div>
        </div>
      )}

      {(project.documents?.length ?? 0) > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-slate-900">
            <ClipboardList size={16} className="text-brand-500" /> Documents
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {project.documents?.map((doc) => (
              <a
                key={doc.url}
                href={doc.url}
                target="_blank"
                rel="noreferrer"
                className="group relative flex flex-col items-start gap-2 rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100 p-4 transition-all hover:border-brand-300 hover:shadow-md"
              >
                <div className="flex w-full items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-900 group-hover:text-brand-600">
                      {doc.name}
                    </p>
                    <p className="text-xs text-slate-500">PDF Document</p>
                  </div>
                  <Download size={16} className="shrink-0 text-slate-400 group-hover:text-brand-600" />
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-5">
        {stats.map((s) => (
          <div key={s.label} className={`rounded-xl ${s.color} p-4 text-center`}>
            <p className="text-xs font-medium text-slate-500">{s.label}</p>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>


      {/* Units */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900">
            <Layers size={16} className="text-brand-500" /> Units
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">{units.length}</span>
          </h2>
          <Button variant="primary" size="sm" onClick={openAddUnit}><Plus size={14} /> Add Unit</Button>
        </div>

        {units.length === 0 ? (
          <div className="py-12 text-center">
            <Layers size={36} className="mx-auto text-slate-300" />
            <p className="mt-3 text-sm font-medium text-slate-500">No units added yet</p>
            <Button variant="outline" size="sm" onClick={openAddUnit} className="mt-3">
              <Plus size={14} /> Add First Unit
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80">
                  <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Unit #</th>
                  <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Name</th>
                  <th className="hidden px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500 sm:table-cell">Type</th>
                  <th className="hidden px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500 md:table-cell">Area</th>
                  <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Price</th>
                  <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Status</th>
                  <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {units.map((unit) => (
                  <tr key={unit.id} className="transition-colors hover:bg-slate-50/50">
                    <td className="px-5 py-4 font-medium text-slate-900">{unit.unitNumber}</td>
                    <td className="px-5 py-4 text-slate-600">{unit.name || "—"}</td>
                    <td className="hidden px-5 py-4 text-slate-600 sm:table-cell">
                      <span className="rounded-lg bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                        {PROPERTY_TYPES[unit.propertyType] || unit.propertyType}
                      </span>
                    </td>
                    <td className="hidden px-5 py-4 text-slate-600 md:table-cell">{unit.area ? `${unit.area} sq ft` : "—"}</td>
                    <td className="px-5 py-4 font-medium text-slate-800">{formatCurrency(unit.price)}</td>
                    <td className="px-5 py-4"><Badge>{unit.status}</Badge></td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1">
                        <Link href={`/units/${unit.id}`} className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700" title="View">
                          <Eye size={15} />
                        </Link>
                        <button onClick={() => openEditUnit(unit)} className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-brand-50 hover:text-brand-600" title="Edit">
                          <Pencil size={15} />
                        </button>
                        <button onClick={() => setDeleteUnitId(unit.id)} className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600" title="Delete">
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
              <div key={item.booking.id} className="flex items-center justify-between px-5 py-3.5 transition-colors hover:bg-slate-50">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-800">{item.booking.referenceNumber || "—"}</p>
                  <p className="text-xs text-slate-500">
                    {item.client?.name || "Unknown"} &middot; Unit #{item.unit?.unitNumber || "—"} &middot; {formatDate(item.booking.bookingDate)}
                  </p>
                </div>
                <div className="ml-4 flex items-center gap-3">
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
      <Modal open={showUnitForm} onClose={() => setShowUnitForm(false)} title={editingUnit ? "Edit Unit" : "Add New Unit"}>
        <form onSubmit={handleUnitSubmit} className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <Input label="Unit Number *" required value={unitForm.unitNumber} onChange={(e) => setUnitForm({ ...unitForm, unitNumber: e.target.value })} placeholder="e.g., V-001" />
            <Input label="Name" value={unitForm.name} onChange={(e) => setUnitForm({ ...unitForm, name: e.target.value })} placeholder="e.g., Villa A" />
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <Select label="Property Type" value={unitForm.propertyType} onChange={(e) => setUnitForm({ ...unitForm, propertyType: e.target.value })} options={Object.entries(PROPERTY_TYPES).map(([k, v]) => ({ value: k, label: v }))} />
            <Select label="Floor" value={unitForm.floor} onChange={(e) => setUnitForm({ ...unitForm, floor: e.target.value })} options={FLOOR_OPTIONS} />
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <Input label="Area (sq ft)" type="number" step="0.01" value={unitForm.area} onChange={(e) => setUnitForm({ ...unitForm, area: e.target.value })} placeholder="e.g., 5000" />
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <Input label="Price (PKR) *" type="number" required value={unitForm.price} onChange={(e) => setUnitForm({ ...unitForm, price: e.target.value })} placeholder="e.g., 25000000" />
            <Select label="Status" value={unitForm.status} onChange={(e) => setUnitForm({ ...unitForm, status: e.target.value })} options={[
              { value: "available", label: "Available" }, { value: "reserved", label: "Reserved" },
              { value: "booked", label: "Booked" }, { value: "sold", label: "Sold" },
              { value: "cancelled", label: "Cancelled" },
            ]} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={() => setShowUnitForm(false)}>Cancel</Button>
            <Button type="submit" loading={savingUnit}>{editingUnit ? "Update Unit" : "Add Unit"}</Button>
          </div>
        </form>
      </Modal>

      {/* Delete Unit Confirm */}
      <ConfirmDialog
        open={deleteUnitId !== null}
        title="Delete Unit?"
        message="This action cannot be undone. The unit and all associated data will be permanently removed."
        confirmLabel="Delete"
        variant="danger"
        loading={deleteUnitLoading}
        error={deleteUnitError}
        onConfirm={handleDeleteUnit}
        onCancel={() => { setDeleteUnitId(null); setDeleteUnitError(""); }}
      />
    </div>
  );
}
