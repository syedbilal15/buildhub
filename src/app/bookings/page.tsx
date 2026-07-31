"use client";

import { useEffect, useState, startTransition } from "react";
import Link from "next/link";
import { ClipboardList, Plus, Eye, Trash2 } from "lucide-react";
import Button from "@/components/Button";
import SearchInput from "@/components/SearchInput";
import Badge from "@/components/Badge";
import Spinner from "@/components/Spinner";
import ConfirmDialog from "@/components/ConfirmDialog";

interface BookingListItem {
  booking: { id: number; salePrice: string; status: string; bookingDate: string; referenceNumber: string | null };
  project: { id: number; name: string; projectCode: string | null } | null;
  unit: { id: number; unitNumber: string; name: string | null; propertyType: string } | null;
  client: { id: number; name: string; cnic: string; phone: string } | null;
}

function formatCurrency(amount: string | number) {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(num)) return "Rs. 0";
  return new Intl.NumberFormat("en-PK", { style: "currency", currency: "PKR", maximumFractionDigits: 0 }).format(num);
}

export default function BookingsPage() {
  const [bookings, setBookings] = useState<BookingListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleteError, setDeleteError] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const fetchBookings = () => {
    setSuccessMsg("");
    fetch("/api/bookings").then((r) => r.json()).then((d) => { setBookings(d); setLoading(false); }).catch(() => setLoading(false));
  };

  useEffect(() => { startTransition(() => fetchBookings()); }, []);

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleteLoading(true);
    setDeleteError("");
    try {
      const res = await fetch(`/api/bookings/${deleteId}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) { setDeleteError(data.error || "Failed to delete"); return; }
      setDeleteId(null);
      setSuccessMsg("Booking deleted successfully");
      fetchBookings();
    } catch { setDeleteError("Network error."); }
    finally { setDeleteLoading(false); }
  };

  const filtered = bookings.filter((b) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return b.client?.name?.toLowerCase().includes(s) || b.project?.name?.toLowerCase().includes(s) ||
      b.unit?.unitNumber?.toLowerCase().includes(s) || b.booking.referenceNumber?.toLowerCase().includes(s) || b.client?.cnic?.includes(s);
  });

  if (loading) return <Spinner />;

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Bookings</h1>
          <p className="mt-1 text-sm text-slate-500">Track client bookings and installment payments</p>
        </div>
        <Link href="/bookings/new"><Button><Plus size={16} /> New Booking</Button></Link>
      </div>

      {successMsg && (
        <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-5 py-3 text-sm font-medium text-emerald-700 flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
          {successMsg}
        </div>
      )}

      <SearchInput value={search} onChange={setSearch} placeholder="Search by client, project, unit, or reference..." />

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white py-16 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-50"><ClipboardList size={36} className="text-slate-300" /></div>
          <p className="text-sm font-medium text-slate-500">No bookings found</p>
          <p className="mt-1 text-xs text-slate-400">Create a booking from an available unit</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((item) => (
            <div key={item.booking.id} className="card-hover rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-3 flex items-start justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-slate-400">{item.booking.referenceNumber}</p>
                  <h3 className="truncate text-sm font-bold text-slate-900">{item.project?.name || "Unknown Project"}</h3>
                  <p className="text-xs text-slate-500">
                    {item.unit?.unitNumber && <>Unit #{item.unit.unitNumber}</>}
                    {item.unit?.name && <> &middot; {item.unit.name}</>}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <Badge>{item.booking.status}</Badge>
                  {item.booking.status !== "sold" && (
                    <button onClick={() => { setDeleteId(item.booking.id); setDeleteError(""); }}
                      className="rounded-lg p-1.5 text-slate-300 transition-colors hover:bg-red-50 hover:text-red-500" title="Delete">
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>

              <div className="mb-4 space-y-1.5 text-xs text-slate-600">
                <p><span className="font-medium">Sale:</span> {formatCurrency(item.booking.salePrice)}</p>
                <p><span className="font-medium">Client:</span> {item.client?.name || "N/A"}</p>
                <p><span className="font-medium">CNIC:</span> {item.client?.cnic || "N/A"}</p>
                <p className="text-slate-400">Date: {new Date(item.booking.bookingDate).toLocaleDateString("en-PK")}</p>
              </div>

              <Link href={`/bookings/${item.booking.id}`}>
                <Button variant="outline" size="sm" className="w-full"><Eye size={14} /> View Details</Button>
              </Link>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={deleteId !== null}
        title="Delete Booking"
        message="Are you sure you want to delete this booking? This action cannot be undone."
        confirmLabel="Delete Booking"
        variant="danger"
        loading={deleteLoading}
        error={deleteError}
        onConfirm={handleDelete}
        onCancel={() => { setDeleteId(null); setDeleteError(""); }}
      />
    </div>
  );
}
