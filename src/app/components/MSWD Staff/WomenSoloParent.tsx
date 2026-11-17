import { matchesCaseTableFilters } from "../../utils/caseTableFilters";
import { ageFromBirthDate, mapNameFields, mapReviewProfileFields } from "../../utils/intakeProfile";
import React, { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { 
  PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, LineChart, Line 
} from "recharts";
import { toast } from "sonner";
import { MSWDCaseWorkflowModal, type CaseData, getSafeStatusConfig, type WorkflowStatusCode } from "../MSWDCaseWorkflowModal";
import { apiGetWomenSoloParentCases, mapDbRecordToCaseData, subscribeDataUpdated, apiGetCaseById, getCorrectionNotes, apiUpdateCaseNames, apiReturnCaseForCorrection, isSecretaryRole, getSecretarySubmittedCases } from "../../services/caseService";
import { getBarangayById, BARANGAY_ACCOUNTS } from "../../data/barangayAccounts";
import { NewWomenSoloParentModal } from "../NewWomenSoloParentModal";

import { 
  Users as UsersIcon, 
  Download, 
  Search, 
  ChevronDown, 
  X, 
  TrendingUp, 
  FileText, 
  BarChart3, 
  Calendar,
  CheckCircle2, 
  Clock, 
  Printer,
  LayoutDashboard, 
  HeartHandshake, 
  Plus,
  Save,
  AlertCircle
} from "lucide-react";

interface HouseholdMember {
  id: string;
  fullName: string;
  relationship: string;
  birthdate: string;
  age: number;
  sexAtBirth: string;
  highestEducationalAttainment: string;
  employmentStatus: string;
  occupation: string;
  monthlyPersonalIncome: string;
  verificationDocType: string;
  verificationFile: string;
  verificationStatus: string;
}

interface FullBeneficiaryProfile {
  familyRegistryId: string;
  beneficiaryId: string;
  profileType: string;
  registrationType: string;
  sector: string;
  lastName: string;
  firstName: string;
  middleName: string;
  extensionName: string;
  name: string;
  birthdate: string;
  age: number;
  birthPlace: string;
  sexAtBirth: string;
  civilStatus: string;
  nationality: string;
  religion: string;
  highestEducationalAttainment: string;
  contactNumber: string;
  email: string;
  province: string;
  municipality: string;
  barangay: string;
  purokZone: string;
  streetAddress: string;
  address: string;
  residencyStatus: string;
  employmentStatus: string;
  occupation: string;
  monthlyPersonalIncome: string;
  sourceOfIncome: string;
  householdIncome: string;
  economicClassification: string;
  is4Ps: boolean;
  fourPsId: string;
  isIP: boolean;
  ipTribe: string;
  isSoloParent: boolean;
  isSeniorCitizen: boolean;
  isPWD: boolean;
  submittedDate: string;
  verificationStatus: string;
  assignedVerifier: string;
  approvedDate: string | null;
  approvedBy: string | null;
  approvingOffice: string;
  remarks: string;
  householdMembers: HouseholdMember[];
}

interface ProfilingRecord {
  trackingId: string;
  beneficiaryName: string;
  profileType: string;
  barangay: string;
  status: string;
  statusColor: string;
  statusBg: string;
  rawDbRow?: any;
  fullInfo?: FullBeneficiaryProfile;
}

interface BeneficiaryRecord {
  id: string;
  date: string;
  beneficiary: {
    name: string;
    id: string;
    avatar: string;
    age?: number;
    gender?: string;
    address?: string;
    phone?: string;
  };
  sector: string;
  sectorColor: string;
  serviceType: string;
  status: string;
  statusColor: string;
  statusDot: string;
  amount?: string;
}

interface FrontlineCrisisProps {
  onNavigate?: (view: string) => void;
  allowedSubModules?: string[];
  userRole?: string;
  accountId?: string;
}

export function WomenSoloParent({ onNavigate, allowedSubModules, userRole, accountId }: FrontlineCrisisProps) {
  const effectiveRole = userRole || (typeof window !== "undefined" ? sessionStorage.getItem("benefitrack_active_role") || "" : "");
  const isSecretary = isSecretaryRole(effectiveRole) || (accountId ? !!getBarangayById(accountId) : false);
  const isStaff = !isSecretary;

  // Identify secretary's assigned barangay for personal queue filtering
  const brgyAccount = isSecretary ? (accountId ? getBarangayById(accountId) : BARANGAY_ACCOUNTS[0]) : null;
  const secretaryBarangayClean = (brgyAccount?.assignedBarangay || "San Juan")
    .replace(/^(brgy\.?|barangay)\s*/i, "")
    .trim()
    .toLowerCase();

  const [activeView, setActiveView] = useState("aics");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [profileTypeFilter, setProfileTypeFilter] = useState("all");
  const [newlyRegisteredId, setNewlyRegisteredId] = useState<string | null>(null);
  useEffect(() => { setNewlyRegisteredId(null); }, [searchQuery, statusFilter, profileTypeFilter]);

  // Profiling Modals State
  const [profilingViewModalOpen, setProfilingViewModalOpen] = useState(false);
  const [profilingEditModalOpen, setProfilingEditModalOpen] = useState(false);
  const [isAddMode, setIsAddMode] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<ProfilingRecord | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);
  const isReturnedProfile = selectedProfile?.rawDbRow?.status === "RETURNED_FOR_CORRECTION";

  // Official MSWD 8-Step Workflow State
  const [workflowModalOpen, setWorkflowModalOpen] = useState(false);
  const [activeWorkflowCase, setActiveWorkflowCase] = useState<CaseData | Partial<CaseData> | null>(null);

  const keepSavedCaseVisible = (record: ProfilingRecord) => {
    if (statusFilter !== "all" && !record.status.toLowerCase().includes(statusFilter.toLowerCase())) setStatusFilter("all");
    if (profileTypeFilter !== "all" && !record.profileType.toLowerCase().includes(profileTypeFilter.toLowerCase())) setProfileTypeFilter("all");
    const query = searchQuery.toLowerCase();
    if (![record.beneficiaryName, record.trackingId, record.barangay].some(value => value.toLowerCase().includes(query))) setSearchQuery("");
  };

  // New Beneficiary Registration Modal State
  const [isNewBeneficiaryModalOpen, setIsNewBeneficiaryModalOpen] = useState(false);

  // Helper to map PostgreSQL case record to UI ProfilingRecord
  const mapDbRowToProfilingRecord = useCallback((row: any): ProfilingRecord => {
    const rawStatus = (row.status || "BARANGAY_ENDORSED") as WorkflowStatusCode;
    const statusCfg = getSafeStatusConfig(rawStatus);
    const profileTypeDisplay = row.category === "SOLO_PARENT"
      ? "Solo Parent"
      : row.category === "WOMEN_VAWC"
      ? "Women / VAWC"
      : "Family Profile";

    return {
      trackingId: row.case_number,
      beneficiaryName: row.beneficiary_name,
      profileType: profileTypeDisplay,
      barangay: row.barangay_name,
      status: statusCfg.label,
      statusColor: statusCfg.text,
      statusBg: statusCfg.bg,
      rawDbRow: row,
      fullInfo: {
        familyRegistryId: `FAM-2026-${row.id || '001'}`,
        beneficiaryId: row.case_number,
        profileType: profileTypeDisplay,
        registrationType: "Family",
        sector: profileTypeDisplay,
        ...mapNameFields(row),
        name: row.beneficiary_name,
        birthdate: row.birth_date || "",
        age: ageFromBirthDate(row.birth_date || ""),
        birthPlace: "Calabanga, Camarines Sur",
        sexAtBirth: String(row.gender || "").toLowerCase().replace(/^./, c => c.toUpperCase()),
        civilStatus: String(row.civil_status || "").toLowerCase().replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()),
        nationality: "Filipino",
        religion: "Roman Catholic",
        highestEducationalAttainment: "High School Graduate",
        contactNumber: row.contact_number || "",
        email: "beneficiary@gmail.com",
        province: "Camarines Sur",
        municipality: "Calabanga",
        barangay: row.barangay_name,
        purokZone: "Zone 1",
        streetAddress: "Barangay Road",
        address: `${row.barangay_name}, Calabanga, Camarines Sur`,
        residencyStatus: "Permanent Resident",
        employmentStatus: "Informal Worker",
        occupation: "Informal Worker",
        monthlyPersonalIncome: `₱${Number(row.financial_aid_amount ?? 1000).toLocaleString()}`,
        sourceOfIncome: "Informal Work",
        householdIncome: "₱12,000",
        economicClassification: "Low Income Household",
        is4Ps: false,
        fourPsId: "",
        isIP: false,
        ipTribe: "N/A",
        isSoloParent: row.category === "SOLO_PARENT",
        isSeniorCitizen: false,
        isPWD: false,
        submittedDate: row.created_at ? new Date(row.created_at).toLocaleDateString() : "January 15, 2026",
        verificationStatus: statusCfg.label,
        assignedVerifier: "Barangay Registrar",
        approvedDate: row.status === "CASE_CLOSED" || row.status === "RELEASED_COMPLETED" ? "2026-10-09" : null,
        approvedBy: "MSWD Calabanga",
        approvingOffice: "MSWD Calabanga",
        remarks: row.assessment_notes || "Documented and verified under municipal welfare program.",
        householdMembers: [],
        ...mapReviewProfileFields(row),
      },
    };
  }, []);

  const caseLoadRequest = useRef(0);
  const loadCasesFromDb = useCallback(async () => {
    const requestId = ++caseLoadRequest.current;
    try {
      const rows = await apiGetWomenSoloParentCases();
      if (requestId !== caseLoadRequest.current) return;
      setProfilingRecords(rows.map(mapDbRowToProfilingRecord));
    } catch (err) {
      console.warn("[PostgreSQL] Could not fetch cases, using local state:", err);
    }
  }, [mapDbRowToProfilingRecord]);

  useEffect(() => {
    loadCasesFromDb();
    const unsubscribe = subscribeDataUpdated(loadCasesFromDb);
    return unsubscribe;
  }, [loadCasesFromDb]);

  const handleOpenWorkflow = (record?: ProfilingRecord) => {
    const modType = record?.profileType?.includes("VAWC") ? "women-vawc" : "solo-parent";
    if (!record?.rawDbRow) {
      toast.error("Select a saved case to open its workflow.");
      return;
    }
    const fullCase = mapDbRecordToCaseData(record.rawDbRow, modType);
    setActiveWorkflowCase(fullCase);
    setWorkflowModalOpen(true);
  };

  // Using useState to allow dynamic status updates & record additions
  const [profilingRecords, setProfilingRecords] = useState<ProfilingRecord[]>([]);

  const profileLoadRequest = useRef(0);
  const profileSaveInFlight = useRef(false);

  const handleEditProfile = async (record: ProfilingRecord) => {
    const requestId = ++profileLoadRequest.current;
    try {
      const latest = record.rawDbRow
        ? mapDbRowToProfilingRecord((await apiGetCaseById(record.trackingId, "women-solo-parent")).data)
        : record;
      if (requestId !== profileLoadRequest.current) return;
      setReviewNotes("");
      setSelectedProfile(latest);
      setIsAddMode(false);
      setProfilingEditModalOpen(true);
    } catch (error: any) {
      toast.error(error.message || "Could not load the beneficiary profile.");
    }
  };

  const handleSaveProfileEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProfile?.fullInfo || profileSaveInFlight.current) return;
    profileSaveInFlight.current = true;
    setProfileSaving(true);
    try {
      let confirmed = selectedProfile;
      const names = mapNameFields(selectedProfile.fullInfo);
      // Legacy records without explicit name parts retain their original stored name.
      if (selectedProfile.rawDbRow && (names.firstName || names.lastName)) {
        const saved = await apiUpdateCaseNames(selectedProfile.trackingId, names, "women-solo-parent");
        confirmed = mapDbRowToProfilingRecord(saved);
      }
      setSelectedProfile(confirmed);
      keepSavedCaseVisible(confirmed);
      setProfilingRecords(records => records.map(record => record.trackingId === confirmed.trackingId ? confirmed : record));
      toast.success("Profile saved successfully.");
      setProfilingEditModalOpen(false);
    } catch (error: any) {
      toast.error(error.message || "Could not save the beneficiary profile.");
    } finally {
      profileSaveInFlight.current = false;
      setProfileSaving(false);
    }
  };

  const handleReturnToBeneficiary = async () => {
    if (!selectedProfile?.rawDbRow || profileSaveInFlight.current) return;
    if (!reviewNotes.trim()) { toast.error("Enter the specific corrections or missing requirements in Review Notes."); return; }
    profileSaveInFlight.current = true;
    setProfileSaving(true);
    try {
      const saved = await apiReturnCaseForCorrection(selectedProfile.trackingId, reviewNotes, "women-solo-parent", selectedProfile.rawDbRow.workflow_version, selectedProfile.rawDbRow.status);
      const confirmed = mapDbRowToProfilingRecord(saved);
      setSelectedProfile(confirmed);
      setProfilingRecords(records => records.map(record => record.trackingId === confirmed.trackingId ? confirmed : record));
      toast.success("Case returned for correction and saved for barangay review.");
      setProfilingEditModalOpen(false);
      await loadCasesFromDb();
    } catch (error: any) {
      toast.error(error.message || "Could not return the case for correction.");
    } finally {
      profileSaveInFlight.current = false;
      setProfileSaving(false);
    }
  };

  const handleAddProfilingRecord = () => {
    setIsNewBeneficiaryModalOpen(true);
  };

  // Helper to check if a record status is strictly in "Pending Review" or "Under Review"
  const isPendingOrUnderReview = (statusText: string, rawStatus?: string) => {
    const s = (statusText || "").toLowerCase();
    const raw = (rawStatus || "").toUpperCase();
    return (
      s.includes("pending") ||
      s.includes("under review") ||
      s.includes("endorsed") ||
      s.includes("returned") ||
      raw === "BARANGAY_ENDORSED" ||
      raw === "UNDER_REVIEW" ||
      raw === "PENDING_VERIFICATION" ||
      raw === "RETURNED_FOR_CORRECTION"
    );
  };

  const submittedCases = getSecretarySubmittedCases();

  // Filter Logic with Strict RBAC Constraints
  const filteredRecords = profilingRecords.filter(record => {
    // RBAC: If Secretary, strictly restrict to records they personally submitted in Pending Review or Under Review
    if (isSecretary) {
      const matchesStatusConstraint = isPendingOrUnderReview(record.status, record.rawDbRow?.status);
      if (!matchesStatusConstraint) return false;

      const recordBarangayClean = (record.barangay || "").toLowerCase();
      const isPersonallySubmitted =
        submittedCases.includes(record.trackingId) ||
        recordBarangayClean.includes(secretaryBarangayClean) ||
        secretaryBarangayClean.includes(recordBarangayClean) ||
        (record.rawDbRow?.created_by && record.rawDbRow.created_by.toLowerCase().includes("secretary")) ||
        (record.rawDbRow?.barangay_name && record.rawDbRow.barangay_name.toLowerCase().includes(secretaryBarangayClean));

      if (!isPersonallySubmitted) return false;
    }

    if (record.trackingId === newlyRegisteredId) return true;
    return matchesCaseTableFilters(record, searchQuery, statusFilter, profileTypeFilter);
  });

  return (
    <div className="h-full overflow-y-auto bg-gradient-to-br from-gray-50 to-gray-100 pb-10 relative">

      {/* ---------------- VIEW PROFILING MODAL (Read-Only) ---------------- */}
      {profilingViewModalOpen && selectedProfile?.fullInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto flex flex-col">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex flex-col items-start gap-3 z-10">
              <button onClick={() => setProfilingViewModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100 -ml-1">
                <X className="size-5" />
              </button>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Beneficiary Information</h2>
                <p className="text-sm text-gray-500 mt-1">Read-only view for {selectedProfile.fullInfo.name}</p>
              </div>
            </div>
            <div className="p-6">
              <p className="text-gray-500 italic">View mode active. Use 'Review' to see the full form.</p>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- EDIT / REVIEW PROFILING MODAL ---------------- */}
      {profilingEditModalOpen && selectedProfile?.fullInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-5xl max-h-[95vh] overflow-y-auto flex flex-col">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex flex-col items-start gap-3 z-20">
              <button 
                onClick={() => setProfilingEditModalOpen(false)} 
                className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100 -ml-1"
              >
                <X className="size-5" />
              </button>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Review Beneficiary Profile</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Beneficiary ID: <span className="font-semibold text-gray-700">{selectedProfile.fullInfo.beneficiaryId}</span> | 
                  Family Registry ID: <span className="font-semibold text-gray-700">{selectedProfile.fullInfo.familyRegistryId}</span>
                </p>
              </div>
            </div>
            
            <form onSubmit={handleSaveProfileEdit} className="flex flex-col flex-1">
              <div className="p-6 space-y-10">
                
                {/* 1. PERSONAL DETAILS */}
                <section>
                  <h3 className="text-sm font-bold text-blue-900 uppercase tracking-widest border-b border-gray-200 pb-2 mb-4">Personal Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-sm">
                    <div>
                      <label className="text-xs font-semibold text-gray-600 uppercase block mb-1">Profile Type</label>
                      <select 
                        value={selectedProfile.fullInfo.profileType}
                        onChange={(e) => {
                          const val = e.target.value;
                          setSelectedProfile(prev => {
                            if (!prev) return prev;
                            return {
                              ...prev,
                              profileType: val,
                              fullInfo: {
                                ...prev.fullInfo!,
                                profileType: val,
                                registrationType: val.split(" ")[0]
                              }
                            };
                          });
                          setProfilingRecords(prevRecords => 
                            prevRecords.map(r => r.trackingId === selectedProfile.trackingId 
                              ? { ...r, profileType: val, fullInfo: { ...r.fullInfo!, profileType: val, registrationType: val.split(" ")[0] } } 
                              : r)
                          );
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="Individual Profile">Individual Profile</option>
                        <option value="Family Profile">Family Profile</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-gray-600 uppercase block mb-1">Last Name</label>
                      <input type="text" disabled readOnly value={selectedProfile.fullInfo.lastName} className="w-full px-3 py-2 border rounded-lg bg-gray-100 text-gray-700 cursor-not-allowed" />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-600 uppercase block mb-1">First Name</label>
                      <input type="text" disabled readOnly value={selectedProfile.fullInfo.firstName} className="w-full px-3 py-2 border rounded-lg bg-gray-100 text-gray-700 cursor-not-allowed" />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-600 uppercase block mb-1">Middle Name</label>
                      <input type="text" disabled readOnly value={selectedProfile.fullInfo.middleName} className="w-full px-3 py-2 border rounded-lg bg-gray-100 text-gray-700 cursor-not-allowed" />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-600 uppercase block mb-1">Extension Name</label>
                      <input type="text" disabled readOnly value={selectedProfile.fullInfo.extensionName} className="w-full px-3 py-2 border rounded-lg bg-gray-100 text-gray-700 cursor-not-allowed" />
                    </div>
                    
                    <div>
                      <label className="text-xs font-semibold text-gray-600 uppercase block mb-1">Date of Birth</label>
                      <input type="text" disabled readOnly value={selectedProfile.fullInfo.birthdate} className="w-full px-3 py-2 border rounded-lg bg-gray-100 text-gray-700 cursor-not-allowed" />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-600 uppercase block mb-1">Age</label>
                      <input type="number" disabled readOnly value={selectedProfile.fullInfo.age} className="w-full px-3 py-2 border rounded-lg bg-gray-100 text-gray-700 cursor-not-allowed" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-xs font-semibold text-gray-600 uppercase block mb-1">Place of Birth</label>
                      <input type="text" disabled readOnly value={selectedProfile.fullInfo.birthPlace} className="w-full px-3 py-2 border rounded-lg bg-gray-100 text-gray-700 cursor-not-allowed" />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-gray-600 uppercase block mb-1">Sex at Birth</label>
                      <select disabled value={selectedProfile.fullInfo.sexAtBirth} className="w-full px-3 py-2 border rounded-lg bg-gray-100 text-gray-700 cursor-not-allowed">
                        <option>Female</option>
                        <option>Male</option>
                        <option>Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-600 uppercase block mb-1">Civil Status</label>
                      <select disabled value={selectedProfile.fullInfo.civilStatus} className="w-full px-3 py-2 border rounded-lg bg-gray-100 text-gray-700 cursor-not-allowed">
                        <option>Single</option>
                        <option>Married</option>
                        <option>Widowed</option>
                        <option>Single Parent</option>
                        <option>Separated</option>
                        <option>Annulled</option>
                        <option>Common Law</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-600 uppercase block mb-1">Nationality</label>
                      <input type="text" disabled readOnly value={selectedProfile.fullInfo.nationality} className="w-full px-3 py-2 border rounded-lg bg-gray-100 text-gray-700 cursor-not-allowed" />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-600 uppercase block mb-1">Religion</label>
                      <input type="text" disabled readOnly value={selectedProfile.fullInfo.religion} className="w-full px-3 py-2 border rounded-lg bg-gray-100 text-gray-700 cursor-not-allowed" />
                    </div>

                    <div className="md:col-span-2">
                      <label className="text-xs font-semibold text-gray-600 uppercase block mb-1">Highest Educational Attainment</label>
                      <input type="text" disabled readOnly value={selectedProfile.fullInfo.highestEducationalAttainment} className="w-full px-3 py-2 border rounded-lg bg-gray-100 text-gray-700 cursor-not-allowed" />
                    </div>
                  </div>
                </section>

                {/* 2. CONTACT & ADDRESS */}
                <section>
                  <h3 className="text-sm font-bold text-blue-900 uppercase tracking-widest border-b border-gray-200 pb-2 mb-4">Contact & Address</h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-sm">
                    <div className="md:col-span-2">
                      <label className="text-xs font-semibold text-gray-600 uppercase block mb-1">Contact Number</label>
                      <input type="text" disabled readOnly value={selectedProfile.fullInfo.contactNumber} className="w-full px-3 py-2 border rounded-lg bg-gray-100 text-gray-700 cursor-not-allowed" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-xs font-semibold text-gray-600 uppercase block mb-1">Email</label>
                      <input type="email" disabled readOnly value={selectedProfile.fullInfo.email} className="w-full px-3 py-2 border rounded-lg bg-gray-100 text-gray-700 cursor-not-allowed" />
                    </div>

                    <div className="md:col-span-2">
                      <label className="text-xs font-semibold text-gray-600 uppercase block mb-1">Barangay</label>
                      <input type="text" disabled readOnly value={selectedProfile.fullInfo.barangay} className="w-full px-3 py-2 border rounded-lg bg-gray-100 text-gray-700 cursor-not-allowed" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-xs font-semibold text-gray-600 uppercase block mb-1">Purok / Zone</label>
                      <input type="text" disabled readOnly value={selectedProfile.fullInfo.purokZone} className="w-full px-3 py-2 border rounded-lg bg-gray-100 text-gray-700 cursor-not-allowed" />
                    </div>

                    <div className="md:col-span-4">
                      <label className="text-xs font-semibold text-gray-600 uppercase block mb-1">Street Address</label>
                      <input type="text" disabled readOnly value={selectedProfile.fullInfo.streetAddress} className="w-full px-3 py-2 border rounded-lg bg-gray-100 text-gray-700 cursor-not-allowed" />
                    </div>
                  </div>
                </section>

                {/* 3. SOCIO-ECONOMIC INFORMATION */}
                <section>
                  <h3 className="text-sm font-bold text-blue-900 uppercase tracking-widest border-b border-gray-200 pb-2 mb-4">Socio-Economic Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-sm">
                    <div>
                      <label className="text-xs font-semibold text-gray-600 uppercase block mb-1">Employment Status</label>
                      <input type="text" disabled readOnly value={selectedProfile.fullInfo.employmentStatus} className="w-full px-3 py-2 border rounded-lg bg-gray-100 text-gray-700 cursor-not-allowed" />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-600 uppercase block mb-1">Monthly Personal Income</label>
                      <input type="text" disabled readOnly value={selectedProfile.fullInfo.monthlyPersonalIncome} className="w-full px-3 py-2 border rounded-lg bg-gray-100 text-gray-700 cursor-not-allowed" />
                    </div>
                  </div>
                </section>

                {/* 4. GOVERNMENT ASSISTANCE & CLASSIFICATIONS */}
                <section>
                  <h3 className="text-sm font-bold text-blue-900 uppercase tracking-widest border-b border-gray-200 pb-2 mb-4">Government Assistance & Classifications</h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-sm">
                    <div>
                      <label className="text-xs font-semibold text-gray-600 uppercase block mb-1">4Ps Beneficiary Status</label>
                      <select disabled value={selectedProfile.fullInfo.is4Ps ? "Yes" : "No"} className="w-full px-3 py-2 border rounded-lg bg-gray-100 text-gray-700 cursor-not-allowed">
                        <option value="Yes">Yes</option>
                        <option value="No">No</option>
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-xs font-semibold text-gray-600 uppercase block mb-1">4Ps Household ID Number</label>
                      <input type="text" disabled readOnly value={selectedProfile.fullInfo.fourPsId} className="w-full px-3 py-2 border rounded-lg bg-gray-100 text-gray-700 cursor-not-allowed" />
                    </div>
                    <div></div> {/* Spacer */}

                    <div>
                      <label className="text-xs font-semibold text-gray-600 uppercase block mb-1">Indigenous Person (IP) Status</label>
                      <select disabled value={selectedProfile.fullInfo.isIP ? "Yes" : "No"} className="w-full px-3 py-2 border rounded-lg bg-gray-100 text-gray-700 cursor-not-allowed">
                        <option value="Yes">Yes</option>
                        <option value="No">No</option>
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-xs font-semibold text-gray-600 uppercase block mb-1">IP Tribe / Affiliation</label>
                      <input type="text" disabled readOnly value={selectedProfile.fullInfo.ipTribe} className="w-full px-3 py-2 border rounded-lg bg-gray-100 text-gray-700 cursor-not-allowed" />
                    </div>
                  </div>
                </section>

                {/* 5. HOUSEHOLD MEMBERS */}
                {selectedProfile.fullInfo.profileType === "Family Profile" && (
                  <section>
                    <div className="border-b border-gray-200 pb-2 mb-4">
                      <h3 className="text-sm font-bold text-blue-900 uppercase tracking-widest">Household Members</h3>
                    </div>
                    
                    <div className="overflow-x-auto border border-gray-200 rounded-lg">
                      <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider border-b border-gray-200">
                          <tr>
                            <th className="px-4 py-3 font-semibold min-w-[200px]">Full Legal Name</th>
                            <th className="px-4 py-3 font-semibold min-w-[120px]">Relationship</th>
                            <th className="px-4 py-3 font-semibold min-w-[140px]">Date of Birth</th>
                            <th className="px-4 py-3 font-semibold w-[80px]">Age</th>
                            <th className="px-4 py-3 font-semibold min-w-[100px]">Sex at Birth</th>
                            <th className="px-4 py-3 font-semibold min-w-[180px]">Education</th>
                            <th className="px-4 py-3 font-semibold min-w-[140px]">Employment</th>
                            <th className="px-4 py-3 font-semibold min-w-[140px]">Occupation</th>
                            <th className="px-4 py-3 font-semibold min-w-[120px]">Income</th>
                            <th className="px-4 py-3 font-semibold min-w-[180px]">Verification Doc</th>
                            <th className="px-4 py-3 font-semibold min-w-[160px]">Attached File</th>
                            <th className="px-4 py-3 font-semibold min-w-[140px]">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {selectedProfile.fullInfo.householdMembers.length > 0 ? (
                            selectedProfile.fullInfo.householdMembers.map((member) => (
                              <tr key={member.id} className="bg-white hover:bg-gray-50">
                                <td className="px-2 py-2">
                                  <input type="text" defaultValue={member.fullName} className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500" />
                                </td>
                                <td className="px-2 py-2">
                                  <input type="text" defaultValue={member.relationship} className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500" />
                                </td>
                                <td className="px-2 py-2">
                                  <input type="text" defaultValue={member.birthdate} className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500" />
                                </td>
                                <td className="px-2 py-2">
                                  <input type="number" defaultValue={member.age} className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500" />
                                </td>
                                <td className="px-2 py-2">
                                  <select defaultValue={member.sexAtBirth} className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 bg-white">
                                    <option>Female</option>
                                    <option>Male</option>
                                  </select>
                                </td>
                                <td className="px-2 py-2">
                                  <input type="text" defaultValue={member.highestEducationalAttainment} className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500" />
                                </td>
                                <td className="px-2 py-2">
                                  <input type="text" defaultValue={member.employmentStatus} className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500" />
                                </td>
                                <td className="px-2 py-2">
                                  <input type="text" defaultValue={member.occupation} className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500" />
                                </td>
                                <td className="px-2 py-2">
                                  <input type="text" defaultValue={member.monthlyPersonalIncome} className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500" />
                                </td>
                                <td className="px-2 py-2">
                                  <input type="text" defaultValue={member.verificationDocType} className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500" />
                                </td>
                                <td className="px-2 py-2">
                                  <input type="text" defaultValue={member.verificationFile} className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500" />
                                </td>
                                <td className="px-2 py-2">
                                  <select defaultValue={member.verificationStatus} className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 bg-white">
                                    <option value="Pending Review">Pending Review</option>
                                    <option value="Verified">Verified</option>
                                    <option value="Rejected">Rejected</option>
                                  </select>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={12} className="px-4 py-4 text-center text-gray-500 text-xs">
                                No household members listed.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </section>
                )}

                {/* 6. BARANGAY VERIFICATION */}
                <section className="bg-blue-50/50 p-6 rounded-xl border border-blue-100">
                  <h3 className="text-sm font-bold text-blue-900 uppercase tracking-widest border-b border-blue-200 pb-2 mb-4">Barangay Verification</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                    <div>
                      <label className="text-xs font-semibold text-gray-700 uppercase block mb-1">Residency Verification</label>
                      <select required defaultValue="" className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 focus:ring-2 focus:ring-blue-500 outline-none">
                        <option value="" disabled>Select Residency Status...</option>
                        <option value="Verified Resident">Verified Resident</option>
                        <option value="Not a Verified Resident">Not a Verified Resident</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-700 uppercase block mb-1">Document Verification</label>
                      <select required defaultValue="" className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 focus:ring-2 focus:ring-blue-500 outline-none">
                        <option value="" disabled>Select Document Status...</option>
                        <option value="Complete and Valid">Complete and Valid</option>
                        <option value="Incomplete">Incomplete</option>
                        <option value="Invalid Documents">Invalid Documents</option>
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-xs font-semibold text-gray-700 uppercase block mb-1">{isReturnedProfile ? "MSWD Correction Instructions" : "Review Notes (required when returning)"}</label>
                      <textarea
                        value={isReturnedProfile ? getCorrectionNotes(selectedProfile.rawDbRow) : reviewNotes}
                        readOnly={isReturnedProfile}
                        maxLength={4000}
                        onChange={event => setReviewNotes(event.target.value)}
                        rows={4} 
                        placeholder="Enter review notes here..." 
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                      ></textarea>
                    </div>
                  </div>
                </section>
              </div>

              {/* Fixed Footer */}
              <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end items-center sticky bottom-0 rounded-b-xl mt-auto z-20 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                {isAddMode ? (
                  <div className="flex gap-3">
                    <Button type="button" variant="ghost" onClick={() => setProfilingEditModalOpen(false)}>
                      Cancel
                    </Button>
                    <Button 
                      type="submit"
                      disabled={profileSaving}
                      className="bg-blue-600 text-white hover:bg-blue-700 gap-2 shadow-sm transition-colors"
                    >
                      <Save className="size-4" /> Save
                    </Button>
                  </div>
                ) : (
                  <div className="flex gap-3">
                    <Button 
                      type="button" 
                      variant="outline" 
                      disabled={profileSaving || isReturnedProfile}
                      onClick={handleReturnToBeneficiary}
                      className="text-amber-700 border-amber-300 hover:bg-amber-50 hover:text-amber-800 gap-2 shadow-sm"
                    >
                      <AlertCircle className="size-4" /> Return to Beneficiary
                    </Button>
                    <Button 
                      type="submit"
                      disabled={profileSaving}
                      className="bg-green-600 text-white hover:bg-green-700 gap-2 shadow-sm transition-colors"
                    >
                      <CheckCircle2 className="size-4" /> Endorse & Verify
                    </Button>
                  </div>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Page Header */}
      <div className="bg-white border-b border-gray-200 py-4 mb-6 shadow-xs">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-bold text-blue-900 tracking-tight">
            Women &amp; Solo Parent Assistance
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Municipal Social Welfare &amp; Development — Beneficiary Profiling &amp; Application Status
          </p>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Navigation Cards */}
        <div className="flex flex-wrap gap-3 mt-3 mb-4">
          <div onClick={() => setActiveView("dashboard")} className="cursor-pointer">
            <Card className={`border rounded-md shadow-sm transition-all ${ activeView === "dashboard" ? "bg-blue-900 border-blue-900 text-white" : "bg-white border-gray-200 hover:border-blue-300 hover:bg-blue-50" }`}>
              <div className="flex items-center gap-3 px-5 py-2.5">
                <LayoutDashboard className={`size-5 ${ activeView === "dashboard" ? "text-white" : "text-gray-500" }`} />
                <span className={`text-sm font-semibold ${ activeView === "dashboard" ? "text-white" : "text-gray-600" }`}> Dashboard </span>
              </div>
            </Card>
          </div>
          <div onClick={() => setActiveView("aics")} className="cursor-pointer">
            <Card className={`border rounded-md shadow-sm transition-all ${ activeView === "aics" ? "bg-blue-900 border-blue-900 text-white" : "bg-white border-gray-200 hover:border-blue-300 hover:bg-blue-50" }`}>
              <div className="flex items-center gap-3 px-5 py-2.5">
                <HeartHandshake className={`size-5 ${ activeView === "aics" ? "text-white" : "text-gray-500" }`} />
                <span className={`text-sm font-semibold ${ activeView === "aics" ? "text-white" : "text-gray-600" }`}> Individual & Family Profiling </span>
              </div>
            </Card>
          </div>
        </div>

        {/* CONTENT AREA */}
        <div className="mt-8">
          {activeView === "dashboard" && (
            <div className="space-y-6">
              <div className="p-6 bg-white rounded-xl shadow border">
                <p className="text-gray-500">Dashboard content area... Switch to Individual & Family Profiling to see the records.</p>
              </div>
            </div>
          )}

          {activeView === "aics" && (
            <div className="space-y-6">
              {/* TOP ALIGNED ACTION BAR: SEARCH, FILTERS, ADD BUTTON */}
              <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row items-center gap-4">
                
                {/* Search Bar - Flex 1 to stretch */}
                <div className="relative w-full md:flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search ID, name, barangay..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                  />
                  {searchQuery && (
                    <button 
                      onClick={() => setSearchQuery("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X className="size-3.5" />
                    </button>
                  )}
                </div>

                {/* Filters and Add Button Group */}
                <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                  {/* Status Filter */}
                  <div className="relative w-full sm:w-48">
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="w-full appearance-none px-3 py-2 pr-8 text-sm border border-gray-300 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {isSecretary ? (
                        <>
                          <option value="all">All My Pending Reviews</option>
                          <option value="Pending Verification">Pending Verification</option>
                          <option value="Under Review">Under Review</option>
                          <option value="Returned for Correction">Returned for Correction</option>
                        </>
                      ) : (
                        <>
                          <option value="all">All Statuses (Full Registry)</option>
                          <option value="Pending Verification">Pending Verification (Incoming Queue)</option>
                          <option value="Under Review">Under Review</option>
                          <option value="Verified">Verified / In Assessment</option>
                          <option value="Returned for Correction">Returned for Correction</option>
                        </>
                      )}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-gray-400 pointer-events-none" />
                  </div>

                  {/* Profile Type Filter */}
                  <div className="relative w-full sm:w-48">
                    <select
                      value={profileTypeFilter}
                      onChange={(e) => setProfileTypeFilter(e.target.value)}
                      className="w-full appearance-none px-3 py-2 pr-8 text-sm border border-gray-300 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">All Profile Types</option>
                      <option value="Family">Family Profile</option>
                      <option value="Individual">Individual Profile</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-gray-400 pointer-events-none" />
                  </div>

                  {/* Add Profiling Record Button */}
                  <Button 
                    onClick={() => setIsNewBeneficiaryModalOpen(true)}
                    className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white gap-2 transition-colors shadow-sm shrink-0"
                  >
                    <Plus className="size-4" /> Add Profiling Record
                  </Button>
                </div>
              </div>

              {/* Data Table */}
              <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Tracking ID</th>
                        <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Beneficiary Name</th>
                        <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Profile Type</th>
                        <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Barangay</th>
                        <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                        <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredRecords.length > 0 ? (
                        filteredRecords.map((record) => (
                          <tr key={record.trackingId} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4 text-sm text-gray-900 font-medium">{record.trackingId}</td>
                            <td className="px-6 py-4 text-sm text-gray-600">{record.beneficiaryName}</td>
                            <td className="px-6 py-4 text-sm text-gray-600">{record.profileType}</td>
                            <td className="px-6 py-4 text-sm text-gray-900">{record.barangay}</td>
                            <td className="px-6 py-4">
                              <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${record.statusBg} ${record.statusColor}`}>
                                {record.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                {isSecretary ? (
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={() => handleOpenWorkflow(record)}
                                    className="bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-100 font-bold"
                                  >
                                    View Intake
                                  </Button>
                                ) : (
                                  <>
                                    <Button 
                                      variant="outline" 
                                      size="sm" 
                                      onClick={() => handleOpenWorkflow(record)}
                                      className="bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-100 font-bold"
                                    >
                                      Application Status
                                    </Button>
                                    <Button 
                                      variant="outline" 
                                      size="sm" 
                                      onClick={() => handleEditProfile(record)}
                                      className="text-amber-600 border-amber-200 hover:bg-amber-50"
                                    >
                                      Review
                                    </Button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="px-6 py-8 text-center text-gray-500 text-sm">
                            No profiling records match your search or filters.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* MSWD 8-Step Case Processing Workflow Modal */}
      <MSWDCaseWorkflowModal
        isOpen={workflowModalOpen}
        moduleType="WOMEN_SOLO_PARENT"
        onClose={() => {
          setWorkflowModalOpen(false);
          loadCasesFromDb();
        }}
        caseItem={activeWorkflowCase || undefined}
        onUpdateCase={() => {
          loadCasesFromDb();
        }}
        userRole={effectiveRole}
        isReadOnly={isSecretary}
      />

      {/* New Beneficiary Registration Modal */}
      <NewWomenSoloParentModal
        isOpen={isNewBeneficiaryModalOpen}
        onClose={() => setIsNewBeneficiaryModalOpen(false)}
        onSuccess={(createdRecord) => {
          ++caseLoadRequest.current;
          const record = mapDbRowToProfilingRecord(createdRecord);
          setProfilingRecords(current => [record, ...current.filter(item => item.trackingId !== record.trackingId)]);
          setNewlyRegisteredId(record.trackingId);
          void loadCasesFromDb();
        }}
      />
    </div>
  );
}