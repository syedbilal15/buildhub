"use client";

import { useEffect, useState, startTransition } from "react";
import Link from "next/link";
import {
  ClipboardList, Search, Eye, Plus, IndianRupee, User, Building2, Trash2, X,
} from "lucide-react";

interface BookingListItem {
  booking: {
    id: number;
    salePrice: string;
    status: string;
    bookingDate: string;
    referenceNumber: string | null;
  };
  project: { id: number; name: string; projectCode: string | null } | null;
  unit: { id: number; unitNumber: string; name: string | null; propertyType: string } | null;
  client: { id: number; name: string; cnic: string; phone: string } | null;
}

function formatCurrency(amount: string | number) {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(num)) return "Rs. 0";
  return new Intl.NumberFormat("en-PK", {
    style: "currency", currency: "PKR", maximumFractionDigits: 0,
  }).format(num);
}

const STATUS_STYLES: Record<string, string> = {
  booked: "bg-amber-50 text-amber-700 ring-1 ring-amber-600/20",
  sold: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20",
  cancelled: "bg-red-50 text-red-700 ring-1 ring-red-600/20",
};

export default function BookingsPage() {
  const [bookings, setBookings] = useState<BookingListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [deleteError, setDeleteError] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const fetchBookings = () => {
    setSuccessMsg("");
    fetch("/api/bookings")
      .then((r) => r.json())
      .then((d) => { setBookings(d); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { startTransition(() => fetchBookings()); }, []);

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    setDeleteLoading(true);
    setDeleteError("");
    try {
      const res = await fetch(`/api/bookings/${deleteConfirm}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        setDeleteError(data.error || "Failed to delete booking");
        return;
      }
      setDeleteConfirm(null);
      setSuccessMsg("Booking deleted successfully");
      fetchBookings();
    } catch {
      setDeleteError("Network error. Please try again.");
    } finally {
      setDeleteLoading(false);
    }
  };

  const filtered = bookings.filter((b) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      b.client?.name?.toLowerCase().includes(s) ||
      b.project?.name?.toLowerCase().includes(s) ||
      b.unit?.unitNumber?.toLowerCase().includes(s) ||
      b.booking.referenceNumber?.toLowerCase().includes(s) ||
      b.client?.cnic?.includes(s)
    );
  });

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
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Bookings</h1>
          <p className="mt-1 text-sm text-slate-500">Track client bookings and installment payments</p>
        </div>
        <Link href="/bookings/new"
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-brand-600 to-brand-700 px-5 py-2.5 text-sm font-medium text-white shadow-lg shadow-brand-600/30 transition-all duration-200 hover:from-brand-700 hover:to-brand-800 active:scale-[0.97]">
          <Plus size={16} /> New Booking
        </Link>
      </div>

      {successMsg && (
        <div className="mb-4 rounded-xl bg-emerald-50 border border-emerald-200 px-5 py-3 text-sm font-medium text-emerald-700 flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
          {successMsg}
        </div>
      )}

      <div className="mb-6">
        <div className="relative max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="text" placeholder="Search by client, project, unit, or reference..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-4 text-sm text-slate-800 outline-none transition-all duration-200 placeholder:text-slate-400 focus:border-brand-400 focus:ring-2 focus:ring-brand-500/20" />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white py-16 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-50"><ClipboardList size={36} className="text-slate-300" /></div>
          <p className="text-sm font-medium text-slate-500">No bookings found</p>
          <p className="mt-1 text-xs text-slate-400">Create a booking from an available unit</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((item) => (
            <div key={item.booking.id} className="group card-hover rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-3 flex items-start justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-slate-400">{item.booking.referenceNumber}</p>
                  <h3 className="truncate text-sm font-bold text-slate-900">{item.project?.name || "Unknown Project"}</h3>
                  <p className="text-xs text-slate-500">
                    {item.unit?.unitNumber && <>Unit #{item.unit.unitNumber}</>}
                    {item.unit?.name && <> &middot; {item.unit.name}</>}
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[item.booking.status] || "bg-slate-100 text-slate-600"}`}>
                    {item.booking.status.charAt(0).toUpperCase() + item.booking.status.slice(1)}
                  </span>
                  {item.booking.status !== "sold" && (
                    <button onClick={() => { setDeleteConfirm(item.booking.id); setDeleteError(""); }}
                      className="rounded-lg p-1.5 text-slate-300 transition-colors hover:bg-red-50 hover:text-red-500" title="Delete Booking">
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>

              <div className="mb-4 space-y-1.5">
                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <div className="flex h-5 w-5 items-center justify-center rounded-md bg-brand-50"><IndianRupee size={10} className="text-brand-600" /></div>
                  <span>Sale: {formatCurrency(item.booking.salePrice)}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <div className="flex h-5 w-5 items-center justify-center rounded-md bg-slate-100"><User size={10} className="text-slate-500" /></div>
                  <span>{item.client?.name || "N/A"}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <div className="flex h-5 w-5 items-center justify-center rounded-md bg-slate-100"><Building2 size={10} className="text-slate-400" /></div>
                  <span>CNIC: {item.client?.cnic || "N/A"}</span>
                </div>
                <p className="text-xs text-slate-400">Date: {new Date(item.booking.bookingDate).toLocaleDateString("en-PK")}</p>
              </div>

              <Link href={`/bookings/${item.booking.id}`}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-brand-200 bg-brand-50 px-3 py-2.5 text-xs font-medium text-brand-700 transition-all duration-200 hover:bg-brand-100 hover:shadow-sm active:scale-[0.97]">
                <Eye size={14} /> View Details
              </Link>
            </div>
          ))}
        </div>
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="animate-scale-in w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900">Delete Booking</h3>
            <p className="mt-2 text-sm text-slate-500">
              Are you sure you want to delete this booking? This action cannot be undone.
            </p>
            {deleteError && (
              <div className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-600">{deleteError}</div>
            )}
            <div className="mt-5 flex justify-end gap-3">
              <button onClick={() => { setDeleteConfirm(null); setDeleteError(""); }} disabled={deleteLoading}
                className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-600 transition-all duration-200 hover:bg-slate-50 active:scale-[0.97] disabled:opacity-50">Cancel</button>
              <button onClick={handleDelete} disabled={deleteLoading}
                className="rounded-xl bg-gradient-to-br from-red-600 to-red-700 px-5 py-2.5 text-sm font-medium text-white shadow-md transition-all duration-200 hover:from-red-700 hover:to-red-800 active:scale-[0.97] disabled:opacity-50">
                {deleteLoading ? "Deleting..." : "Delete Booking"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
