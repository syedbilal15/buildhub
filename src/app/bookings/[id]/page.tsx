"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { startTransition } from "react";
import {
  ArrowLeft, CheckCircle2, FileText, CreditCard, User, Building2, Layers,
  Calendar, Receipt, Trash2, Ban,
} from "lucide-react";
import Button from "@/components/Button";
import Badge from "@/components/Badge";
import Spinner from "@/components/Spinner";
import Modal from "@/components/Modal";
import ConfirmDialog from "@/components/ConfirmDialog";
import Input from "@/components/Input";
import Select from "@/components/Select";

function formatCurrency(amount: string | number) {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(num)) return "Rs. 0";
  return new Intl.NumberFormat("en-PK", {
    style: "currency", currency: "PKR", maximumFractionDigits: 0,
  }).format(num);
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return "\u2014";
  return new Date(dateStr).toLocaleDateString("en-PK", {
    year: "numeric", month: "short", day: "numeric",
  });
}

interface BookingDetail {
  booking: {
    id: number; salePrice: string; downPayment: string; paymentType: string;
    installmentCount: number; installmentFrequency: string; installmentAmount: string | null;
    bookingDate: string; status: string; referenceNumber: string | null;
  };
  project: { id: number; name: string; projectCode: string | null; location: string | null } | null;
  unit: { id: number; unitNumber: string; name: string | null; propertyType: string; area: string | null; price: string; status: string } | null;
  client: { id: number; name: string; cnic: string; phone: string; email: string | null; address: string | null } | null;
  installments: Array<{
    id: number; installmentNumber: number; dueDate: string; amount: string;
    paidAmount: string; paidDate: string | null; status: string;
    receiptNumber: string | null; paymentMethod: string | null; notes: string | null;
  }>;
  payments: Array<{
    id: number; amount: string; paymentDate: string; paymentMethod: string | null;
    receiptNumber: string | null; notes: string | null;
  }>;
}

