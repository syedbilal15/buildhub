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
  apartment: "Apartment", office: "Office", shop: "Shop",
  villa: "Villa", plot: "Plot", warehouse: "Warehouse", commercial: "Commercial",
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
        {/* Title */}
        <h1 className="text-center text-2xl font-bold tracking-wide" style={{ fontFamily: "'Times New Roman', Times, serif" }}>
          PURCHASE AGREEMENT
        </h1>
        <hr className="my-4 border-t border-black" />

        {/* 1. Agreement Date */}
        <div className="mb-6">
          <h2 className="mb-2 text-base font-bold">1. AGREEMENT DATE</h2>
          <p className="mb-1 text-sm">This Purchase Agreement (&ldquo;Agreement&rdquo;) is entered into on:</p>
          <p className="text-sm">
            <span className="border-b border-black px-1 font-medium">{String(day)}</span> Day of{" "}
            <span className="border-b border-black px-1 font-medium">{String(month)}</span>,{" "}
            <span className="border-b border-black px-1 font-medium">{String(year)}</span>
          </p>
        </div>

        {/* 2. Seller Information */}
        <div className="mb-6">
          <h2 className="mb-2 text-base font-bold">2. SELLER INFORMATION</h2>
          <table className="w-full text-sm">
            <tbody>
              <tr><td className="w-28 py-1 align-top font-medium">Seller Name:</td><td className="border-b border-black py-1">Build Hub</td></tr>
              <tr><td className="w-28 py-1 align-top font-medium">Seller CNIC:</td><td className="border-b border-black py-1">_________________________</td></tr>
              <tr><td className="w-28 py-1 align-top font-medium">Seller Address:</td><td className="border-b border-black py-1">Lahore, Pakistan</td></tr>
              <tr><td className="w-28 py-1 align-top font-medium">Seller Phone:</td><td className="border-b border-black py-1">+92-300-0000000</td></tr>
            </tbody>
          </table>
        </div>

        {/* 3. Buyer Information */}
        <div className="mb-6">
          <h2 className="mb-2 text-base font-bold">3. BUYER INFORMATION</h2>
          <table className="w-full text-sm">
            <tbody>
              <tr><td className="w-28 py-1 align-top font-medium">Buyer Name:</td><td className="border-b border-black py-1">{data.client?.name || "_________________________"}</td></tr>
              <tr><td className="w-28 py-1 align-top font-medium">Buyer CNIC:</td><td className="border-b border-black py-1">{data.client?.cnic || "_________________________"}</td></tr>
              <tr><td className="w-28 py-1 align-top font-medium">Buyer Address:</td><td className="border-b border-black py-1">{data.client?.address || "_________________________"}</td></tr>
              <tr><td className="w-28 py-1 align-top font-medium">Buyer Phone:</td><td className="border-b border-black py-1">{data.client?.phone || "_________________________"}</td></tr>
            </tbody>
          </table>
        </div>

        {/* 4. Property Information */}
        <div className="mb-6">
          <h2 className="mb-2 text-base font-bold">4. PROPERTY INFORMATION</h2>
          <table className="w-full text-sm">
            <tbody>
              <tr><td className="w-32 py-1 align-top font-medium">Project Name:</td><td className="border-b border-black py-1">{data.project?.name || data.unit ? "—" : "_________________________"}</td></tr>
              <tr><td className="w-32 py-1 align-top font-medium">Unit Number:</td><td className="border-b border-black py-1">{data.project?.unitNumber || data.unit?.unitNumber || "_________________________"}</td></tr>
              <tr><td className="w-32 py-1 align-top font-medium">Unit Type:</td><td className="border-b border-black py-1">{data.unit ? (PROPERTY_TYPES[data.unit.propertyType] || data.unit.propertyType) : "_________________________"}</td></tr>
              <tr><td className="w-32 py-1 align-top font-medium">Floor:</td><td className="border-b border-black py-1">{data.unit?.floor || "_________________________"}</td></tr>
              <tr><td className="w-32 py-1 align-top font-medium">Area:</td><td className="border-b border-black py-1">{data.unit?.area ? `${data.unit.area} ${data.unit.areaUnit}` : data.project?.size ? `${data.project.size} ${data.project.sizeUnit || ""}` : "_________________________"}</td></tr>
              <tr><td className="w-32 py-1 align-top font-medium">Block:</td><td className="border-b border-black py-1">{data.unit?.block || "_________________________"}</td></tr>
              <tr><td className="w-32 py-1 align-top font-medium">Property Address:</td><td className="border-b border-black py-1">{data.project?.address || "_________________________"}</td></tr>
            </tbody>
          </table>
        </div>

        {/* 5. Purchase Price */}
        <div className="mb-6">
          <h2 className="mb-2 text-base font-bold">5. PURCHASE PRICE</h2>
          <table className="w-full text-sm">
            <tbody>
              <tr><td className="w-40 py-1 align-top font-medium">Purchase Price:</td><td className="border-b border-black py-1 text-right font-bold">{formatCurrency(salePrice)}</td></tr>
              <tr><td className="w-40 py-1 align-top font-medium">Amount Paid:</td><td className="border-b border-black py-1 text-right font-bold">{formatCurrency(grandTotalPaid)}</td></tr>
              <tr><td className="w-40 py-1 align-top font-medium">Remaining Balance:</td><td className="border-b border-black py-1 text-right font-bold">{formatCurrency(remaining)}</td></tr>
            </tbody>
          </table>
        </div>

        {/* 6. Payment Method */}
        <div className="mb-6">
          <h2 className="mb-2 text-base font-bold">6. PAYMENT METHOD</h2>
          <div className="space-y-1 text-sm">
            <p><span className="font-mono">{isInstallment ? "\u25a0" : "\u25a1"}</span> Cash</p>
            <p><span className="font-mono">{isInstallment ? "\u25a1" : "\u25a1"}</span> Bank Transfer</p>
            <p><span className="font-mono">{isInstallment ? "\u25a1" : "\u25a1"}</span> Cheque</p>
            <p><span className="font-mono">{isInstallment ? "\u25a0" : "\u25a1"}</span> Installments</p>
          </div>
          {isInstallment && (
            <div className="mt-3 pl-6 text-sm">
              <table className="w-full text-sm">
                <tbody>
                  <tr><td className="w-48 py-1 font-medium">Number of Installments:</td><td className="border-b border-black py-1">{data.booking.installmentCount}</td></tr>
                  <tr><td className="w-48 py-1 font-medium">Monthly Installment Amount:</td><td className="border-b border-black py-1">{data.booking.installmentAmount ? formatCurrency(data.booking.installmentAmount) : "—"}</td></tr>
                  <tr><td className="w-48 py-1 font-medium">Next Due Date:</td><td className="border-b border-black py-1">{nextDueInstallment ? formatDateSimple(nextDueInstallment.dueDate) : "—"}</td></tr>
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* 7. Terms and Conditions */}
        <div className="mb-6">
          <h2 className="mb-2 text-base font-bold">7. TERMS AND CONDITIONS</h2>
          <ol className="ml-5 list-decimal space-y-1.5 text-sm">
            <li>The Seller agrees to sell the above-described property to the Buyer at the agreed purchase price.</li>
            <li>The Buyer agrees to purchase the property and make payment according to the terms set forth in this Agreement.</li>
            <li>Ownership and title documents shall be transferred to the Buyer only after full payment of the purchase price has been received.</li>
            <li>Late payments may incur additional charges or penalties as determined by the Seller.</li>
            <li>Both parties agree to comply with all applicable laws and regulations governing the sale of property.</li>
            <li>This Agreement shall become effective upon signing by both parties.</li>
            <li>Any modification to this Agreement must be made in writing and signed by both parties.</li>
            <li>This Agreement constitutes the entire understanding between the parties with respect to the subject matter hereof.</li>
          </ol>
        </div>

        {/* 8. Signatures */}
        <div className="mb-6">
          <h2 className="mb-3 text-base font-bold">8. SIGNATURES</h2>
          <div className="grid grid-cols-2 gap-x-8 gap-y-6 text-sm">
            <div>
              <p className="mb-1 font-medium">Seller Signature</p>
              <div className="border-b border-black h-8 mb-1" />
              <p className="text-xs text-gray-600">Build Hub</p>
            </div>
            <div>
              <p className="mb-1 font-medium">Buyer Signature</p>
              <div className="border-b border-black h-8 mb-1" />
              <p className="text-xs text-gray-600">{data.client?.name || "_________________________"}</p>
            </div>
            <div>
              <p className="mb-1 font-medium">Witness 1</p>
              <div className="border-b border-black h-8 mb-1" />
            </div>
            <div>
              <p className="mb-1 font-medium">Witness 2</p>
              <div className="border-b border-black h-8 mb-1" />
            </div>
            <div className="col-span-2">
              <p className="mb-1 font-medium">Date</p>
              <div className="border-b border-black h-8 mb-1" />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 border-t border-black pt-3 text-center text-xs text-gray-500">
          <p>Ref: {data.booking.referenceNumber || "N/A"} &middot; Generated: {new Date().toLocaleDateString("en-PK", { year: "numeric", month: "long", day: "numeric" })}</p>
          <p className="mt-0.5">This is a computer-generated document from Build Hub Management System.</p>
        </div>
      </div>
    </div>
  );
}
