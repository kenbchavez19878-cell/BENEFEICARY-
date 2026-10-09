import React, { useState } from "react";
import { X, UserPlus, CheckCircle2, ShieldCheck, HeartHandshake, Baby, AlertCircle } from "lucide-react";
import { Button } from "./ui/button";
import { toast } from "sonner";
import { apiCreateWomenSoloParentCase } from "../services/caseService";

interface NewWomenSoloParentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CALABANGA_BARANGAYS = [
  "San Juan",
  "San Francisco",
  "Sabang",
  "Balongay",
  "Belen",
  "Bigaas",
  "Bonbon",
  "Burabod",
  "Cabanbanan",
  "Cagsao",
  "Camuning",
  "Comaguingking",
  "Dominorog",
  "Paolbo",
  "Pinada",
  "Punta Tarawal",
  "Quipayo",
  "Salvacion",
  "San Antonio",
  "San Bernardino",
  "San Lucas",
  "San Pablo",
  "San Pedro",
  "San Roque",
  "San Vicente",
  "Santa Cruz",
  "Santa Isabel",
  "Santa Salud",
  "Santo Domingo",
  "Santo Niño",
  "Sibobo",
  "Tomagodtod"
];

const SOLO_PARENT_REASONS = [
  "Spouse Deceased",
  "Legal Separation / Annulment",
  "Abandonment",
  "Unmarried Parent",
  "Spouse Incarcerated / Incapacitated"
];

