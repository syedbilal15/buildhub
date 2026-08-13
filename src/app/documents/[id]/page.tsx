"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { startTransition } from "react";
import { ArrowLeft, Printer } from "lucide-react";
import Button from "@/components/Button";
import Spinner from "@/components/Spinner";

function formatCurrency(amount: string | number) {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(num)) return "Rs. 0";
  return new Intl.NumberFormat("en-PK", {
    style: "currency", currency: "PKR", maximumFractionDigits: 0,
  }).format(num);
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const months = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];
  return `${d.getDate()} Day of ${months[d.getMonth()]}, ${d.getFullYear()}`;
}

function formatDateSimple(dateStr: string | null) {
  if (!dateStr) return "_____";
  const d = new Date(dateStr);
  return `${d.getDate()}-${d.getMonth() + 1}-${d.getFullYear()}`;
}

function formatDateWords(dateStr: string | null) {
  if (!dateStr) return "_____";
  const d = new Date(dateStr);
  const months = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];
  return `${d.getDate()}${d.getDate() === 1 ? "st" : d.getDate() === 2 ? "nd" : d.getDate() === 3 ? "rd" : "th"} Day of ${months[d.getMonth()]}, ${d.getFullYear()}`;
}

interface BookingDetail {
  booking: {
    id: number; salePrice: string; downPayment: string; paymentType: string;
    installmentCount: number; installmentFrequency: string; installmentAmount: string | null;
    bookingDate: string; status: string; referenceNumber: string | null;
  };
  project: {
    id: number; name: string; unitNumber: string; address: string | null;
    size: string | null; sizeUnit: string | null; category: string | null; price: string;
  } | null;
  client: {
    id: number; name: string; cnic: string; phone: string; email: string | null; address: string | null;
  } | null;
  unit: {
    id: number; unitNumber: string; name: string | null; propertyType: string;
    floor: string | null; block: string | null; area: string | null; areaUnit: string;
    bedrooms: number | null; bathrooms: number | null; price: string; status: string;
  } | null;
  installments: Array<{
    id: number; installmentNumber: number; dueDate: string; amount: string;
    paidAmount: string; paidDate: string | null; status: string;
    receiptNumber: string | null; paymentMethod: string | null;
  }>;
  payments: Array<{
    id: number; amount: string; paymentDate: string; paymentMethod: string | null;
    receiptNumber: string | null;
  }>;
}

const PROPERTY_TYPES: Record<string, string> = {
  apartment: "Apartment", shop: "Shop", openRoof: "Open Roof", pentHouse: "Pent House",
};