export default function BookingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [data, setData] = useState<BookingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [payModal, setPayModal] = useState<{ installmentId: number; installmentNumber: number; amount: string } | null>(null);
  const [payForm, setPayForm] = useState({ paidAmount: "", paidDate: new Date().toISOString().split("T")[0], paymentMethod: "cash", receiptNumber: "", notes: "" });
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [cancelConfirm, setCancelConfirm] = useState(false);
  const [actionError, setActionError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

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

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payModal) return;
    setSaving(true);
    try {
      await fetch(`/api/installments/${payModal.installmentId}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paidAmount: payForm.paidAmount, paidDate: payForm.paidDate,
          paymentMethod: payForm.paymentMethod, receiptNumber: payForm.receiptNumber || null,
          notes: payForm.notes || null, status: "paid",
        }),
      });
      setPayModal(null);
      setPayForm({ paidAmount: "", paidDate: new Date().toISOString().split("T")[0], paymentMethod: "cash", receiptNumber: "", notes: "" });
      fetchData();
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  };

  const handleFinalize = async () => {
    if (!data) return;
    if (!confirm("Mark this booking as SOLD and finalize the deal?")) return;
    try {
      await fetch(`/api/bookings/${data.booking.id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "sold" }),
      });
      fetchData();
    } catch (err) { console.error(err); }
  };

  const handleDelete = async () => {
    if (!data) return;
    setActionLoading(true);
    setActionError("");
    try {
      const res = await fetch(`/api/bookings/${data.booking.id}`, { method: "DELETE" });
      const result = await res.json();
      if (!res.ok) { setActionError(result.error || "Failed to delete booking"); return; }
      setDeleteConfirm(false);
      setSuccessMsg("Booking deleted successfully");
      setTimeout(() => router.push("/bookings"), 1000);
    } catch { setActionError("Network error. Please try again."); }
    finally { setActionLoading(false); }
  };

  const handleCancel = async () => {
    if (!data) return;
    setActionLoading(true);
    setActionError("");
    try {
      const res = await fetch(`/api/bookings/${data.booking.id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "cancelled", cancellationReason: "Cancelled by admin", cancelledAt: new Date().toISOString() }),
      });
      const result = await res.json();
      if (!res.ok) { setActionError(result.error || "Failed to cancel booking"); return; }
      setCancelConfirm(false);
      setSuccessMsg("Booking cancelled successfully");
      fetchData();
    } catch { setActionError("Network error. Please try again."); }
    finally { setActionLoading(false); }
  };

  const openPayModal = (installmentId: number, installmentNumber: number, amount: string) => {
    setPayForm({ ...payForm, paidAmount: amount });
    setPayModal({ installmentId, installmentNumber, amount });
  };

  if (loading) return <Spinner />;

  if (!data) {
    return (
      <div className="py-20 text-center">
        <p className="text-lg font-medium text-slate-500">Booking not found</p>
        <Link href="/bookings" className="mt-4 inline-flex items-center gap-2 text-sm text-brand-600 hover:underline">
          <ArrowLeft size={14} /> Back to Bookings
        </Link>
      </div>
    );
  }

  const totalPaid = data.installments.reduce((sum, i) => sum + parseFloat(i.paidAmount || "0"), 0);
  const downPaymentAmount = parseFloat(data.booking.downPayment || "0");
  const grandTotalPaid = totalPaid + downPaymentAmount;
  const salePrice = parseFloat(data.booking.salePrice || "0");
  const remaining = salePrice - grandTotalPaid;
  const overdueCount = data.installments.filter((i) => i.status === "pending" && new Date(i.dueDate) < new Date()).length;
  const isOverdue = (i: (typeof data.installments)[0]) => i.status === "pending" && new Date(i.dueDate) < new Date();
  const hasPayments = data.payments.length > 0;
  const isActive = data.booking.status !== "sold" && data.booking.status !== "cancelled";

  return (
    <div className="animate-fade-in">
      <button onClick={() => router.push("/bookings")} className="mb-6 inline-flex items-center gap-2 text-sm text-slate-500 transition-colors hover:text-brand-600">
        <ArrowLeft size={16} /> Back to Bookings
      </button>

      {successMsg && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-3 text-sm font-medium text-emerald-700">
          <CheckCircle2 size={16} />
          {successMsg}
        </div>
      )}

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Booking #{data.booking.referenceNumber}</h1>
          <p className="mt-1 text-sm text-slate-500">
            {data.project?.name} — Unit #{data.unit?.unitNumber || ""} {data.unit?.name || ""}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {isActive && data.booking.status !== "sold" && (
            <Button onClick={handleFinalize}><CheckCircle2 size={16} /> Finalize Sale</Button>
          )}
          {isActive && !hasPayments && (
            <Button variant="danger" onClick={() => { setDeleteConfirm(true); setActionError(""); }}><Trash2 size={16} /> Delete</Button>
          )}
          {isActive && hasPayments && (
            <button onClick={() => { setCancelConfirm(true); setActionError(""); }}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-amber-600 to-amber-700 px-4 py-2.5 text-sm font-medium text-white shadow-md transition-all duration-200 hover:from-amber-700 hover:to-amber-800 active:scale-[0.97]">
              <Ban size={16} /> Cancel Booking
            </button>
          )}
          <Link href={`/documents/${data.booking.id}`}>
            <Button variant="outline"><FileText size={16} /> Generate Document</Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-base font-semibold text-slate-900">Payment Overview</h2>
            <div className="grid gap-4 sm:grid-cols-4">
              <div className="rounded-xl bg-gradient-to-br from-brand-50 to-brand-100/50 p-4">
                <p className="text-xs font-medium text-brand-600">Sale Price</p>
                <p className="mt-1 text-lg font-bold text-brand-800">{formatCurrency(salePrice)}</p>
              </div>
              <div className="rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100/50 p-4">
                <p className="text-xs font-medium text-emerald-600">Total Paid</p>
                <p className="mt-1 text-lg font-bold text-emerald-800">{formatCurrency(grandTotalPaid)}</p>
              </div>
              <div className="rounded-xl bg-gradient-to-br from-orange-50 to-orange-100/50 p-4">
                <p className="text-xs font-medium text-orange-600">Remaining</p>
                <p className="mt-1 text-lg font-bold text-orange-800">{formatCurrency(remaining)}</p>
              </div>
              <div className="rounded-xl bg-gradient-to-br from-red-50 to-red-100/50 p-4">
                <p className="text-xs font-medium text-red-600">Overdue</p>
                <p className="mt-1 text-lg font-bold text-red-800">{overdueCount}</p>
              </div>
            </div>
            <div className="mt-5">
              <div className="flex justify-between text-xs text-slate-500">
                <span>Payment Progress</span>
                <span>{salePrice > 0 ? Math.round((grandTotalPaid / salePrice) * 100) : 0}%</span>
              </div>
              <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-slate-200">
                <div className="h-full rounded-full bg-gradient-to-r from-brand-500 to-brand-400 transition-all duration-500"
                  style={{ width: `${Math.min(100, (grandTotalPaid / salePrice) * 100)}%` }} />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900">
                <Calendar size={16} className="text-brand-500" /> Installment Schedule
              </h2>
              {data.booking.paymentType === "full" ? (
                <Badge variant="success">Full Payment</Badge>
              ) : (
                <span className="text-xs font-medium text-slate-500">{data.booking.installmentCount} {data.booking.installmentFrequency} installments</span>
              )}
            </div>
            {data.installments.length === 0 && data.booking.paymentType === "full" ? (
              <div className="p-6 text-center text-sm text-slate-500">Full payment booking — no installment schedule.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/80">
                      <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">#</th>
                      <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Due Date</th>
                      <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Amount</th>
                      <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Paid</th>
                      <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Status</th>
                      <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {downPaymentAmount > 0 && (
                      <tr className="bg-emerald-50/40">
                        <td className="px-5 py-3.5 font-medium text-slate-800">DP</td>
                        <td className="px-5 py-3.5 text-slate-600">{formatDate(data.booking.bookingDate)}</td>
                        <td className="px-5 py-3.5 font-medium text-slate-800">{formatCurrency(data.booking.downPayment)}</td>
                        <td className="px-5 py-3.5 font-medium text-emerald-600">{formatCurrency(data.booking.downPayment)}</td>
                        <td className="px-5 py-3.5"><Badge>paid</Badge></td>
                        <td className="px-5 py-3.5 text-slate-400">—</td>
                      </tr>
                    )}
                    {data.installments.map((inst) => (
                      <tr key={inst.id} className={`transition-colors ${isOverdue(inst) ? "bg-red-50/40" : inst.status === "paid" ? "bg-emerald-50/20" : ""}`}>
                        <td className="px-5 py-3.5 font-medium text-slate-800">{inst.installmentNumber}</td>
                        <td className="px-5 py-3.5 text-slate-600">{formatDate(inst.dueDate)}</td>
                        <td className="px-5 py-3.5 font-medium text-slate-800">{formatCurrency(inst.amount)}</td>
                        <td className="px-5 py-3.5 font-medium text-emerald-600">{formatCurrency(inst.paidAmount)}</td>
                        <td className="px-5 py-3.5"><Badge>{isOverdue(inst) ? "overdue" : inst.status}</Badge></td>
                        <td className="px-5 py-3.5">
                          {inst.status !== "paid" && (
                            <button onClick={() => openPayModal(inst.id, inst.installmentNumber, inst.amount)}
                              className="inline-flex items-center gap-1 rounded-lg bg-brand-50 px-2.5 py-1.5 text-xs font-medium text-brand-700 ring-1 ring-brand-600/20 transition-all duration-200 hover:bg-brand-100 active:scale-[0.95]">
                              <CreditCard size={12} /> Pay
                            </button>
                          )}
                          {inst.status === "paid" && inst.receiptNumber && (
                            <span className="text-xs text-slate-400">Rec: {inst.receiptNumber}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {data.payments.length > 0 && (
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-6 py-4">
                <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900">
                  <Receipt size={16} className="text-brand-500" /> Payment History
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/80">
                      <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Date</th>
                      <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Amount</th>
                      <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Method</th>
                      <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Receipt #</th>
                      <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.payments.map((p) => (
                      <tr key={p.id}>
                        <td className="px-5 py-3.5 text-slate-600">{formatDate(p.paymentDate)}</td>
                        <td className="px-5 py-3.5 font-medium text-emerald-700">{formatCurrency(p.amount)}</td>
                        <td className="px-5 py-3.5 capitalize text-slate-600">{p.paymentMethod || "—"}</td>
                        <td className="px-5 py-3.5 text-slate-600">{p.receiptNumber || "—"}</td>
                        <td className="px-5 py-3.5 text-slate-500">{p.notes || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-50"><User size={14} className="text-brand-600" /></div>
              Client Information
            </h3>
            {data.client ? (
              <div className="space-y-2 text-sm">
                <p className="flex justify-between"><span className="text-slate-500">Name:</span><span className="font-medium text-slate-800">{data.client.name}</span></p>
                <p className="flex justify-between"><span className="text-slate-500">CNIC:</span><span className="font-medium text-slate-800">{data.client.cnic}</span></p>
                <p className="flex justify-between"><span className="text-slate-500">Phone:</span><span className="font-medium text-slate-800">{data.client.phone}</span></p>
                {data.client.email && <p className="flex justify-between"><span className="text-slate-500">Email:</span><span className="font-medium text-slate-800">{data.client.email}</span></p>}
                {data.client.address && <p className="flex justify-between"><span className="text-slate-500">Address:</span><span className="font-medium text-slate-800 text-right max-w-[60%] truncate">{data.client.address}</span></p>}
              </div>
            ) : <p className="text-sm text-slate-400">No client data</p>}
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-50"><Building2 size={14} className="text-brand-600" /></div>
              Property Information
            </h3>
            {data.project ? (
              <div className="space-y-2 text-sm">
                <p className="flex justify-between"><span className="text-slate-500">Project:</span><span className="font-medium text-slate-800">{data.project.name}</span></p>
                <p className="flex justify-between"><span className="text-slate-500">Unit:</span><span className="font-medium text-slate-800">#{data.unit?.unitNumber || "—"}{data.unit?.name ? ` (${data.unit.name})` : ""}</span></p>
                {data.unit?.area && <p className="flex justify-between"><span className="text-slate-500">Area:</span><span className="font-medium text-slate-800">{data.unit.area} sq ft</span></p>}
                <p className="flex justify-between"><span className="text-slate-500">Sale Price:</span><span className="font-medium text-slate-800">{formatCurrency(data.booking.salePrice)}</span></p>
                {data.project.location && <p className="flex justify-between"><span className="text-slate-500">Location:</span><span className="font-medium text-slate-800 text-right max-w-[60%] truncate">{data.project.location}</span></p>}
              </div>
            ) : <p className="text-sm text-slate-400">No project data</p>}
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="mb-3 text-sm font-semibold text-slate-900">Booking Status</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Status:</span>
                <Badge>{data.booking.status}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Payment:</span>
                <span className="font-medium text-slate-800">{data.booking.paymentType === "full" ? "Full Payment" : "Installment"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Date:</span>
                <span className="font-medium text-slate-800">{formatDate(data.booking.bookingDate)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={deleteConfirm}
        title="Delete Booking"
        message="Are you sure you want to delete this booking? This action cannot be undone."
        confirmLabel="Delete Booking"
        variant="danger"
        loading={actionLoading}
        error={actionError}
        onConfirm={handleDelete}
        onCancel={() => { setDeleteConfirm(false); setActionError(""); }}
      />

      <ConfirmDialog
        open={cancelConfirm}
        title="Cancel Booking"
        message="Are you sure you want to cancel this booking? Payment records will be preserved but the unit will become available."
        confirmLabel="Cancel Booking"
        variant="danger"
        loading={actionLoading}
        error={actionError}
        onConfirm={handleCancel}
        onCancel={() => { setCancelConfirm(false); setActionError(""); }}
      />

      <Modal open={!!payModal} onClose={() => setPayModal(null)} title={`Record Payment — Installment #${payModal?.installmentNumber || ""}`} size="md">
        {payModal && (
          <form onSubmit={handleRecordPayment} className="space-y-4">
            <Input label="Amount Paid (PKR) *" type="number" required step="0.01" value={payForm.paidAmount} onChange={(e) => setPayForm({ ...payForm, paidAmount: e.target.value })} helperText={`Due: ${formatCurrency(payModal.amount)}`} />
            <Input label="Payment Date *" type="date" required value={payForm.paidDate} onChange={(e) => setPayForm({ ...payForm, paidDate: e.target.value })} />
            <Select label="Payment Method" value={payForm.paymentMethod} onChange={(e) => setPayForm({ ...payForm, paymentMethod: e.target.value })} options={[
              { value: "cash", label: "Cash" },
              { value: "bank_transfer", label: "Bank Transfer" },
              { value: "cheque", label: "Cheque" },
              { value: "online", label: "Online Payment" },
            ]} />
            <Input label="Receipt Number" value={payForm.receiptNumber} onChange={(e) => setPayForm({ ...payForm, receiptNumber: e.target.value })} placeholder="Optional receipt #" />
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-600">Notes</label>
              <textarea rows={2} value={payForm.notes} onChange={(e) => setPayForm({ ...payForm, notes: e.target.value })} placeholder="Optional notes"
                className="block w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-900 outline-none transition-all duration-200 placeholder:text-slate-400 focus:border-brand-400 focus:ring-2 focus:ring-brand-500/20" />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="secondary" type="button" onClick={() => setPayModal(null)}>Cancel</Button>
              <Button type="submit" disabled={saving} loading={saving}>Record Payment</Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
