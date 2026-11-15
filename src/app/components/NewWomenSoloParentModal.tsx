import { defaultIntakeBarangay } from "../utils/intakeProfile";
import { CALABANGA_BARANGAYS } from "../data/calabangaBarangays";
import React, { useState, useRef, useEffect } from "react";
import { X, UserPlus, CheckCircle2, ShieldCheck, HeartHandshake, Baby, AlertCircle } from "lucide-react";
import { Button } from "./ui/button";
import { toast } from "sonner";
import { IntakeDocumentUploads, SOLO_PARENT_REQUIREMENTS, WOMEN_REQUIREMENTS } from "./IntakeDocumentUploads";
import { getIntakeFileError } from "../utils/intakeFileValidation";
import type { IntakeDocument, DbCaseRecord } from "../services/caseService";
import { apiCreateWomenSoloParentCase, saveSecretarySubmittedCase } from "../services/caseService";

interface NewWomenSoloParentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (record: DbCaseRecord) => void;
}


const SOLO_PARENT_REASONS = [
  "Spouse Deceased",
  "Legal Separation / Annulment",
  "Abandonment",
  "Unmarried Parent",
  "Spouse Incarcerated / Incapacitated"
];

export function NewWomenSoloParentModal({ isOpen, onClose, onSuccess }: NewWomenSoloParentModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [documents, setDocuments] = useState<IntakeDocument[]>([]);
  const [trackingNumber, setTrackingNumber] = useState(() => `BEN-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`);

  // Form State
  const formRef = useRef<HTMLFormElement>(null);
  const [firstName, setFirstName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [lastName, setLastName] = useState("");
  const [extensionName, setExtensionName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [gender, setGender] = useState("FEMALE");
  const [civilStatus, setCivilStatus] = useState("SINGLE_PARENT");
  const [barangay, setBarangay] = useState(defaultIntakeBarangay);
  const [contactNumber, setContactNumber] = useState("");
  const [indigencyLevel, setIndigencyLevel] = useState("Low Income (₱5,000 - ₱10,000/mo)");
  const [category, setCategory] = useState<"SOLO_PARENT" | "WOMEN_VAWC">("SOLO_PARENT");
  const [dependentChildren, setDependentChildren] = useState(2);
  const [soloParentReason, setSoloParentReason] = useState("Unmarried Parent");
  const [initialStatus, setInitialStatus] = useState<"BARANGAY_ENDORSED" | "UNDER_REVIEW">("BARANGAY_ENDORSED");
  const [notes, setNotes] = useState("");

  const requirements = category === "SOLO_PARENT" ? SOLO_PARENT_REQUIREMENTS : WOMEN_REQUIREMENTS;

  useEffect(() => {
    if (isOpen) return;
    setTrackingNumber(`BEN-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`);
    setFirstName(""); setMiddleName(""); setLastName(""); setExtensionName("");
    setBirthDate(""); setContactNumber(""); setDocuments([]);
    setGender("FEMALE"); setBarangay(defaultIntakeBarangay()); setInitialStatus("BARANGAY_ENDORSED");
    setCivilStatus("SINGLE_PARENT"); setCategory("SOLO_PARENT");
    setDependentChildren(2); setSoloParentReason("Unmarried Parent");
    setIndigencyLevel("Low Income (₱5,000 - ₱10,000/mo)");
    setNotes("");
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (!formRef.current?.reportValidity()) return;
    if (!firstName.trim() || !lastName.trim()) {
      toast.error("First name and last name are required.");
      return;
    }

    const selectedDocuments = documents.filter((doc) => requirements.some((requirement) => requirement.id === doc.id));
    for (const { file } of selectedDocuments) {
      const error = getIntakeFileError(file);
      if (error) {
        toast.error(error);
        return;
      }
    }

    try {
      setIsSubmitting(true);
      const createdRecord = await apiCreateWomenSoloParentCase({
        case_number: trackingNumber,
        firstName: firstName.trim(),
        middleName: middleName.trim(),
        lastName: lastName.trim(),
        extensionName: extensionName.trim(),
        birthDate,
        gender,
        civilStatus,
        barangay,
        contactNumber: contactNumber.trim(),
        indigencyLevel,
        category,
        dependentChildren: category === "SOLO_PARENT" ? Number(dependentChildren) : 0,
        soloParentReason: category === "SOLO_PARENT" ? soloParentReason : undefined,
        status: initialStatus,
        financialAidAmount: 3000,
        notes: notes.trim() || undefined,
      }, selectedDocuments);

      const assignedTracking = (createdRecord as any)?.tracking_id || createdRecord?.case_number || trackingNumber;
      saveSecretarySubmittedCase(assignedTracking);
      toast.success(`Beneficiary profile registered successfully with Tracking ID: ${assignedTracking}`);
      setDocuments([]);
      onSuccess(createdRecord);
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
        <form ref={formRef} onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 pb-20 sm:pb-6">
          
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
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1" htmlFor="NewWomenSoloParentModal.tsx-firstName">
                  First Name *
                </label>
                <input
                  id="NewWomenSoloParentModal.tsx-firstName"
                  type="text"
                  required
                  maxLength={120}
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1" htmlFor="NewWomenSoloParentModal.tsx-middleName">
                  Middle Name
                </label>
                <input
                  id="NewWomenSoloParentModal.tsx-middleName"
                  type="text"
                  aria-required={false}
                  maxLength={120}
                  value={middleName}
                  onChange={(e) => setMiddleName(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1" htmlFor="NewWomenSoloParentModal.tsx-lastName">
                  Last Name *
                </label>
                <input
                  id="NewWomenSoloParentModal.tsx-lastName"
                  type="text"
                  required
                  maxLength={120}
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1" htmlFor="NewWomenSoloParentModal.tsx-extensionName">
                  Extension Name
                </label>
                <input
                  id="NewWomenSoloParentModal.tsx-extensionName"
                  type="text"
                  aria-required={false}
                  maxLength={30}
                  value={extensionName}
                  onChange={(e) => setExtensionName(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">
                  Date of Birth *
                </label>
                <input
                  type="date"
                  max={new Date().toLocaleDateString("en-CA")}
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
                  required
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white"
                >
                  <option value="FEMALE">Female</option>
                  <option value="MALE">Male</option>
                  <option value="OTHER">Other / Non-Binary</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">
                  Civil Status *
                </label>
                <select
                  required
                  value={civilStatus}
                  onChange={(e) => setCivilStatus(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white"
                >
                  <option value="SINGLE_PARENT">Single Parent</option>
                  <option value="WIDOWED">Widowed</option>
                  <option value="SEPARATED">Separated / Abandoned</option>
                  <option value="ANNULLED">Annulled</option>
                  <option value="MARRIED">Married</option>
                  <option value="COMMON_LAW">Common Law / Live-in</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">
                  Barangay *
                </label>
                <select
                  required
                  value={barangay}
                  onChange={(e) => setBarangay(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white"
                >
                  {barangay && !CALABANGA_BARANGAYS.includes(barangay) && <option value={barangay}>Brgy. {barangay} (existing assignment)</option>}
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
                  required
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
                    required
                    min="1"
                    max="15"
                    value={dependentChildren}
                    onChange={(e) => setDependentChildren(Number(e.target.value))}
                    className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none bg-white"
                  />
                  <p className="text-[11px] text-gray-500 mt-1">Dependents aged below 22 years old unmarried.</p>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">
                    Primary Reason for Solo Parenthood *
                  </label>
                  <select
                    required
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
                  required
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
          <IntakeDocumentUploads
            requirements={requirements}
            documents={documents}
            onChange={setDocuments}
            disabled={isSubmitting}
          />
        </form>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between overflow-x-auto sm:overflow-visible">
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