export default function DocumentPage() {
  const params = useParams();
  const router = useRouter();
  const [data, setData] = useState<BookingDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/bookings/${params.id}`);
      if (!res.ok) throw new Error("Not found");
      const d = await res.json();
      setData(d);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [params.id]);

  useEffect(() => { startTransition(() => fetchData()); }, [fetchData]);

  const handlePrint = () => { window.print(); };

  if (loading) return <Spinner />;

  if (!data) {
    return (
      <div className="py-20 text-center">
        <p className="text-lg font-medium text-slate-500">Booking not found</p>
        <button onClick={() => router.back()} className="mt-4 inline-flex items-center gap-2 text-sm text-brand-600 hover:underline">
          <ArrowLeft size={14} /> Go Back
        </button>
      </div>
    );
  }

  const totalPaid = data.installments.reduce((sum, i) => sum + parseFloat(i.paidAmount || "0"), 0);
  const downPaymentAmount = parseFloat(data.booking.downPayment || "0");
  const grandTotalPaid = totalPaid + downPaymentAmount;
  const salePrice = parseFloat(data.booking.salePrice || "0");
  const remaining = salePrice - grandTotalPaid;
  const isInstallment = data.booking.paymentType === "installment";
  const bookingDate = data.booking.bookingDate;

  const day = bookingDate ? new Date(bookingDate).getDate() : "____";
  const month = bookingDate ? new Date(bookingDate).toLocaleString("default", { month: "long" }) : "____________";
  const year = bookingDate ? new Date(bookingDate).getFullYear() : "20____";

  const nextDueInstallment = data.installments.find((i) => i.status === "pending");

  return (
    <div>
      <div className="no-print mb-6 flex items-center justify-between">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft size={16} /> Back
        </Button>
        <Button onClick={handlePrint}>
          <Printer size={16} /> Print / Save as PDF
        </Button>
      </div>

      <div id="print-area" className="mx-auto max-w-[210mm] bg-white p-10 sm:p-12 sm:pb-8"
        style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: "12pt", lineHeight: "1.6", color: "#000" }}
      >
        {/* Header */}
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold tracking-wide">BUILD HUB</h1>
          <p className="text-sm">Purchase Agreement</p>
          <hr className="my-3 border-t-2 border-black" />
        </div>

        {/* Agreement Date */}
        <div className="mb-6">
          <p className="text-sm">
            This Agreement is entered into on:{" "}
            <span className="border-b border-black px-2 font-medium">{String(day)}</span> / {" "}
            <span className="border-b border-black px-2 font-medium">{String(month)}</span> / {" "}
            <span className="border-b border-black px-2 font-medium">{String(year)}</span>
          </p>
        </div>

        {/* 2. Client Information */}
        <div className="mb-6">
          <h2 className="mb-2 text-base font-bold">CLIENT INFORMATION</h2>
          <table className="w-full text-sm">
            <tbody>
              <tr><td className="w-32 py-1 font-medium">Name:</td><td className="border-b border-black py-1">{data.client?.name || "_________________________"}</td></tr>
              <tr><td className="w-32 py-1 font-medium">CNIC:</td><td className="border-b border-black py-1">{data.client?.cnic || "_________________________"}</td></tr>
              <tr><td className="w-32 py-1 font-medium">Phone:</td><td className="border-b border-black py-1">{data.client?.phone || "_________________________"}</td></tr>
              <tr><td className="w-32 py-1 font-medium">Address:</td><td className="border-b border-black py-1">{data.client?.address || "_________________________"}</td></tr>
            </tbody>
          </table>
        </div>

        {/* 3. Property Information */}
        <div className="mb-6">
          <h2 className="mb-2 text-base font-bold">PROPERTY INFORMATION</h2>
          <table className="w-full text-sm">
            <tbody>
              <tr><td className="w-32 py-1 font-medium">Project:</td><td className="border-b border-black py-1">{data.project?.name || "_________________________"}</td></tr>
              <tr><td className="w-32 py-1 font-medium">Unit:</td><td className="border-b border-black py-1">{data.unit?.unitNumber || "_________________________"}</td></tr>
              <tr><td className="w-32 py-1 font-medium">Type:</td><td className="border-b border-black py-1">{data.unit ? (PROPERTY_TYPES[data.unit.propertyType] || data.unit.propertyType) : "_________________________"}</td></tr>
              <tr><td className="w-32 py-1 font-medium">Floor:</td><td className="border-b border-black py-1">{data.unit?.floor || "_________________________"}</td></tr>
              <tr><td className="w-32 py-1 font-medium">Area:</td><td className="border-b border-black py-1">{data.unit?.area ? `${data.unit.area} ${data.unit.areaUnit}` : "_________________________"}</td></tr>
            </tbody>
          </table>
        </div>

        {/* 4. Price Information */}
        <div className="mb-6">
          <h2 className="mb-2 text-base font-bold">PRICE INFORMATION</h2>
          <table className="w-full text-sm">
            <tbody>
              <tr><td className="w-40 py-1 font-medium">Total Price:</td><td className="border-b border-black py-1 text-right font-bold">{formatCurrency(salePrice)}</td></tr>
              <tr><td className="w-40 py-1 font-medium">Down Payment:</td><td className="border-b border-black py-1 text-right">{formatCurrency(downPaymentAmount)}</td></tr>
              <tr><td className="w-40 py-1 font-medium">Amount Paid:</td><td className="border-b border-black py-1 text-right">{formatCurrency(grandTotalPaid)}</td></tr>
              <tr className="font-bold"><td className="w-40 py-1">Balance Due:</td><td className="border-b-2 border-black py-1 text-right">{formatCurrency(remaining)}</td></tr>
            </tbody>
          </table>
        </div>

        {/* 5. Installment Schedule */}
        {isInstallment && (
          <div className="mb-6">
            <h2 className="mb-2 text-base font-bold">INSTALLMENT SCHEDULE</h2>
            {data.installments.length > 0 && (
              <div className="border border-black text-xs">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-black bg-gray-100">
                      <th className="py-1 px-2 text-left font-bold">Due Date</th>
                      <th className="py-1 px-2 text-right font-bold">Amount</th>
                      <th className="py-1 px-2 text-right font-bold">Paid</th>
                      <th className="py-1 px-2 text-left font-bold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.installments.slice(0, 15).map((inst) => (
                      <tr key={inst.id} className="border-b border-gray-300">
                        <td className="py-1 px-2">{formatDateSimple(inst.dueDate)}</td>
                        <td className="py-1 px-2 text-right">{formatCurrency(inst.amount)}</td>
                        <td className="py-1 px-2 text-right">{formatCurrency(inst.paidAmount)}</td>
                        <td className="py-1 px-2 capitalize">{inst.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* 6. Signatures */}
        <div className="mt-8" style={{ pageBreakInside: "avoid" }}>
          <h2 className="mb-4 text-base font-bold">SIGNATURES</h2>
          <div className="grid grid-cols-2 gap-x-8 gap-y-6 text-sm">
            <div>
              <p className="mb-2 font-bold">Client Signature</p>
              <div className="border-b-2 border-black h-8 mb-2" />
              <p className="text-xs">{data.client?.name || "_________________________"}</p>
            </div>
            <div>
              <p className="mb-2 font-bold">Builder Signature</p>
              <div className="border-b-2 border-black h-8 mb-2" />
              <p className="text-xs">Build Hub</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 border-t border-black pt-3 text-center text-xs text-gray-600">
          <p>Ref: {data.booking.referenceNumber || "N/A"} | {new Date().toLocaleDateString("en-PK")}</p>
        </div>
      </div>
    </div>
  );
}
