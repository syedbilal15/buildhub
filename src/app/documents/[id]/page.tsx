"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { startTransition } from "react";
import { ArrowLeft, Printer, Download } from "lucide-react";

function formatCurrency(amount: string | number) {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(num)) return "Rs. 0";
  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    maximumFractionDigits: 0,
  }).format(num);
}

function formatCurrencyWords(amount: string | number): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(num)) return "Zero";
  
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function convert(n: number): string {
    if (n < 20) return ones[n];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
    if (n < 1000) return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' and ' + convert(n % 100) : '');
    if (n < 100000) return convert(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 ? ' ' + convert(n % 1000) : '');
    if (n < 10000000) return convert(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 ? ' ' + convert(n % 100000) : '');
    return convert(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 ? ' ' + convert(n % 10000000) : '');
  }

  const rupees = Math.floor(num);
  const paisa = Math.round((num - rupees) * 100);
  let result = 'Rupees ' + convert(rupees);
  if (paisa > 0) result += ' and ' + convert(paisa) + ' Paisa';
  result += ' Only';
  return result;
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-PK", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

interface BookingDetail {
  booking: {
    id: number;
    salePrice: string;
    downPayment: string;
    paymentType: string;
    installmentCount: number;
    installmentFrequency: string;
    installmentAmount: string | null;
    bookingDate: string;
    status: string;
    referenceNumber: string | null;
  };
  project: {
    id: number;
    name: string;
    unitNumber: string;
    address: string | null;
    size: string | null;
    sizeUnit: string | null;
    category: string | null;
    price: string;
  } | null;
  client: {
    id: number;
    name: string;
    cnic: string;
    phone: string;
    email: string | null;
    address: string | null;
  } | null;
  installments: Array<{
    id: number;
    installmentNumber: number;
    dueDate: string;
    amount: string;
    paidAmount: string;
    paidDate: string | null;
    status: string;
    receiptNumber: string | null;
    paymentMethod: string | null;
  }>;
  payments: Array<{
    id: number;
    amount: string;
    paymentDate: string;
    paymentMethod: string | null;
    receiptNumber: string | null;
  }>;
}

