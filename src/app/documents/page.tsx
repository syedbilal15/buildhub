"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FileText } from "lucide-react";
import Button from "@/components/Button";
import SearchInput from "@/components/SearchInput";
import Badge from "@/components/Badge";
import Spinner from "@/components/Spinner";

interface BookingListItem {
  booking: { id: number; salePrice: string; status: string; bookingDate: string; referenceNumber: string | null };
  project: { id: number; name: string; unitNumber: string } | null;
  client: { id: number; name: string; cnic: string } | null;
}

function formatCurrency(amount: string | number) {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(num)) return "Rs. 0";
  return new Intl.NumberFormat("en-PK", { style: "currency", currency: "PKR", maximumFractionDigits: 0 }).format(num);
}

export default function DocumentsPage() {
  const [bookings, setBookings] = useState<BookingListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/bookings").then((r) => r.json()).then((d) => { setBookings(d); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const filtered = bookings.filter((b) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return b.client?.name?.toLowerCase().includes(s) || b.project?.name?.toLowerCase().includes(s) || b.booking.referenceNumber?.toLowerCase().includes(s);
  });

  if (loading) return <Spinner />;

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Documents</h1>
        <p className="mt-1 text-sm text-slate-500">Generate legal sale documents and payment records</p>
      </div>

      <SearchInput value={search} onChange={setSearch} placeholder="Search bookings..." />

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white py-16 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-50">
            <FileText size={36} className="text-slate-300" />
          </div>
          <p className="text-sm font-medium text-slate-500">No bookings available for document generation</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80">
                  <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Reference</th>
                  <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Client</th>
                  <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Property</th>
                  <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Price</th>
                  <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Status</th>
                  <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((item) => (
                  <tr key={item.booking.id} className="transition-colors hover:bg-slate-50/50">
                    <td className="px-5 py-4 font-medium text-slate-800">{item.booking.referenceNumber}</td>
                    <td className="px-5 py-4 text-slate-600">{item.client?.name || "N/A"}</td>
                    <td className="px-5 py-4 text-slate-600">{item.project?.name || "N/A"} — #{item.project?.unitNumber}</td>
                    <td className="px-5 py-4 font-medium text-slate-800">{formatCurrency(item.booking.salePrice)}</td>
                    <td className="px-5 py-4"><Badge>{item.booking.status}</Badge></td>
                    <td className="px-5 py-4">
                      <Link href={`/documents/${item.booking.id}`}>
                        <Button variant="outline" size="sm"><FileText size={13} /> Generate</Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
