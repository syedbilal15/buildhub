"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FileText, Search } from "lucide-react";

interface BookingListItem {
  booking: {
    id: number;
    salePrice: string;
    downPayment: string;
    paymentType: string;
    status: string;
    bookingDate: string;
    referenceNumber: string | null;
  };
  project: {
    id: number;
    name: string;
    unitNumber: string;
  } | null;
  client: {
    id: number;
    name: string;
    cnic: string;
  } | null;
}

function formatCurrency(amount: string | number) {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(num)) return "Rs. 0";
  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    maximumFractionDigits: 0,
  }).format(num);
}

export default function DocumentsPage() {
  const [bookings, setBookings] = useState<BookingListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/bookings")
      .then((r) => r.json())
      .then((d) => {
        setBookings(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filtered = bookings.filter((b) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      b.client?.name?.toLowerCase().includes(s) ||
      b.project?.name?.toLowerCase().includes(s) ||
      b.booking.referenceNumber?.toLowerCase().includes(s)
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
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Documents
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Generate legal sale documents and payment records
        </p>
      </div>

      <div className="mb-6">
        <div className="relative max-w-md">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            placeholder="Search bookings..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-4 text-sm text-slate-800 outline-none transition-all duration-200 placeholder:text-slate-400 focus:border-brand-400 focus:ring-2 focus:ring-brand-500/20"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white py-16 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-50">
            <FileText size={36} className="text-slate-300" />
          </div>
          <p className="text-sm font-medium text-slate-500">
            No bookings available for document generation
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80">
                  <th className="px-5 py-3.5 font-semibold text-slate-600">
                    Reference
                  </th>
                  <th className="px-5 py-3.5 font-semibold text-slate-600">
                    Client
                  </th>
                  <th className="px-5 py-3.5 font-semibold text-slate-600">
                    Property
                  </th>
                  <th className="px-5 py-3.5 font-semibold text-slate-600">
                    Price
                  </th>
                  <th className="px-5 py-3.5 font-semibold text-slate-600">
                    Status
                  </th>
                  <th className="px-5 py-3.5 font-semibold text-slate-600">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((item) => (
                  <tr
                    key={item.booking.id}
                    className="transition-colors hover:bg-slate-50/50"
                  >
                    <td className="px-5 py-3.5 font-medium text-slate-800">
                      {item.booking.referenceNumber}
                    </td>
                    <td className="px-5 py-3.5 text-slate-600">
                      {item.client?.name || "N/A"}
                    </td>
                    <td className="px-5 py-3.5 text-slate-600">
                      {item.project?.name || "N/A"} — #
                      {item.project?.unitNumber}
                    </td>
                    <td className="px-5 py-3.5 font-medium text-slate-800">
                      {formatCurrency(item.booking.salePrice)}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ${
                          item.booking.status === "sold"
                            ? "bg-emerald-50 text-emerald-700 ring-emerald-600/20"
                            : "bg-amber-50 text-amber-700 ring-amber-600/20"
                        }`}
                      >
                        {item.booking.status.charAt(0).toUpperCase() +
                          item.booking.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <Link
                        href={`/documents/${item.booking.id}`}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-brand-50 px-3.5 py-2 text-xs font-medium text-brand-700 ring-1 ring-brand-600/20 transition-all duration-200 hover:bg-brand-100 hover:shadow-sm active:scale-[0.97]"
                      >
                        <FileText size={13} />
                        Generate
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
