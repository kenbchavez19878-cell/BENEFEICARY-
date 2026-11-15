import { defaultIntakeBarangay } from "../utils/intakeProfile";
import { CALABANGA_BARANGAYS } from "../data/calabangaBarangays";
import React, { useState, useRef, useEffect } from "react";
import { X, HeartHandshake, CheckCircle2, Stethoscope, Cross, Bus, DollarSign, MapPin, AlertCircle } from "lucide-react";
import { Button } from "./ui/button";
import { toast } from "sonner";
import { IntakeDocumentUploads, aicsRequirements } from "./IntakeDocumentUploads";
import { getIntakeFileError } from "../utils/intakeFileValidation";
import type { IntakeDocument, DbCaseRecord } from "../services/caseService";
import { apiCreateAicsCase, saveSecretarySubmittedCase } from "../services/caseService";

interface NewAicsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (record: DbCaseRecord) => void;
}


const CRISIS_TYPES: Array<{
  id: "MEDICAL" | "BURIAL" | "TRANSPORTATION" | "ECONOMIC_RELIEF" | "BALIK_PROBINSYA";
  label: string;
  icon: any;
  color: string;
  defaultAmount: number;
}> = [
  { id: "MEDICAL", label: "Medical Assistance", icon: Stethoscope, color: "text-blue-600 bg-blue-50 border-blue-200", defaultAmount: 5000 },
  { id: "BURIAL", label: "Burial Assistance", icon: Cross, color: "text-amber-600 bg-amber-50 border-amber-200", defaultAmount: 5000 },
  { id: "TRANSPORTATION", label: "Transportation Aid", icon: Bus, color: "text-emerald-600 bg-emerald-50 border-emerald-200", defaultAmount: 2500 },
  { id: "ECONOMIC_RELIEF", label: "Economic Relief", icon: DollarSign, color: "text-indigo-600 bg-indigo-50 border-indigo-200", defaultAmount: 3000 },
  { id: "BALIK_PROBINSYA", label: "Balik Probinsya", icon: MapPin, color: "text-violet-600 bg-violet-50 border-violet-200", defaultAmount: 6000 },
];

