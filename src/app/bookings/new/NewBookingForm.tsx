"use client";

import { useEffect, useState, startTransition } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ArrowLeft, Save, Calculator, Layers } from "lucide-react";

interface Project {
  id: number;
  name: string;
  projectCode: string | null;
}

interface Unit {
  id: number;
  unitNumber: string;
  name: string | null;
  propertyType: string;
  price: string;
  status: string;
}

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

export default function NewBookingForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const preselectedProjectId = searchParams.get("projectId");
  const preselectedUnitId = searchParams.get("unitId");

  const [projects, setProjects] = useState<Project[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [unitsLoading, setUnitsLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [clientName, setClientName] = useState("");
  const [clientCnic, setClientCnic] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientAddress, setClientAddress] = useState("");

  const [selectedProjectId, setSelectedProjectId] = useState(preselectedProjectId || "");
  const [selectedUnitId, setSelectedUnitId] = useState(preselectedUnitId || "");
  const [salePrice, setSalePrice] = useState("");
  const [downPayment, setDownPayment] = useState("");
  const [paymentType, setPaymentType] = useState("installment");
  const [installmentCount, setInstallmentCount] = useState("");
  const [installmentFrequency, setInstallmentFrequency] = useState("monthly");
  const [bookingDate, setBookingDate] = useState(new Date().toISOString().split("T")[0]);

  useEffect(() => {
    fetch("/api/projects")
      .then((r) => r.json())
      .then((data) => {
        setProjects(data.map((d: { project: Project }) => d.project));
        if (preselectedProjectId) {
          setSelectedProjectId(preselectedProjectId);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [preselectedProjectId]);

  useEffect(() => {
    if (!selectedProjectId) {
      startTransition(() => { setUnits([]); setSelectedUnitId(""); });
      return;
    }
    startTransition(() => setUnitsLoading(true));
    fetch(`/api/projects/${selectedProjectId}/units`)
      .then((r) => r.json())
      .then((data) => {
        const available = data.filter((u: Unit) => u.status === "available");
        setUnits(available);
        if (preselectedUnitId) {
          setSelectedUnitId(preselectedUnitId);
          const unit = available.find((u: Unit) => String(u.id) === preselectedUnitId);
          if (unit) setSalePrice(unit.price);
        }
        setUnitsLoading(false);
      })
      .catch(() => setUnitsLoading(false));
  }, [selectedProjectId, preselectedUnitId]);

  const handleProjectChange = (id: string) => {
    setSelectedProjectId(id);
    setSelectedUnitId("");
    setSalePrice("");
  };

  const handleUnitChange = (id: string) => {
    setSelectedUnitId(id);
    const unit = units.find((u) => String(u.id) === id);
    if (unit) setSalePrice(unit.price);
  };

  const installmentAmount = (() => {
    const price = parseFloat(salePrice) || 0;
    const down = parseFloat(downPayment) || 0;
    const count = parseInt(installmentCount) || 0;
    if (paymentType !== "installment" || count <= 0) return 0;
    const remaining = price - down;
    return remaining > 0 ? Math.ceil(remaining / count) : 0;
  })();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const clientRes = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: clientName, cnic: clientCnic, phone: clientPhone, email: clientEmail, address: clientAddress }),
      });
      const clientData = await clientRes.json();

      await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: Number(selectedProjectId),
          unitId: Number(selectedUnitId),
          clientId: clientData.id,
          salePrice,
          downPayment: downPayment || "0",
          paymentType,
          installmentCount: paymentType === "installment" ? parseInt(installmentCount) : 0,
          installmentFrequency,
          installmentAmount: paymentType === "installment" ? String(installmentAmount) : null,
          bookingDate,
        }),
      });

      router.push("/bookings");
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-brand-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <button onClick={() => router.back()} className="mb-6 inline-flex items-center gap-2 text-sm text-slate-500 transition-colors hover:text-brand-600">
        <ArrowLeft size={16} /> Back to Bookings
      </button>

      <h1 className="mb-6 text-2xl font-bold tracking-tight text-slate-900">Create New Booking</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Step 1 & 2: Project → Unit */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-slate-900">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-brand-50 text-xs font-bold text-brand-600">1</span>
            Select Project & Unit
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-600">Project *</label>
              <select required value={selectedProjectId} onChange={(e) => handleProjectChange(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none transition-all duration-200 focus:border-brand-400 focus:ring-2 focus:ring-brand-500/20">
                <option value="">Select a project...</option>
                {projects.map((p) => (<option key={p.id} value={p.id}>{p.name}</option>))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-600">Available Unit *</label>
              <select required value={selectedUnitId} onChange={(e) => handleUnitChange(e.target.value)} disabled={!selectedProjectId || unitsLoading}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none transition-all duration-200 focus:border-brand-400 focus:ring-2 focus:ring-brand-500/20 disabled:opacity-50">
                <option value="">{unitsLoading ? "Loading units..." : !selectedProjectId ? "Select a project first" : "Select a unit..."}</option>
                {units.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.unitNumber} {u.name ? `- ${u.name}` : ""} ({PROPERTY_TYPES[u.propertyType] || u.propertyType} - {formatCurrency(u.price)})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-600">Sale Price (PKR) *</label>
              <input type="number" required step="0.01" value={salePrice} onChange={(e) => setSalePrice(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none transition-all duration-200 placeholder:text-slate-400 focus:border-brand-400 focus:ring-2 focus:ring-brand-500/20" />
            </div>
          </div>
        </div>

        {/* Step 2: Client Details */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-slate-900">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-brand-50 text-xs font-bold text-brand-600">2</span>
            Client Details
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-600">Full Name *</label>
              <input type="text" required value={clientName} onChange={(e) => setClientName(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none transition-all duration-200 placeholder:text-slate-400 focus:border-brand-400 focus:ring-2 focus:ring-brand-500/20" placeholder="Muhammad Ahmed Khan" />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-600">CNIC *</label>
              <input type="text" required value={clientCnic} onChange={(e) => setClientCnic(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none transition-all duration-200 placeholder:text-slate-400 focus:border-brand-400 focus:ring-2 focus:ring-brand-500/20" placeholder="35201-1234567-1" />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-600">Phone *</label>
              <input type="tel" required value={clientPhone} onChange={(e) => setClientPhone(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none transition-all duration-200 placeholder:text-slate-400 focus:border-brand-400 focus:ring-2 focus:ring-brand-500/20" placeholder="0300-1234567" />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-600">Email</label>
              <input type="email" value={clientEmail} onChange={(e) => setClientEmail(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none transition-all duration-200 placeholder:text-slate-400 focus:border-brand-400 focus:ring-2 focus:ring-brand-500/20" placeholder="ahmed@example.com" />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-xs font-semibold text-slate-600">Address</label>
              <input type="text" value={clientAddress} onChange={(e) => setClientAddress(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none transition-all duration-200 placeholder:text-slate-400 focus:border-brand-400 focus:ring-2 focus:ring-brand-500/20" placeholder="House #123, Street #5, Lahore" />
            </div>
          </div>
        </div>

        {/* Step 3: Payment Plan */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-slate-900">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-brand-50 text-xs font-bold text-brand-600">3</span>
            Payment Plan
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-600">Booking Date *</label>
              <input type="date" required value={bookingDate} onChange={(e) => setBookingDate(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none transition-all duration-200 focus:border-brand-400 focus:ring-2 focus:ring-brand-500/20" />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-600">Payment Type *</label>
              <select value={paymentType} onChange={(e) => setPaymentType(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none transition-all duration-200 focus:border-brand-400 focus:ring-2 focus:ring-brand-500/20">
                <option value="full">Full Payment</option>
                <option value="installment">Installment Plan</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-600">Down Payment (PKR)</label>
              <input type="number" step="0.01" value={downPayment} onChange={(e) => setDownPayment(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none transition-all duration-200 placeholder:text-slate-400 focus:border-brand-400 focus:ring-2 focus:ring-brand-500/20" placeholder="0" />
            </div>
            {paymentType === "installment" && (
              <>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-600">Number of Installments *</label>
                  <input type="number" required value={installmentCount} onChange={(e) => setInstallmentCount(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none transition-all duration-200 placeholder:text-slate-400 focus:border-brand-400 focus:ring-2 focus:ring-brand-500/20" placeholder="e.g., 12" />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-600">Frequency</label>
                  <select value={installmentFrequency} onChange={(e) => setInstallmentFrequency(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none transition-all duration-200 focus:border-brand-400 focus:ring-2 focus:ring-brand-500/20">
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                  </select>
                </div>
              </>
            )}
          </div>

          {paymentType === "installment" && installmentAmount > 0 && (
            <div className="mt-5 rounded-xl bg-gradient-to-br from-brand-50 to-brand-100/50 p-5">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-brand-800">
                <Calculator size={14} /> Payment Summary
              </h3>
              <div className="grid gap-2 sm:grid-cols-2 text-xs">
                <div className="rounded-lg bg-white/60 p-3">
                  <p className="text-brand-600">Total Price</p>
                  <p className="text-sm font-bold text-brand-800">{formatCurrency(salePrice)}</p>
                </div>
                <div className="rounded-lg bg-white/60 p-3">
                  <p className="text-brand-600">Down Payment</p>
                  <p className="text-sm font-bold text-brand-800">{formatCurrency(downPayment || "0")}</p>
                </div>
                <div className="rounded-lg bg-white/60 p-3">
                  <p className="text-brand-600">Remaining</p>
                  <p className="text-sm font-bold text-brand-800">{formatCurrency(String(parseFloat(salePrice || "0") - parseFloat(downPayment || "0")))}</p>
                </div>
                <div className="rounded-lg bg-white/60 p-3">
                  <p className="text-brand-600">Each Installment</p>
                  <p className="text-sm font-bold text-brand-800">{formatCurrency(String(installmentAmount))}
                    <span className="font-normal text-brand-500"> × {installmentCount} {installmentFrequency}</span>
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3">
          <button type="button" onClick={() => router.back()}
            className="rounded-xl border border-slate-200 px-6 py-2.5 text-sm font-medium text-slate-600 transition-all duration-200 hover:bg-slate-50 active:scale-[0.97]">Cancel</button>
          <button type="submit" disabled={saving || !selectedUnitId}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-brand-600 to-brand-700 px-6 py-2.5 text-sm font-medium text-white shadow-lg shadow-brand-600/30 transition-all duration-200 hover:from-brand-700 hover:to-brand-800 active:scale-[0.97] disabled:opacity-50">
            <Save size={16} /> {saving ? "Creating..." : "Create Booking"}
          </button>
        </div>
      </form>
    </div>
  );
}