const CATEGORIES: Record<string, string> = {
  residential_plot: "Residential Plot",
  house: "House",
  apartment: "Apartment",
  commercial: "Commercial",
  farmhouse: "Farm House",
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
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    startTransition(() => fetchData());
  }, [fetchData]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="py-20 text-center">
        <p className="text-lg font-medium text-slate-500">Booking not found</p>
        <button
          onClick={() => router.back()}
          className="mt-4 inline-flex items-center gap-2 text-sm text-brand-600 hover:underline"
        >
          <ArrowLeft size={14} />
          Go Back
        </button>
      </div>
    );
  }

  const totalPaid = data.installments.reduce(
    (sum, i) => sum + parseFloat(i.paidAmount || "0"),
    0
  );
  const downPaymentAmount = parseFloat(data.booking.downPayment || "0");
  const grandTotalPaid = totalPaid + downPaymentAmount;
  const salePrice = parseFloat(data.booking.salePrice || "0");
  const remaining = salePrice - grandTotalPaid;

  const today = new Date().toLocaleDateString("en-PK", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div>
      {/* Action buttons - hidden in print */}
      <div className="no-print mb-6 flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-sm text-slate-500 transition-colors hover:text-brand-600"
        >
          <ArrowLeft size={16} />
          Back
        </button>
        <button
          onClick={handlePrint}
          className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white shadow-md shadow-brand-600/30 transition-colors hover:bg-brand-700"
        >
          <Printer size={16} />
          Print / Save as PDF
        </button>
      </div>

      {/* Document Content - A4 style */}
      <div
        id="print-area"
        className="mx-auto max-w-[210mm] rounded-xl border border-slate-200 bg-white p-8 shadow-lg sm:p-12"
        style={{ fontFamily: "'Times New Roman', Times, serif" }}
      >
        {/* Letterhead */}
        <div className="mb-8 border-b-2 border-brand-700 pb-6 text-center">
          <h1
            className="text-3xl font-bold text-brand-800"
            style={{ fontFamily: "Arial, sans-serif", letterSpacing: "0.05em" }}
          >
            AL HAMD REAL ESTATE
          </h1>
          <p
            className="mt-1 text-sm text-slate-600"
            style={{ fontFamily: "Arial, sans-serif" }}
          >
            Your Trusted Partner in Real Estate
          </p>
          <p
            className="mt-1 text-xs text-slate-500"
            style={{ fontFamily: "Arial, sans-serif" }}
          >
            Lahore, Pakistan | Tel: +92-300-0000000 | Email: info@alhamd.com.pk
          </p>
        </div>

        {/* Title */}
        <div className="mb-6 text-center">
          <h2 className="text-xl font-bold text-slate-900 underline underline-offset-4">
            SALE AGREEMENT
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Reference No: <strong>{data.booking.referenceNumber}</strong> |
            Date: <strong>{today}</strong>
          </p>
        </div>

        {/* Parties */}
        <div className="mb-6">
          <h3 className="mb-2 text-sm font-bold text-slate-800">
            THIS AGREEMENT is made on {formatDate(data.booking.bookingDate)}
          </h3>
          <p className="text-sm text-slate-700">
            <strong>BETWEEN</strong>
          </p>
          <div className="ml-6 mt-2 text-sm text-slate-700">
            <p>
              <strong>Al Hamd Real Estate</strong> (hereinafter referred to as
              the &quot;First Party&quot; or &quot;Seller&quot;)
            </p>
          </div>
          <p className="mt-3 text-sm text-slate-700">
            <strong>AND</strong>
          </p>
          <div className="ml-6 mt-2 text-sm text-slate-700">
            <p>
              <strong>{data.client?.name || "N/A"}</strong> (hereinafter
              referred to as the &quot;Second Party&quot; or &quot;Purchaser&quot;)
            </p>
            <p>CNIC: {data.client?.cnic || "N/A"}</p>
            <p>Phone: {data.client?.phone || "N/A"}</p>
            {data.client?.email && <p>Email: {data.client.email}</p>}
            {data.client?.address && <p>Address: {data.client.address}</p>}
          </div>
        </div>

        {/* Property Details */}
        <div className="mb-6">
          <h3 className="mb-2 border-b border-slate-300 pb-1 text-sm font-bold text-slate-800">
            1. PROPERTY DETAILS
          </h3>
          <table className="w-full text-sm">
            <tbody>
              <tr className="border-b border-slate-100">
                <td className="py-2 font-medium text-slate-700 w-1/3">
                  Project Name
                </td>
                <td className="py-2 text-slate-800">
                  {data.project?.name || "N/A"}
                </td>
              </tr>
              <tr className="border-b border-slate-100">
                <td className="py-2 font-medium text-slate-700">
                  Unit/Plot Number
                </td>
                <td className="py-2 text-slate-800">
                  {data.project?.unitNumber || "N/A"}
                </td>
              </tr>
              <tr className="border-b border-slate-100">
                <td className="py-2 font-medium text-slate-700">
                  Category
                </td>
                <td className="py-2 text-slate-800">
                  {CATEGORIES[data.project?.category || ""] || "N/A"}
                </td>
              </tr>
              {data.project?.size && (
                <tr className="border-b border-slate-100">
                  <td className="py-2 font-medium text-slate-700">Size</td>
                  <td className="py-2 text-slate-800">
                    {data.project.size} {data.project.sizeUnit}
                  </td>
                </tr>
              )}
              {data.project?.address && (
                <tr className="border-b border-slate-100">
                  <td className="py-2 font-medium text-slate-700">
                    Location
                  </td>
                  <td className="py-2 text-slate-800">
                    {data.project.address}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Payment Terms */}
        <div className="mb-6">
          <h3 className="mb-2 border-b border-slate-300 pb-1 text-sm font-bold text-slate-800">
            2. PAYMENT TERMS
          </h3>
          <table className="w-full text-sm">
            <tbody>
              <tr className="border-b border-slate-100">
                <td className="py-2 font-medium text-slate-700 w-1/3">
                  Total Sale Price
                </td>
                <td className="py-2 font-bold text-slate-800">
                  {formatCurrency(salePrice)}
                </td>
              </tr>
              <tr className="border-b border-slate-100">
                <td className="py-2 font-medium text-slate-700">
                  In Words
                </td>
                <td className="py-2 text-slate-700 italic">
                  {formatCurrencyWords(salePrice)}
                </td>
              </tr>
              <tr className="border-b border-slate-100">
                <td className="py-2 font-medium text-slate-700">
                  Down Payment
                </td>
                <td className="py-2 text-slate-800">
                  {formatCurrency(downPaymentAmount)}
                </td>
              </tr>
              <tr className="border-b border-slate-100">
                <td className="py-2 font-medium text-slate-700">
                  Payment Type
                </td>
                <td className="py-2 text-slate-800">
                  {data.booking.paymentType === "full"
                    ? "Full Payment"
                    : `Installment Plan (${data.booking.installmentCount} ${data.booking.installmentFrequency} installments)`}
                </td>
              </tr>
              {data.booking.paymentType === "installment" &&
                data.booking.installmentAmount && (
                  <tr className="border-b border-slate-100">
                    <td className="py-2 font-medium text-slate-700">
                      Each Installment
                    </td>
                    <td className="py-2 text-slate-800">
                      {formatCurrency(data.booking.installmentAmount)}
                    </td>
                  </tr>
                )}
              <tr className="border-b border-slate-100">
                <td className="py-2 font-medium text-slate-700">
                  Total Paid
                </td>
                <td className="py-2 text-emerald-700 font-bold">
                  {formatCurrency(grandTotalPaid)}
                </td>
              </tr>
              <tr>
                <td className="py-2 font-medium text-slate-700">
                  Remaining Balance
                </td>
                <td className="py-2 text-red-700 font-bold">
                  {formatCurrency(remaining)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Installment Schedule */}
        {data.installments.length > 0 && (
          <div className="mb-6">
            <h3 className="mb-2 border-b border-slate-300 pb-1 text-sm font-bold text-slate-800">
              3. INSTALLMENT SCHEDULE
            </h3>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-300 bg-slate-50">
                  <th className="px-2 py-2 text-left font-medium text-slate-700">
                    #
                  </th>
                  <th className="px-2 py-2 text-left font-medium text-slate-700">
                    Due Date
                  </th>
                  <th className="px-2 py-2 text-left font-medium text-slate-700">
                    Amount
                  </th>
                  <th className="px-2 py-2 text-left font-medium text-slate-700">
                    Paid
                  </th>
                  <th className="px-2 py-2 text-left font-medium text-slate-700">
                    Date Paid
                  </th>
                  <th className="px-2 py-2 text-left font-medium text-slate-700">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {downPaymentAmount > 0 && (
                  <tr className="border-b border-slate-100">
                    <td className="px-2 py-1.5">DP</td>
                    <td className="px-2 py-1.5">
                      {formatDate(data.booking.bookingDate)}
                    </td>
                    <td className="px-2 py-1.5">
                      {formatCurrency(downPaymentAmount)}
                    </td>
                    <td className="px-2 py-1.5">
                      {formatCurrency(downPaymentAmount)}
                    </td>
                    <td className="px-2 py-1.5">
                      {formatDate(data.booking.bookingDate)}
                    </td>
                    <td className="px-2 py-1.5">Paid</td>
                  </tr>
                )}
                {data.installments.map((inst) => (
                  <tr key={inst.id} className="border-b border-slate-100">
                    <td className="px-2 py-1.5">{inst.installmentNumber}</td>
                    <td className="px-2 py-1.5">
                      {formatDate(inst.dueDate)}
                    </td>
                    <td className="px-2 py-1.5">
                      {formatCurrency(inst.amount)}
                    </td>
                    <td className="px-2 py-1.5">
                      {formatCurrency(inst.paidAmount)}
                    </td>
                    <td className="px-2 py-1.5">
                      {formatDate(inst.paidDate)}
                    </td>
                    <td className="px-2 py-1.5 capitalize">
                      {inst.status}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Terms & Conditions */}
        <div className="mb-6">
          <h3 className="mb-2 border-b border-slate-300 pb-1 text-sm font-bold text-slate-800">
            4. TERMS &amp; CONDITIONS
          </h3>
          <ol className="ml-4 list-decimal space-y-2 text-xs text-slate-700">
            <li>
              The Purchaser agrees to purchase the above-described property from
              the Seller at the agreed total sale price.
            </li>
            <li>
              The Purchaser has paid the down payment as specified above and
              agrees to pay the remaining balance according to the agreed payment
              schedule.
            </li>
            <li>
              In case of default in payment of any installment for a period
              exceeding 30 days from the due date, the Seller reserves the right
              to cancel this agreement and forfeit the amounts already paid, in
              whole or in part, at the Seller&apos;s discretion.
            </li>
            <li>
              The Seller shall transfer the ownership/title documents to the
              Purchaser only after full payment of the sale price has been
              received.
            </li>
            <li>
              All payments shall be made through bank transfer, pay order, or
              cash. Cheque payments are subject to realization.
            </li>
            <li>
              Any dispute arising out of this agreement shall be subject to the
              jurisdiction of the courts in Lahore, Pakistan.
            </li>
            <li>
              This agreement constitutes the entire understanding between the
              parties and supersedes all prior negotiations, representations, or
              agreements.
            </li>
            <li>
              Any modification to this agreement must be made in writing and
              signed by both parties.
            </li>
          </ol>
        </div>

        {/* Signatures */}
        <div className="mt-12 grid grid-cols-2 gap-8">
          <div>
            <div className="mb-2 h-16 border-b border-slate-400" />
            <p className="text-sm font-bold text-slate-800">
              First Party (Seller)
            </p>
            <p className="text-xs text-slate-600">
              Authorized Representative
            </p>
            <p className="text-xs text-slate-600">Al Hamd Real Estate</p>
            <p className="mt-2 text-xs text-slate-500">Date: _______________</p>
          </div>
          <div>
            <div className="mb-2 h-16 border-b border-slate-400" />
            <p className="text-sm font-bold text-slate-800">
              Second Party (Purchaser)
            </p>
            <p className="text-xs text-slate-600">
              {data.client?.name || "N/A"}
            </p>
            <p className="text-xs text-slate-600">
              CNIC: {data.client?.cnic || "N/A"}
            </p>
            <p className="mt-2 text-xs text-slate-500">Date: _______________</p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-10 border-t border-slate-200 pt-4 text-center text-xs text-slate-400">
          <p>
            This is a computer-generated document from Al Hamd Real Estate
            Management System.
          </p>
          <p>
            Ref: {data.booking.referenceNumber} | Generated: {today}
          </p>
        </div>
      </div>
    </div>
  );
}