export function NewAicsModal({ isOpen, onClose, onSuccess }: NewAicsModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [documents, setDocuments] = useState<IntakeDocument[]>([]);
  const [trackingNumber, setTrackingNumber] = useState(() => `AICS-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`);

  // Form State
  const formRef = useRef<HTMLFormElement>(null);
  const [firstName, setFirstName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [lastName, setLastName] = useState("");
  const [extensionName, setExtensionName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [gender, setGender] = useState("FEMALE");
  const [civilStatus, setCivilStatus] = useState("SINGLE");
  const [barangay, setBarangay] = useState(defaultIntakeBarangay);
  const [contactNumber, setContactNumber] = useState("");
  const [incomeStatus, setIncomeStatus] = useState("Indigent / No Regular Income");
  const [crisisType, setCrisisType] = useState<"MEDICAL" | "BURIAL" | "TRANSPORTATION" | "ECONOMIC_RELIEF" | "BALIK_PROBINSYA">("MEDICAL");
  const [crisisSummary, setCrisisSummary] = useState("");
  const [serviceProvider, setServiceProvider] = useState("");
  const [requestedAmount, setRequestedAmount] = useState(5000);
  const [initialStatus, setInitialStatus] = useState<"BARANGAY_ENDORSED" | "UNDER_REVIEW">("BARANGAY_ENDORSED");

  const requirements = aicsRequirements(crisisType);

  useEffect(() => {
    if (isOpen) return;
    setTrackingNumber(`AICS-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`);
    setFirstName(""); setMiddleName(""); setLastName(""); setExtensionName("");
    setBirthDate(""); setContactNumber(""); setDocuments([]);
    setGender("FEMALE"); setBarangay(defaultIntakeBarangay()); setInitialStatus("BARANGAY_ENDORSED");
    setCivilStatus("SINGLE"); setIncomeStatus("Indigent / No Regular Income");
    setCrisisType("MEDICAL"); setRequestedAmount(5000);
    setCrisisSummary(""); setServiceProvider("");
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCrisisTypeSelect = (typeId: any, defaultAmt: number) => {
    setCrisisType(typeId);
    setRequestedAmount(defaultAmt);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (!formRef.current?.reportValidity()) return;
    if (!firstName.trim() || !lastName.trim()) {
      toast.error("First name and last name are required.");
      return;
    }

    if (!crisisSummary.trim()) {
      toast.error("Enter a crisis summary before submitting.");
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
      const createdRecord = await apiCreateAicsCase({
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
        incomeStatus,
        crisisType,
        crisisSummary: crisisSummary.trim(),
        serviceProvider: serviceProvider.trim() || undefined,
        requestedAmount: Number(requestedAmount),
        status: initialStatus,
      }, selectedDocuments);

      const assignedTracking = (createdRecord as any)?.tracking_id || createdRecord?.case_number || trackingNumber;
      saveSecretarySubmittedCase(assignedTracking);
      toast.success(`AICS crisis intake registered successfully with Tracking ID: ${assignedTracking}`);
      setDocuments([]);
      onSuccess(createdRecord);
      onClose();
    } catch (err: any) {
      console.error("Error creating AICS case:", err);
      toast.error(err.message || "Failed to register AICS intake record.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-blue-950 text-white px-6 py-5 flex items-start justify-between relative">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-500/30 text-blue-100 border border-blue-400/30 uppercase tracking-wider">
                AICS Emergency Intake
              </span>
              <span className="text-xs text-blue-200 font-mono font-medium">
                {trackingNumber}
              </span>
            </div>
            <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              <HeartHandshake className="size-5 text-blue-300" />
              New Beneficiary Registration (AICS)
            </h2>
            <p className="text-xs text-blue-200 mt-0.5">
              Assistance to Individuals in Crisis Situations — MSWD Calabanga
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
          
          {/* Crisis Type Selection */}
          <div>
            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block mb-2">
              Select Crisis Type *
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {CRISIS_TYPES.map((t) => {
                const Icon = t.icon;
                const isSelected = crisisType === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => handleCrisisTypeSelect(t.id, t.defaultAmount)}
                    className={`p-3 rounded-xl border-2 text-left transition-all flex items-center gap-2.5 ${
                      isSelected
                        ? "border-blue-600 bg-blue-50/80 shadow-xs"
                        : "border-gray-200 bg-gray-50/60 hover:bg-gray-100/80 text-gray-700"
                    }`}
                  >
                    <div className={`size-8 rounded-lg flex items-center justify-center shrink-0 ${isSelected ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-600"}`}>
                      <Icon className="size-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-gray-900 truncate">{t.label}</div>
                      <div className="text-[11px] text-gray-500">₱{t.defaultAmount.toLocaleString()} Base</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Profile Information */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-blue-900 uppercase tracking-widest border-b border-gray-200 pb-2">
              1. Beneficiary Profile Information
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1" htmlFor="NewAicsModal.tsx-firstName">
                  First Name *
                </label>
                <input
                  id="NewAicsModal.tsx-firstName"
                  type="text"
                  required
                  maxLength={120}
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1" htmlFor="NewAicsModal.tsx-middleName">
                  Middle Name
                </label>
                <input
                  id="NewAicsModal.tsx-middleName"
                  type="text"
                  aria-required={false}
                  maxLength={120}
                  value={middleName}
                  onChange={(e) => setMiddleName(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1" htmlFor="NewAicsModal.tsx-lastName">
                  Last Name *
                </label>
                <input
                  id="NewAicsModal.tsx-lastName"
                  type="text"
                  required
                  maxLength={120}
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1" htmlFor="NewAicsModal.tsx-extensionName">
                  Extension Name
                </label>
                <input
                  id="NewAicsModal.tsx-extensionName"
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
                  <option value="SINGLE">Single</option>
                  <option value="MARRIED">Married</option>
                  <option value="WIDOWED">Widowed</option>
                  <option value="SEPARATED">Separated</option>
                  <option value="COMMON_LAW">Common Law / Cohabiting</option>
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
                  placeholder="0918-123-4567"
                  value={contactNumber}
                  onChange={(e) => setContactNumber(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-gray-700 block mb-1">
                  Household Income Status *
                </label>
                <select
                  required
                  value={incomeStatus}
                  onChange={(e) => setIncomeStatus(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white"
                >
                  <option value="Indigent / No Regular Income">Indigent / No Regular Income (Priority 1)</option>
                  <option value="Low Income / Minimum Wage">Low Income / Minimum Wage (Priority 2)</option>
                  <option value="In Crisis / Income Disrupted">In Crisis / Income Disrupted due to Emergency</option>
                </select>
              </div>
            </div>
          </div>

          {/* Emergency Crisis Details */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-blue-900 uppercase tracking-widest border-b border-gray-200 pb-2">
              2. Emergency Situation & Assistance Request
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-gray-700 block mb-1">
                  Initial Crisis Summary / Justification *
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="Brief summary of the emergency situation (e.g. Hospital confinement for acute pneumonia, funeral expenses, stranded traveler)..."
                  value={crisisSummary}
                  onChange={(e) => setCrisisSummary(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none bg-white"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">
                  Hospital / Funeral / Service Provider Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Bicol Medical Center / St. Peter Chapels"
                  value={serviceProvider}
                  onChange={(e) => setServiceProvider(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">
                  Initial Requested Assistance Amount (PHP) *
                </label>
                <input
                  type="number"
                  min="500"
                  max="100000"
                  step="500"
                  required
                  value={requestedAmount}
                  onChange={(e) => setRequestedAmount(Number(e.target.value))}
                  className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white font-medium"
                />
              </div>

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
                  value="Barangay Secretary / AICS Crisis Desk"
                  className="w-full px-3.5 py-2 text-sm border border-gray-200 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
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
                <>Saving Intake...</>
              ) : (
                <>
                  <CheckCircle2 className="size-4" />
                  Save & Register Intake
                </>
              )}
            </Button>
          </div>
        </div>

      </div>
    </div>
  );
}