export function NewWomenSoloParentModal({ isOpen, onClose, onSuccess }: NewWomenSoloParentModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [trackingNumber] = useState(() => `BEN-2026-${Math.floor(100000 + Math.random() * 900000)}`);

  // Form State
  const [fullName, setFullName] = useState("");
  const [birthDate, setBirthDate] = useState("1992-05-15");
  const [gender, setGender] = useState("Female");
  const [civilStatus, setCivilStatus] = useState("Single Parent");
  const [barangay, setBarangay] = useState("San Juan");
  const [contactNumber, setContactNumber] = useState("");
  const [indigencyLevel, setIndigencyLevel] = useState("Low Income (₱5,000 - ₱10,000/mo)");
  const [category, setCategory] = useState<"SOLO_PARENT" | "WOMEN_VAWC">("SOLO_PARENT");
  const [dependentChildren, setDependentChildren] = useState(2);
  const [soloParentReason, setSoloParentReason] = useState("Unmarried Parent");
  const [initialStatus, setInitialStatus] = useState<"BARANGAY_ENDORSED" | "UNDER_REVIEW">("BARANGAY_ENDORSED");
  const [notes, setNotes] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      toast.error("Please enter the beneficiary's full name");
      return;
    }

    try {
      setIsSubmitting(true);
      await apiCreateWomenSoloParentCase({
        case_number: trackingNumber,
        fullName: fullName.trim(),
        birthDate,
        gender,
        civilStatus,
        barangay,
        contactNumber: contactNumber.trim() || "0917-000-0000",
        indigencyLevel,
        category,
        dependentChildren: category === "SOLO_PARENT" ? Number(dependentChildren) : 0,
        soloParentReason: category === "SOLO_PARENT" ? soloParentReason : undefined,
        status: initialStatus,
        financialAidAmount: 3000,
        notes: notes.trim() || undefined,
      });

      toast.success(`Beneficiary profile registered successfully with Tracking ID: ${trackingNumber}`);
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Error creating beneficiary:", err);
      toast.error(err.message || "Failed to register beneficiary record.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 text-white px-6 py-5 flex items-start justify-between relative">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-500/30 text-blue-100 border border-blue-400/30 uppercase tracking-wider">
                Intake & Profiling
              </span>
              <span className="text-xs text-blue-200 font-mono font-medium">
                {trackingNumber}
              </span>
            </div>
            <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              <UserPlus className="size-5 text-blue-300" />
              New Beneficiary Registration
            </h2>
            <p className="text-xs text-blue-200 mt-0.5">
              Women & Solo Parent Welfare Program — Municipality of Calabanga
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-blue-200 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Category Toggle */}
          <div>
            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block mb-2">
              Assistance Category *
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setCategory("SOLO_PARENT")}
                className={`flex items-center gap-3 p-3.5 rounded-xl border-2 text-left transition-all ${
                  category === "SOLO_PARENT"
                    ? "border-emerald-600 bg-emerald-50/70 text-emerald-950 shadow-sm"
                    : "border-gray-200 bg-gray-50/50 hover:bg-gray-100 text-gray-600"
                }`}
              >
                <div className={`size-9 rounded-lg flex items-center justify-center ${category === "SOLO_PARENT" ? "bg-emerald-600 text-white" : "bg-gray-200 text-gray-500"}`}>
                  <Baby className="size-5" />
                </div>
                <div>
                  <div className="text-sm font-semibold">Solo Parent</div>
                  <div className="text-xs text-gray-500">RA 11861 Expanded Solo Parents Act</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setCategory("WOMEN_VAWC")}
                className={`flex items-center gap-3 p-3.5 rounded-xl border-2 text-left transition-all ${
                  category === "WOMEN_VAWC"
                    ? "border-purple-600 bg-purple-50/70 text-purple-950 shadow-sm"
                    : "border-gray-200 bg-gray-50/50 hover:bg-gray-100 text-gray-600"
                }`}
              >
                <div className={`size-9 rounded-lg flex items-center justify-center ${category === "WOMEN_VAWC" ? "bg-purple-600 text-white" : "bg-gray-200 text-gray-500"}`}>
                  <ShieldCheck className="size-5" />
                </div>
                <div>
                  <div className="text-sm font-semibold">Women / VAWC</div>
                  <div className="text-xs text-gray-500">RA 9262 Crisis Protection & Legal Aid</div>
                </div>
              </button>
            </div>
          </div>

          {/* Personal Info Grid */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-blue-900 uppercase tracking-widest border-b border-gray-200 pb-2">
              1. Beneficiary Profile Information
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-gray-700 block mb-1">
                  Full Legal Name (Last, First Middle) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Santos, Maria Dela Cruz"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">
                  Date of Birth *
                </label>
                <input
                  type="date"
                  required
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">
                  Gender *
                </label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white"
                >
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                  <option value="Other">Other / Non-Binary</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">
                  Civil Status *
                </label>
                <select
                  value={civilStatus}
                  onChange={(e) => setCivilStatus(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white"
                >
                  <option value="Single Parent">Single Parent</option>
                  <option value="Widowed">Widowed</option>
                  <option value="Separated">Separated / Abandoned</option>
                  <option value="Annulled">Annulled</option>
                  <option value="Married">Married</option>
                  <option value="Common Law">Common Law / Live-in</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">
                  Barangay *
                </label>
                <select
                  value={barangay}
                  onChange={(e) => setBarangay(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white"
                >
                  {CALABANGA_BARANGAYS.map((b) => (
                    <option key={b} value={b}>
                      Brgy. {b}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">
                  Contact Number
                </label>
                <input
                  type="text"
                  placeholder="0917-123-4567"
                  value={contactNumber}
                  onChange={(e) => setContactNumber(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">
                  Low Income / Indigency Level *
                </label>
                <select
                  value={indigencyLevel}
                  onChange={(e) => setIndigencyLevel(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white"
                >
                  <option value="Extremely Indigent (< ₱5,000/mo)">Extremely Indigent (&lt; ₱5,000/mo)</option>
                  <option value="Low Income (₱5,000 - ₱10,000/mo)">Low Income (₱5,000 - ₱10,000/mo)</option>
                  <option value="Below Poverty Threshold (₱10,001 - ₱15,000/mo)">Below Poverty Threshold (₱10,001 - ₱15,000/mo)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Solo Parent Specifics */}
          {category === "SOLO_PARENT" && (
            <div className="bg-emerald-50/50 border border-emerald-200/80 rounded-xl p-4 space-y-4">
              <h3 className="text-xs font-bold text-emerald-900 uppercase tracking-widest flex items-center gap-1.5">
                <HeartHandshake className="size-4 text-emerald-700" />
                Solo Parent Specifics (RA 11861)
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">
                    Number of Dependent Children *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="15"
                    value={dependentChildren}
                    onChange={(e) => setDependentChildren(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none bg-white"
                  />
                  <p className="text-[11px] text-gray-500 mt-1">Dependents aged below 22 years old unmarried.</p>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">
                    Primary Reason for Solo Parenthood *
                  </label>
                  <select
                    value={soloParentReason}
                    onChange={(e) => setSoloParentReason(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none bg-white"
                  >
                    {SOLO_PARENT_REASONS.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Initial Status & Notes */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-blue-900 uppercase tracking-widest border-b border-gray-200 pb-2">
              2. Initial Intake Status & Endorsement
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">
                  Initial Workflow Status *
                </label>
                <select
                  value={initialStatus}
                  onChange={(e) => setInitialStatus(e.target.value as any)}
                  className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white font-medium"
                >
                  <option value="BARANGAY_ENDORSED">BARANGAY ENDORSED (Step 1 Awaiting Intake)</option>
                  <option value="UNDER_REVIEW">UNDER REVIEW (Step 2 Verification In Progress)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">
                  Intake Officer / Endorser
                </label>
                <input
                  type="text"
                  disabled
                  readOnly
                  value="Barangay Secretary / Social Welfare Intake"
                  className="w-full px-3.5 py-2 text-sm border border-gray-200 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-gray-700 block mb-1">
                  Intake Assessment Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="Optional brief notes on client situation, urgent needs, or initial assessment..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none bg-white"
                />
              </div>
            </div>
          </div>
        </form>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
          <div className="text-xs text-gray-500 flex items-center gap-1.5">
            <AlertCircle className="size-3.5 text-blue-600" />
            <span>Record will be instantly stored to PostgreSQL and reflected on the Dashboard.</span>
          </div>

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              onClick={onClose}
              className="text-gray-700 border-gray-300 hover:bg-gray-100"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="bg-blue-900 hover:bg-blue-800 text-white gap-2 shadow-md transition-all px-5"
            >
              {isSubmitting ? (
                <>Saving Record...</>
              ) : (
                <>
                  <CheckCircle2 className="size-4" />
                  Save & Register Beneficiary
                </>
              )}
            </Button>
          </div>
        </div>

      </div>
    </div>
  );
}
