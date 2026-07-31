"use client";

import { useEffect, useState, startTransition } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ArrowLeft, Calculator } from "lucide-react";
import Button from "@/components/Button";
import Input from "@/components/Input";
import Select from "@/components/Select";
import Spinner from "@/components/Spinner";

interface Project { id: number; name: string; projectCode: string | null; }
interface Unit { id: number; unitNumber: string; name: string | null; propertyType: string; price: string; status: string; }

const PROPERTY_TYPES: Record<string, string> = {
  apartment: "Apartment", office: "Office", shop: "Shop",
  villa: "Villa", plot: "Plot", warehouse: "Warehouse", commercial: "Commercial",
};

function formatCurrency(amount: string | number) {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(num)) return "Rs. 0";
  return new Intl.NumberFormat("en-PK", { style: "currency", currency: "PKR", maximumFractionDigits: 0 }).format(num);
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
    fetch("/api/projects").then((r) => r.json()).then((data) => {
      setProjects(data.map((d: { project: Project }) => d.project));
      if (preselectedProjectId) setSelectedProjectId(preselectedProjectId);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [preselectedProjectId]);

  useEffect(() => {
    if (!selectedProjectId) { startTransition(() => { setUnits([]); setSelectedUnitId(""); }); return; }
    startTransition(() => setUnitsLoading(true));
    fetch(`/api/projects/${selectedProjectId}/units`).then((r) => r.json()).then((data) => {
      const available = data.filter((u: Unit) => u.status === "available");
      setUnits(available);
      if (preselectedUnitId) {
        setSelectedUnitId(preselectedUnitId);
        const unit = available.find((u: Unit) => String(u.id) === preselectedUnitId);
        if (unit) setSalePrice(unit.price);
      }
      setUnitsLoading(false);
    }).catch(() => setUnitsLoading(false));
  }, [selectedProjectId, preselectedUnitId]);

  const handleProjectChange = (id: string) => { setSelectedProjectId(id); setSelectedUnitId(""); setSalePrice(""); };
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
    return (price - down) > 0 ? Math.ceil((price - down) / count) : 0;
  })();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const clientRes = await fetch("/api/clients", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: clientName, cnic: clientCnic, phone: clientPhone, email: clientEmail, address: clientAddress }),
      });
      const clientData = await clientRes.json();
      await fetch("/api/bookings", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: Number(selectedProjectId), unitId: Number(selectedUnitId), clientId: clientData.id,
          salePrice, downPayment: downPayment || "0", paymentType,
          installmentCount: paymentType === "installment" ? parseInt(installmentCount) : 0,
          installmentFrequency, installmentAmount: paymentType === "installment" ? String(installmentAmount) : null, bookingDate,
        }),
      });
      router.push("/bookings");
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  };

  if (loading) return <Spinner />;

  return (
    <div className="animate-fade-in space-y-6">
      <button onClick={() => router.back()} className="inline-flex items-center gap-2 text-sm text-slate-500 transition-colors hover:text-brand-600">
        <ArrowLeft size={16} /> Back to Bookings
      </button>

      <h1 className="text-2xl font-bold tracking-tight text-slate-900">Create New Booking</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Step 1 */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-slate-900">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-brand-50 text-xs font-bold text-brand-600">1</span>
            Select Project & Unit
          </h2>
          <div className="grid gap-5 sm:grid-cols-2">
            <Select label="Project *" required value={selectedProjectId} onChange={(e) => handleProjectChange(e.target.value)}
              options={projects.map((p) => ({ value: String(p.id), label: p.name }))} placeholder="Select a project..." />
            <Select label="Available Unit *" required value={selectedUnitId} onChange={(e) => handleUnitChange(e.target.value)}
              disabled={!selectedProjectId || unitsLoading}
              options={units.map((u) => ({ value: String(u.id), label: `${u.unitNumber} ${u.name ? `- ${u.name}` : ""} (${PROPERTY_TYPES[u.propertyType] || u.propertyType} - ${formatCurrency(u.price)})` }))}
              placeholder={unitsLoading ? "Loading units..." : !selectedProjectId ? "Select a project first" : "Select a unit..."} />
            <Input label="Sale Price (PKR) *" type="number" required step="0.01" value={salePrice} onChange={(e) => setSalePrice(e.target.value)} />
          </div>
        </div>

        {/* Step 2 */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-slate-900">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-brand-50 text-xs font-bold text-brand-600">2</span>
            Client Details
          </h2>
          <div className="grid gap-5 sm:grid-cols-2">
            <Input label="Full Name *" required value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Muhammad Ahmed Khan" />
            <Input label="CNIC *" required value={clientCnic} onChange={(e) => setClientCnic(e.target.value)} placeholder="35201-1234567-1" />
            <Input label="Phone *" type="tel" required value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} placeholder="0300-1234567" />
            <Input label="Email" type="email" value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} placeholder="ahmed@example.com" />
            <Input label="Address" value={clientAddress} onChange={(e) => setClientAddress(e.target.value)} placeholder="House #123, Street #5, Lahore" className="sm:col-span-2" />
          </div>
        </div>

        {/* Step 3 */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-slate-900">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-brand-50 text-xs font-bold text-brand-600">3</span>
            Payment Plan
          </h2>
          <div className="grid gap-5 sm:grid-cols-2">
            <Input label="Booking Date *" type="date" required value={bookingDate} onChange={(e) => setBookingDate(e.target.value)} />
            <Select label="Payment Type *" value={paymentType} onChange={(e) => setPaymentType(e.target.value)}
              options={[{ value: "full", label: "Full Payment" }, { value: "installment", label: "Installment Plan" }]} />
            <Input label="Down Payment (PKR)" type="number" step="0.01" value={downPayment} onChange={(e) => setDownPayment(e.target.value)} placeholder="0" />
            {paymentType === "installment" && (
              <>
                <Input label="Number of Installments *" type="number" required value={installmentCount} onChange={(e) => setInstallmentCount(e.target.value)} placeholder="e.g., 12" />
                <Select label="Frequency" value={installmentFrequency} onChange={(e) => setInstallmentFrequency(e.target.value)}
                  options={[{ value: "monthly", label: "Monthly" }, { value: "quarterly", label: "Quarterly" }]} />
              </>
            )}
          </div>

          {paymentType === "installment" && installmentAmount > 0 && (
            <div className="mt-5 rounded-xl bg-gradient-to-br from-brand-50 to-brand-100/50 p-5">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-brand-800">
                <Calculator size={14} /> Payment Summary
              </h3>
              <div className="grid gap-3 sm:grid-cols-2 text-xs">
                {[
                  { label: "Total Price", value: formatCurrency(salePrice) },
                  { label: "Down Payment", value: formatCurrency(downPayment || "0") },
                  { label: "Remaining", value: formatCurrency(String(parseFloat(salePrice || "0") - parseFloat(downPayment || "0"))) },
                  { label: "Each Installment", value: `${formatCurrency(String(installmentAmount))} × ${installmentCount} ${installmentFrequency}` },
                ].map((item, i) => (
                  <div key={i} className="rounded-lg bg-white/60 p-3">
                    <p className="text-brand-600">{item.label}</p>
                    <p className="text-sm font-bold text-brand-800">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="secondary" type="button" onClick={() => router.back()}>Cancel</Button>
          <Button type="submit" disabled={saving || !selectedUnitId} loading={saving}>
            {saving ? "Creating..." : "Create Booking"}
          </Button>
        </div>
      </form>
    </div>
  );
}
