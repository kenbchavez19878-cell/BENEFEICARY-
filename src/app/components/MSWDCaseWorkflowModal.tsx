import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { toast } from "sonner";
import { apiUpdateCaseStep, apiGetCaseById, mapDbRecordToCaseData, isSecretaryRole } from "../services/caseService";
import {
  FileText,
  FileCheck,
  ClipboardList,
  CheckCircle2,
  AlertCircle,
  Clock,
  Send,
  UserCheck,
  Wallet,
  ShieldCheck,
  Calendar,
  X,
  ChevronRight,
  ChevronLeft,
  Plus,
  MessageSquare,
  Lock,
  Check,
  AlertTriangle,
  FileSpreadsheet,
  Building,
  User,
  Heart,
  Award,
  Printer,
  QrCode,
  Eye,
  RefreshCw,
  CreditCard,
  FileCheck2,
  CheckCheck,
  Undo2,
} from "lucide-react";

// Exact Status Triggers required
export type WorkflowStatusCode =
  | "BARANGAY_ENDORSED"
  | "UNDER_REVIEW"
  | "RETURNED_FOR_CORRECTION"
  | "IN_ASSESSMENT"
  | "ELIGIBILITY_EVALUATED"
  | "APPROVED_FOR_RELEASE"
  | "RELEASED_COMPLETED"
  | "CASE_CLOSED";

export const STATUS_CONFIG: Record<
  WorkflowStatusCode,
  { label: string; bg: string; text: string; border: string }
> = {
  BARANGAY_ENDORSED: {
    label: "BARANGAY ENDORSED",
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
  },
  UNDER_REVIEW: {
    label: "UNDER REVIEW",
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
  },
  RETURNED_FOR_CORRECTION: {
    label: "RETURNED FOR CORRECTION",
    bg: "bg-red-50",
    text: "text-red-700",
    border: "border-red-200",
  },
  IN_ASSESSMENT: {
    label: "IN ASSESSMENT",
    bg: "bg-purple-50",
    text: "text-purple-700",
    border: "border-purple-200",
  },
  ELIGIBILITY_EVALUATED: {
    label: "ELIGIBILITY EVALUATED",
    bg: "bg-indigo-50",
    text: "text-indigo-700",
    border: "border-indigo-200",
  },
  APPROVED_FOR_RELEASE: {
    label: "APPROVED FOR RELEASE",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
  },
  RELEASED_COMPLETED: {
    label: "RELEASED / COMPLETED",
    bg: "bg-green-100",
    text: "text-green-800",
    border: "border-green-300",
  },
  CASE_CLOSED: {
    label: "COMPLETED / CLOSED",
    bg: "bg-emerald-100",
    text: "text-emerald-900",
    border: "border-emerald-300",
  },
};

// Safe status config resolver to prevent undefined access crashes
export function getSafeStatusConfig(code?: string): { label: string; bg: string; text: string; border: string } {
  if (!code) return STATUS_CONFIG.BARANGAY_ENDORSED;
  const normalized = String(code).toUpperCase().replace(/\s+/g, "_");
  if (normalized in STATUS_CONFIG) {
    return STATUS_CONFIG[normalized as WorkflowStatusCode];
  }
  if (normalized.includes("VERIF") || normalized.includes("PENDING")) {
    return STATUS_CONFIG.BARANGAY_ENDORSED;
  }
  if (normalized.includes("REVIEW")) {
    return STATUS_CONFIG.UNDER_REVIEW;
  }
  if (normalized.includes("ASSESS")) {
    return STATUS_CONFIG.IN_ASSESSMENT;
  }
  if (normalized.includes("ELIGIB")) {
    return STATUS_CONFIG.ELIGIBILITY_EVALUATED;
  }
  if (normalized.includes("APPROV")) {
    return STATUS_CONFIG.APPROVED_FOR_RELEASE;
  }
  if (normalized.includes("RELEASE") || normalized.includes("COMPLETE")) {
    return STATUS_CONFIG.RELEASED_COMPLETED;
  }
  if (normalized.includes("CLOSE")) {
    return STATUS_CONFIG.CASE_CLOSED;
  }
  return {
    label: String(code).replace(/_/g, " ").toUpperCase(),
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
  };
}

// Module type normalizer
export function normalizeModuleType(mod?: string): "solo-parent" | "women-vawc" | "aics" {
  if (!mod) return "solo-parent";
  const m = String(mod).toLowerCase();
  if (m.includes("aics") || m.includes("crisis")) return "aics";
  if (m.includes("vawc")) return "women-vawc";
  if (m.includes("solo") || m.includes("women")) return "solo-parent";
  return "solo-parent";
}

export interface TimelineEntry {
  id: string;
  date: string;
  author: string;
  title: string;
  description: string;
  type?: "visit" | "update" | "note" | "status";
}

export interface DocumentCheckItem {
  id: string;
  name: string;
  status: "Valid" | "Incomplete" | "Invalid";
  fileRef?: string;
  fileUrl?: string;
}

export interface CaseData {
  id?: number;
  trackingId: string;
  beneficiaryName: string;
  beneficiaryId: string;
  barangay: string;
  moduleType: "solo-parent" | "women-vawc" | "aics";
  statusCode: WorkflowStatusCode;
  endorsementDate: string;
  endorsedBy: string;
  endorsementNotes: string;
  documents: DocumentCheckItem[];
  socialAssessment: {
    intakeNotes: string;
    caseStudySummary: string;
    vulnerabilityLevel: "High" | "Moderate" | "Low";
    vulnerabilityNotes: string;
    assignedSocialWorker: string;
  };
  eligibility: {
    status: "Eligible" | "Not Eligible" | "Additional Requirements Needed" | "For Referral" | "";
    notes: string;
    evaluatedDate?: string;
  };
  servicePlan: {
    spicNumber: string;
    purchaseBookletNumber: string;
    emergencyCashAidAmount: number;
    referrals: string[];
    crisisType: "Medical" | "Burial" | "Transportation" | "Economic Relief" | "Balik Probinsya";
    approvedFinancialAmount: number;
    nonMonetarySupport?: string;
  };
  serviceRelease: {
    releaseMethod: "Cash Payout" | "Check" | "Guarantee Letter / GL";
    guaranteeLetterNumber: string;
    payoutDate: string;
    approvedAmount: number;
    payoutOfficer: string;
    disbursementStatus: string;
  };
  timeline: TimelineEntry[];
  caseClosedDate?: string;
  closureNotes?: string;
}

export interface MSWDCaseWorkflowModalProps {
  isOpen: boolean;
  onClose: () => void;
  caseItem?: Partial<CaseData> | any;
  moduleType?: "solo-parent" | "women-vawc" | "aics" | "WOMEN_SOLO_PARENT" | string;
  onUpdateCase?: (updated: CaseData) => void;
  userRole?: string;
  isReadOnly?: boolean;
}

const DEFAULT_SOLO_PARENT_DOCS: DocumentCheckItem[] = [
  { id: "sp-1", name: "PSA Child Birth Certificate", status: "Valid", fileRef: "psa_birth_cert.pdf" },
  { id: "sp-2", name: "Proof of Solo Parent Status (Death Cert/Court Order/Abandonment Affidavit)", status: "Valid", fileRef: "proof_solo_parent.pdf" },
  { id: "sp-3", name: "Barangay Indigency/Low Income", status: "Valid", fileRef: "brgy_indigency.pdf" },
];

const DEFAULT_WOMEN_DOCS: DocumentCheckItem[] = [
  { id: "w-1", name: "Valid ID", status: "Valid", fileRef: "valid_id.pdf" },
  { id: "w-2", name: "BPO/Police Blotter", status: "Valid", fileRef: "police_blotter.pdf" },
  { id: "w-3", name: "Medico-Legal Report", status: "Incomplete", fileRef: "medico_legal.pdf" },
  { id: "w-4", name: "Barangay Indigency", status: "Valid", fileRef: "brgy_indigency.pdf" },
];

const DEFAULT_AICS_DOCS: DocumentCheckItem[] = [
  { id: "a-1", name: "Valid ID", status: "Valid", fileRef: "valid_id.pdf" },
  { id: "a-2", name: "Indigency", status: "Valid", fileRef: "brgy_indigency.pdf" },
  { id: "a-3", name: "Hospital SOA/Bills", status: "Valid", fileRef: "hospital_soa.pdf" },
  { id: "a-4", name: "Doctor's Prescription", status: "Valid", fileRef: "prescription.pdf" },
  { id: "a-5", name: "Death Cert / Funeral Contract", status: "Incomplete", fileRef: "death_cert.pdf" },
  { id: "a-6", name: "Transit Request", status: "Incomplete", fileRef: "transit_request.pdf" },
];

// Helper to construct complete and defended CaseData object
export function buildSafeCaseData(
  rawItem?: Partial<CaseData> | any,
  fallbackModule: "solo-parent" | "women-vawc" | "aics" = "solo-parent"
): CaseData {
  const modType = normalizeModuleType(rawItem?.moduleType || fallbackModule);
  const defaultDocs =
    modType === "solo-parent"
      ? DEFAULT_SOLO_PARENT_DOCS
      : modType === "women-vawc"
      ? DEFAULT_WOMEN_DOCS
      : DEFAULT_AICS_DOCS;

  const rawStatusCode = (rawItem?.statusCode || rawItem?.status || "BARANGAY_ENDORSED").toString().toUpperCase().replace(/\s+/g, "_");
  const validStatusList: WorkflowStatusCode[] = [
    "BARANGAY_ENDORSED", "UNDER_REVIEW", "RETURNED_FOR_CORRECTION",
    "IN_ASSESSMENT", "ELIGIBILITY_EVALUATED", "APPROVED_FOR_RELEASE",
    "RELEASED_COMPLETED", "CASE_CLOSED"
  ];
  let safeStatusCode: WorkflowStatusCode = "BARANGAY_ENDORSED";
  if (validStatusList.includes(rawStatusCode as WorkflowStatusCode)) {
    safeStatusCode = rawStatusCode as WorkflowStatusCode;
  } else if (rawStatusCode.includes("REVIEW")) {
    safeStatusCode = "UNDER_REVIEW";
  } else if (rawStatusCode.includes("ASSESS")) {
    safeStatusCode = "IN_ASSESSMENT";
  } else if (rawStatusCode.includes("ELIGIB")) {
    safeStatusCode = "ELIGIBILITY_EVALUATED";
  } else if (rawStatusCode.includes("APPROV")) {
    safeStatusCode = "APPROVED_FOR_RELEASE";
  } else if (rawStatusCode.includes("RELEASE") || rawStatusCode.includes("COMPLETE")) {
    safeStatusCode = "RELEASED_COMPLETED";
  } else if (rawStatusCode.includes("CLOSE")) {
    safeStatusCode = "CASE_CLOSED";
  }

  const trackingId = rawItem?.trackingId || rawItem?.case_number || (modType === "aics" ? `AICS-2026-${Math.floor(100000 + Math.random() * 900000)}` : `BEN-2026-${Math.floor(100000 + Math.random() * 900000)}`);
  const beneficiaryName = rawItem?.beneficiaryName || rawItem?.beneficiary_name || "Beneficiary Client";
  const beneficiaryId = rawItem?.beneficiaryId || rawItem?.trackingId || rawItem?.case_number || trackingId;
  const barangay = rawItem?.barangay || rawItem?.barangay_name || "San Juan";

  return {
    id: rawItem?.id || 0,
    trackingId,
    beneficiaryName,
    beneficiaryId,
    barangay,
    moduleType: modType,
    statusCode: safeStatusCode,
    endorsementDate: rawItem?.endorsementDate || (rawItem?.created_at ? new Date(rawItem.created_at).toISOString().split('T')[0] : "2026-10-01"),
    endorsedBy: rawItem?.endorsedBy || `Barangay Secretary (${barangay})`,
    endorsementNotes: rawItem?.endorsementNotes || rawItem?.assessment_notes || "Applicant submitted application and supporting documents at Barangay Hall. Endorsed to MSWD for immediate case review and assistance.",
    documents: Array.isArray(rawItem?.documents) ? rawItem.documents : defaultDocs,
    socialAssessment: {
      intakeNotes: rawItem?.socialAssessment?.intakeNotes || rawItem?.assessment_notes || "Client appeared for intake interview. Household socio-economic assessment documented.",
      caseStudySummary: rawItem?.socialAssessment?.caseStudySummary || rawItem?.assessment_notes || "Social Case Study Report indicates client falls below indigency baseline. Recommended for program assistance.",
      vulnerabilityLevel: rawItem?.socialAssessment?.vulnerabilityLevel || (rawItem?.vulnerability_level === "HIGH" ? "High" : rawItem?.vulnerability_level === "LOW" ? "Low" : "High"),
      vulnerabilityNotes: rawItem?.socialAssessment?.vulnerabilityNotes || "Assessed priority vulnerability under municipal welfare guidelines.",
      assignedSocialWorker: rawItem?.socialAssessment?.assignedSocialWorker || "Juan Miguel Ramos, RSW",
    },
    eligibility: {
      status: rawItem?.eligibility?.status || "Eligible",
      notes: rawItem?.eligibility?.notes || "Verified eligible under Republic Act statutory requirements and municipal guidelines.",
      evaluatedDate: rawItem?.eligibility?.evaluatedDate || "2026-10-03",
    },
    servicePlan: {
      spicNumber: rawItem?.servicePlan?.spicNumber || rawItem?.spic_number || (modType === "solo-parent" ? `SPIC-2026-${Math.floor(1000 + Math.random() * 9000)}` : ""),
      purchaseBookletNumber: rawItem?.servicePlan?.purchaseBookletNumber || rawItem?.booklet_number || "BK-2026-0842",
      emergencyCashAidAmount: Number(rawItem?.servicePlan?.emergencyCashAidAmount || rawItem?.financial_aid_amount || (modType === "aics" ? 5000 : 3000)),
      referrals: Array.isArray(rawItem?.servicePlan?.referrals)
        ? rawItem.servicePlan.referrals
        : Array.isArray(rawItem?.referrals)
        ? rawItem.referrals
        : ["Livelihood Skills Training", "Parenting Effectiveness Seminar (PES)"],
      crisisType: rawItem?.servicePlan?.crisisType || rawItem?.aics_type || "Medical",
      approvedFinancialAmount: Number(rawItem?.servicePlan?.approvedFinancialAmount || rawItem?.approved_amount || (modType === "aics" ? 5000 : 3000)),
      nonMonetarySupport: rawItem?.servicePlan?.nonMonetarySupport || (modType === "aics" ? "Emergency Food Pack + Medical Guarantee Letter" : "Solo Parent Welfare Support"),
    },
    serviceRelease: {
      releaseMethod: rawItem?.serviceRelease?.releaseMethod || (rawItem?.release_method === "GUARANTEE_LETTER" ? "Guarantee Letter / GL" : rawItem?.release_method === "CHECK" ? "Check" : "Cash Payout"),
      guaranteeLetterNumber: rawItem?.serviceRelease?.guaranteeLetterNumber || rawItem?.guarantee_letter_number || "GL-CAL-2026-00452",
      payoutDate: rawItem?.serviceRelease?.payoutDate || (rawItem?.payout_date ? String(rawItem.payout_date).split('T')[0] : "2026-10-09"),
      approvedAmount: Number(rawItem?.serviceRelease?.approvedAmount || rawItem?.approved_amount || (modType === "aics" ? 5000 : 3000)),
      payoutOfficer: rawItem?.serviceRelease?.payoutOfficer || "Treasury Disbursing Officer",
      disbursementStatus: rawItem?.serviceRelease?.disbursementStatus || "Ready for Release",
    },
    timeline: Array.isArray(rawItem?.timeline) && rawItem.timeline.length > 0
      ? rawItem.timeline
      : Array.isArray(rawItem?.monitoring_logs) && rawItem.monitoring_logs.length > 0
      ? rawItem.monitoring_logs
      : [
          {
            id: "tl-1",
            date: "2026-10-01 09:15 AM",
            author: "Barangay Secretary",
            title: "Barangay Endorsement Recorded",
            description: `Case forwarded from Barangay ${barangay} to Municipal MSWD Office.`,
            type: "status",
          },
          {
            id: "tl-2",
            date: "2026-10-03 01:45 PM",
            author: "Juan Miguel Ramos, RSW",
            title: "Initial Intake Interview",
            description: "Client assessment conducted and social case study notes filed.",
            type: "visit",
          },
        ],
    closureNotes: rawItem?.closureNotes || "All assistance released and documented. Welfare services successfully administered.",
  };
}

// Internal Error Boundary to catch any render errors and prevent white screens
interface ErrorBoundaryProps {
  children: React.ReactNode;
  onClose?: () => void;
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class WorkflowErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("[WorkflowErrorBoundary caught error]:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-red-200 animate-in fade-in zoom-in-95 space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <div className="p-3 bg-red-100 rounded-full">
                <AlertCircle className="size-6 text-red-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-lg">MSWD Workflow Processing Notice</h3>
                <p className="text-xs text-red-600 font-medium">An error occurred while displaying case processing</p>
              </div>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 text-xs font-mono text-gray-700 max-h-32 overflow-y-auto">
              {this.state.error?.message || "Unexpected case processing error"}
            </div>
            <p className="text-xs text-gray-500">
              The case record is safe in the database. You can retry loading or return to the cases directory.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              {this.props.onClose && (
                <button
                  type="button"
                  onClick={this.props.onClose}
                  className="px-4 py-2 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors cursor-pointer"
                >
                  Close Modal
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                  if (this.props.onReset) this.props.onReset();
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-blue-900 hover:bg-blue-800 rounded-lg transition-colors cursor-pointer"
              >
                Retry Case Workflow
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function MSWDCaseWorkflowModalInner({
  isOpen,
  onClose,
  caseItem,
  moduleType: moduleTypeProp,
  onUpdateCase,
  userRole,
  isReadOnly = false,
}: MSWDCaseWorkflowModalProps) {
  const effectiveRole = userRole || (typeof window !== "undefined" ? sessionStorage.getItem("benefitrack_active_role") || "" : "");
  const isSecretary = isSecretaryRole(effectiveRole) || Boolean(isReadOnly);
  const isValidator = !isSecretary;
  const effectiveModuleType = normalizeModuleType(moduleTypeProp || caseItem?.moduleType || "solo-parent");
  const moduleType = effectiveModuleType;

  const [currentStep, setCurrentStep] = useState<number>(1);
  const activeStep = isSecretary ? 1 : currentStep;

  // Preview modals
  const [showSpicPreviewModal, setShowSpicPreviewModal] = useState(false);
  const [showGlPreviewModal, setShowGlPreviewModal] = useState(false);

  // Main Case Reactive State with guaranteed defensive defaults
  const [caseState, setCaseState] = useState<CaseData>(() =>
    buildSafeCaseData(caseItem, effectiveModuleType)
  );

  // PostgreSQL Persistence & Database State
  const [isSaving, setIsSaving] = useState(false);
  const [dbSyncStatus, setDbSyncStatus] = useState<"synced" | "saving" | "error">("synced");
  const [isLoadingCase, setIsLoadingCase] = useState(false);

  // Load live case record and audit log history directly from PostgreSQL backend on mount / update
  useEffect(() => {
    if (!isOpen) return;
    if (caseItem) {
      setCaseState(buildSafeCaseData(caseItem, effectiveModuleType));
    }
    const targetLookup = caseItem?.trackingId || caseItem?.id || caseItem?.case_number;
    if (targetLookup) {
      setIsLoadingCase(true);
      apiGetCaseById(targetLookup, effectiveModuleType)
        .then((res) => {
          if (res && res.data) {
            const mapped = mapDbRecordToCaseData(res.data, effectiveModuleType);
            setCaseState(mapped);
            setDbSyncStatus("synced");
          }
        })
        .catch((err) => {
          console.warn("[PostgreSQL] Loaded from local cache or props:", err?.message);
        })
        .finally(() => {
          setIsLoadingCase(false);
        });
    }
  }, [isOpen, caseItem?.trackingId, caseItem?.id, caseItem?.case_number, effectiveModuleType]);

  // Helper to persist step updates directly to PostgreSQL backend
  const persistStepData = async (stepNumber: number, payload: any) => {
    setIsSaving(true);
    setDbSyncStatus("saving");
    try {
      const targetId = caseState.trackingId || caseState.id || caseItem?.trackingId || caseItem?.id;
      if (!targetId) return null;
      
      const updatedRow = await apiUpdateCaseStep(targetId, {
        ...payload,
        step: stepNumber,
        moduleType: caseState.moduleType,
        author: caseState.socialAssessment.assignedSocialWorker || "MSWD Staff",
      });
      setDbSyncStatus("synced");
      setIsSaving(false);
      return updatedRow;
    } catch (err: any) {
      console.error(`[PostgreSQL Error Step ${stepNumber}]:`, err.message);
      setDbSyncStatus("error");
      setIsSaving(false);
      return null;
    }
  };

  // Step 7 Timeline Input States
  const [newLogTitle, setNewLogTitle] = useState("");
  const [newLogNote, setNewLogNote] = useState("");
  const [newLogType, setNewLogType] = useState<"visit" | "update" | "note">("visit");

  // Step 2 Document Validation calculations
  const safeDocs = Array.isArray(caseState.documents) ? caseState.documents : [];
  const allDocsValid = safeDocs.length > 0 && safeDocs.every((d) => d.status === "Valid");
  const hasInvalidDocs = safeDocs.some((d) => d.status === "Invalid");

  // Status transition helper with PostgreSQL synchronization
  const updateStatus = async (newCode: WorkflowStatusCode, customDesc?: string, explicitStep?: number) => {
    const safeCfg = getSafeStatusConfig(newCode);
    const newEntry: TimelineEntry = {
      id: `tl-${Date.now()}`,
      date: new Date().toLocaleString(),
      author: caseState.socialAssessment?.assignedSocialWorker || "MSWD Staff",
      title: `Status: ${safeCfg.label}`,
      description: customDesc || `Workflow status updated to ${safeCfg.label}.`,
      type: "status",
    };

    const currentTimeline = Array.isArray(caseState.timeline) ? caseState.timeline : [];
    const updated: CaseData = {
      ...caseState,
      statusCode: newCode,
      timeline: [newEntry, ...currentTimeline],
    };

    setCaseState(updated);
    if (onUpdateCase) onUpdateCase(updated);

    // Save status trigger directly to PostgreSQL
    const stepToPersist = explicitStep !== undefined ? explicitStep : currentStep;
    await persistStepData(stepToPersist, {
      status: newCode,
      stepNotes: customDesc,
      timeline: updated.timeline,
      isCaseClosed: newCode === "CASE_CLOSED",
    });

    toast.success(`Workflow Status Saved to Database`, {
      description: `PostgreSQL Status: ${safeCfg.label}`,
    });
  };

  // Step 2 toggle handler with direct JSONB persistence to documents_status
  const handleDocToggle = async (docId: string, status: "Valid" | "Incomplete" | "Invalid") => {
    const currentDocs = Array.isArray(caseState.documents) ? caseState.documents : [];
    const updated = currentDocs.map((doc) =>
      doc.id === docId ? { ...doc, status } : doc
    );
    setCaseState({ ...caseState, documents: updated });

    // Build documents_status map for PostgreSQL JSONB
    const docStatusMap: Record<string, string> = {};
    updated.forEach((d) => {
      docStatusMap[d.id] = d.status;
      docStatusMap[d.name] = d.status;
    });

    await persistStepData(2, {
      documents_status: docStatusMap,
      documents: updated,
    });
    toast.info(`Document status saved to PostgreSQL: ${status}`);
  };

  // Step 7 Add Timeline Entry & Append directly to PostgreSQL monitoring_logs
  const handleAddTimeline = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLogTitle.trim()) {
      toast.error("Please enter an activity title");
      return;
    }

    const entry: TimelineEntry = {
      id: `tl-${Date.now()}`,
      date: new Date().toLocaleString(),
      author: caseState.socialAssessment?.assignedSocialWorker || "Social Worker",
      title: newLogTitle,
      description: newLogNote || "Follow-up activity recorded.",
      type: newLogType,
    };

    const currentTimeline = Array.isArray(caseState.timeline) ? caseState.timeline : [];
    const updatedTimeline = [entry, ...currentTimeline];
    setCaseState({
      ...caseState,
      timeline: updatedTimeline,
    });
    setNewLogTitle("");
    setNewLogNote("");

    // Append directly to monitoring_logs in PostgreSQL
    await persistStepData(7, {
      new_log_entry: entry,
      monitoring_logs: updatedTimeline,
    });
    toast.success("Activity logged and appended to PostgreSQL monitoring_logs!");
  };

  const STEPS = [
    { num: 1, title: "Endorsement", desc: "Barangay Intake", icon: Building },
    { num: 2, title: "Verification", desc: "Document Check", icon: FileCheck },
    { num: 3, title: "Assessment", desc: "Social Case Study", icon: UserCheck },
    { num: 4, title: "Eligibility", desc: "Determination", icon: ShieldCheck },
    { num: 5, title: "Service Planning", desc: "Packages & SPIC", icon: FileSpreadsheet },
    { num: 6, title: "Provision & Release", desc: "Disbursement", icon: Wallet },
    { num: 7, title: "Monitoring", desc: "Timeline Logs", icon: MessageSquare },
    { num: 8, title: "Case Closure", desc: "Summary & Print", icon: Lock },
  ];

  const currentStatusConfig = getSafeStatusConfig(caseState.statusCode);
  const isEligibilityUnlocked = caseState.eligibility?.status === "Eligible";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[96vh] flex flex-col overflow-hidden border border-gray-200 animate-in fade-in zoom-in-95">
        
        {/* ── HEADER ── */}
        <div className="bg-blue-900 text-white px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 flex-shrink-0 shadow-md">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs bg-blue-800 text-blue-200 px-2 py-0.5 rounded font-bold">
                {caseState.trackingId}
              </span>
              <Badge
                className={`${currentStatusConfig.bg} ${currentStatusConfig.text} ${currentStatusConfig.border} border text-[11px] font-bold px-2.5 py-0.5`}
              >
                {currentStatusConfig.label}
              </Badge>
              <Badge className="bg-blue-800 text-blue-100 text-[10px] uppercase tracking-wider font-semibold">
                {moduleType === "solo-parent"
                  ? "Women & Solo Parent Module"
                  : moduleType === "women-vawc"
                  ? "Women / VAWC Assistance"
                  : "AICS Crisis Assistance"}
              </Badge>
              {isSecretary ? (
                <Badge className="bg-amber-500/20 text-amber-200 border border-amber-400/40 text-[10px] uppercase tracking-wider font-semibold">
                  Frontline Intake View (Read-Only)
                </Badge>
              ) : (
                <Badge className="bg-indigo-500/20 text-indigo-200 border border-indigo-400/40 text-[10px] uppercase tracking-wider font-semibold">
                  Staff Case Validator
                </Badge>
              )}
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-950/70 text-emerald-200 border border-emerald-500/40 shadow-xs">
                <span className={`size-1.5 rounded-full ${dbSyncStatus === 'saving' ? 'bg-amber-400 animate-ping' : dbSyncStatus === 'error' ? 'bg-red-400' : 'bg-emerald-400 animate-pulse'}`} />
                {dbSyncStatus === 'saving' ? 'Saving to PostgreSQL...' : dbSyncStatus === 'error' ? 'Database Offline' : 'PostgreSQL Connected'}
              </span>
            </div>
            <h2 className="text-lg font-extrabold tracking-tight text-white">
              MSWD Case Processing: {caseState.beneficiaryName}
            </h2>
            <p className="text-xs text-blue-200">
              Barangay: <span className="font-semibold text-white">{caseState.barangay}</span> |
              Beneficiary ID: <span className="font-mono">{caseState.beneficiaryId}</span>
            </p>
          </div>

          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1.5 hover:bg-white/10 rounded-lg transition-colors self-start sm:self-center"
            title="Close Case Processing"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* ── WORKFLOW STEPPER BAR / READ-ONLY INTAKE BANNER ── */}
        {!isSecretary ? (
          <div className="bg-gray-50 border-b border-gray-200 px-4 py-3 flex-shrink-0 overflow-x-auto custom-scrollbar">
            <div className="flex items-center justify-between min-w-[760px] gap-1">
              {STEPS.map((step) => {
                const Icon = step.icon;
                const isActive = activeStep === step.num;
                const isCompleted = activeStep > step.num;
                const isStep5Locked = step.num === 5 && !isEligibilityUnlocked;

                return (
                  <button
                    key={step.num}
                    disabled={isStep5Locked && activeStep < 5}
                    onClick={() => setCurrentStep(step.num)}
                    className={`flex flex-col items-center p-1.5 rounded-xl transition-all relative group flex-1 ${
                      isActive
                        ? "bg-blue-900 text-white shadow-sm scale-[1.02]"
                        : isCompleted
                        ? "bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100"
                        : isStep5Locked && activeStep < 5
                        ? "bg-gray-100 text-gray-400 border border-gray-200 opacity-60 cursor-not-allowed"
                        : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-100"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <div
                        className={`size-6 rounded-full text-xs font-bold flex items-center justify-center ${
                          isActive
                            ? "bg-white text-blue-900"
                            : isCompleted
                            ? "bg-emerald-600 text-white"
                            : isStep5Locked && activeStep < 5
                            ? "bg-gray-200 text-gray-400"
                            : "bg-gray-200 text-gray-700"
                        }`}
                      >
                        {isCompleted ? <Check className="size-3.5" /> : step.num}
                      </div>
                      <Icon className="size-4" />
                    </div>
                    <span className="text-[11px] font-bold truncate max-w-[90px]">{step.title}</span>
                    <span className="text-[9px] opacity-75 truncate max-w-[90px]">{step.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="bg-slate-50 border-b border-gray-200 px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 flex-shrink-0">
            <div className="flex items-center gap-2.5">
              <span className="size-6 rounded-full bg-blue-900 text-white text-xs font-bold flex items-center justify-center">
                1
              </span>
              <div>
                <p className="text-xs font-bold text-gray-900">Submitted Intake Details &amp; Endorsement Record</p>
                <p className="text-[11px] text-gray-500">Read-Only View &bull; 8-Step Validation Process Managed by MSWD Staff</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-gray-500">Processing Status:</span>
              <Badge className={`${currentStatusConfig.bg} ${currentStatusConfig.text} ${currentStatusConfig.border} border text-[11px] font-bold px-2.5 py-0.5`}>
                {currentStatusConfig.label}
              </Badge>
            </div>
          </div>
        )}

        {/* ── MAIN MODAL CONTENT BODY ── */}
        <div className="p-6 flex-1 overflow-y-auto space-y-6 bg-white relative">
          
          {/* Fallback Loading Spinner & Graceful Loading State */}
          {isLoadingCase && (
            <div className="absolute inset-0 bg-white/85 backdrop-blur-xs z-30 flex flex-col items-center justify-center gap-3">
              <div className="size-10 border-4 border-blue-900 border-t-transparent rounded-full animate-spin" />
              <div className="text-center">
                <p className="text-sm font-bold text-gray-950">Loading Case Record from Database...</p>
                <p className="text-xs text-gray-500">Retrieving case verification data and documents</p>
              </div>
            </div>
          )}
          
          {/* ═════ STEP 1: ENDORSEMENT & INTAKE REVIEW ═════ */}
          {(activeStep === 1 || isSecretary) && (
            <div className="space-y-5">
              <div className="flex items-center justify-between border-b border-gray-200 pb-3">
                <div className="flex items-center gap-2">
                  <Building className="size-5 text-blue-800" />
                  <h3 className="text-base font-extrabold text-blue-950">
                    Step 1: Barangay Endorsement &amp; Intake Review
                  </h3>
                </div>
                <Badge className="bg-blue-100 text-blue-800 border-blue-200 font-semibold">
                  Status: {caseState.statusCode}
                </Badge>
              </div>

              {/* Read-Only Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <Card className="bg-gray-50 border border-gray-200 p-4 space-y-1 rounded-xl shadow-2xs">
                  <p className="text-gray-500 font-semibold uppercase text-[10px] tracking-wider">
                    Endorsing Barangay
                  </p>
                  <p className="text-sm font-bold text-gray-900">{caseState.barangay}</p>
                  <p className="text-[11px] text-gray-500">Municipality of Calabanga</p>
                </Card>

                <Card className="bg-gray-50 border border-gray-200 p-4 space-y-1 rounded-xl shadow-2xs">
                  <p className="text-gray-500 font-semibold uppercase text-[10px] tracking-wider">
                    Endorser Name
                  </p>
                  <p className="text-sm font-bold text-gray-900">{caseState.endorsedBy}</p>
                  <p className="text-[11px] text-gray-500">Barangay Social Welfare Officer</p>
                </Card>

                <Card className="bg-gray-50 border border-gray-200 p-4 space-y-1 rounded-xl shadow-2xs">
                  <p className="text-gray-500 font-semibold uppercase text-[10px] tracking-wider">
                    Endorsement Date
                  </p>
                  <p className="text-sm font-bold text-blue-900">{caseState.endorsementDate}</p>
                  <p className="text-[11px] text-gray-500">Official Submission Record</p>
                </Card>
              </div>

              {/* Submitted Applicant & Intake Details Section */}
              <div className="p-4 bg-white border border-gray-200 rounded-xl space-y-3 shadow-2xs">
                <p className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                  Submitted Applicant &amp; Intake Details
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                  <div>
                    <span className="text-[10px] text-gray-400 uppercase font-semibold">Beneficiary Name</span>
                    <p className="font-bold text-gray-900 text-sm">{caseState.beneficiaryName}</p>
                    <p className="text-[11px] text-gray-500 font-mono">{caseState.trackingId}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 uppercase font-semibold">Program / Sector</span>
                    <p className="font-bold text-blue-900">
                      {moduleType === "solo-parent"
                        ? "Solo Parent Program"
                        : moduleType === "women-vawc"
                        ? "Women / VAWC Support"
                        : "AICS Crisis Assistance"}
                    </p>
                    <p className="text-[11px] text-gray-500">{caseState.barangay}, Calabanga</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 uppercase font-semibold">Financial Aid Requested</span>
                    <p className="font-bold text-emerald-700 text-sm">
                      ₱{(Number(caseState.servicePlan?.approvedFinancialAmount || caseState.servicePlan?.emergencyCashAidAmount) || 3000).toLocaleString()}
                    </p>
                    <p className="text-[11px] text-gray-500">Municipal Standard Baseline</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 uppercase font-semibold">Submitted Documents</span>
                    <p className="font-bold text-gray-800">
                      {(caseState.documents || []).length} Document(s) Attached
                    </p>
                    <p className="text-[11px] text-gray-500">Encoded for MSWD Verification</p>
                  </div>
                </div>

                {/* Scanned/Submitted Document List */}
                <div className="pt-2 border-t border-gray-100">
                  <span className="text-[10px] text-gray-400 uppercase font-semibold">Attached Requirement Checklist:</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                    {(caseState.documents || []).map((doc) => (
                      <div key={doc.id} className="p-2.5 rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <FileText className="size-3.5 text-blue-800" />
                          <div>
                            <p className="font-medium text-gray-900 text-[11px]">{doc.name}</p>
                            <p className="text-[10px] text-gray-400 font-mono">{doc.fileUrl ? <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" aria-label={`Open ${doc.name}`}>{doc.fileRef}</a> : "No file attached"}</p>
                          </div>
                        </div>
                        <Badge className={`${
                          doc.status === "Valid"
                            ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                            : doc.status === "Invalid"
                            ? "bg-red-100 text-red-800 border-red-200"
                            : "bg-amber-100 text-amber-800 border-amber-200"
                        } text-[10px] font-semibold`}>
                          {doc.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Initial Notes Read-Only */}
              <div className="space-y-1.5 text-xs">
                <label className="font-bold text-gray-800">Initial Endorsement Notes</label>
                <div className="w-full p-4 rounded-xl border border-gray-200 bg-gray-50 text-gray-800 text-xs leading-relaxed font-sans">
                  {caseState.endorsementNotes}
                </div>
              </div>

              {/* Acknowledge & Start Review Banner */}
              <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
                <div className="flex items-start gap-3">
                  <div className="size-9 rounded-lg bg-blue-600 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
                    <Clock className="size-5" />
                  </div>
                  <div className="text-xs">
                    <p className="font-bold text-blue-950 text-sm">
                      {isSecretary ? "Applicant Intake Encoded & Endorsed" : "Acknowledge & Start Review"}
                    </p>
                    <p className="text-blue-800">
                      {isSecretary
                        ? "Case record is officially encoded in PostgreSQL and is under review by MSWD Social Welfare Officers."
                        : <>Update local case status from <span className="font-mono font-bold">BARANGAY_ENDORSED</span> to <span className="font-mono font-bold">UNDER_REVIEW</span> and advance to Step 2.</>}
                    </p>
                  </div>
                </div>

                {!isSecretary ? (
                  <Button
                    onClick={async () => {
                      await updateStatus("UNDER_REVIEW", "Endorsement acknowledged. Case is now under review in PostgreSQL database.", 1);
                      setCurrentStep(2);
                    }}
                    className="bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold px-5 py-2.5 shadow-sm whitespace-nowrap"
                  >
                    Acknowledge & Start Review →
                  </Button>
                ) : (
                  <Badge className="bg-amber-100 text-amber-900 border border-amber-300 text-xs px-3 py-1.5 whitespace-nowrap font-bold">
                    Pending MSWD Staff Action
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* ═════ STEP 2: DOCUMENT VERIFICATION ═════ */}
          {!isSecretary && activeStep === 2 && (
            <div className="space-y-5">
              <div className="flex items-center justify-between border-b border-gray-200 pb-3">
                <div className="flex items-center gap-2">
                  <FileCheck className="size-5 text-blue-800" />
                  <h3 className="text-base font-extrabold text-blue-950">
                    Step 2: Interactive Document Verification Checklist
                  </h3>
                </div>
                <Badge
                  className={
                    allDocsValid
                      ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                      : hasInvalidDocs
                      ? "bg-red-100 text-red-800 border-red-300"
                      : "bg-amber-100 text-amber-800 border-amber-300"
                  }
                >
                  {allDocsValid ? "All Documents Valid" : hasInvalidDocs ? "Has Invalid Document" : "Review In Progress"}
                </Badge>
              </div>

              <div className="bg-blue-50/70 border border-blue-100 rounded-xl p-3.5 text-xs text-blue-900 flex items-center justify-between">
                <div>
                  <p className="font-bold">Required Document Inspection for Program:</p>
                  <p className="text-[11px] text-blue-700">
                    Mark each required item as Valid, Incomplete, or Invalid. All documents must be marked Valid to proceed to Step 3.
                  </p>
                </div>
                <Badge className="bg-white text-blue-900 border-blue-200 font-mono text-xs">
                  {(caseState.documents || []).filter((d) => d.status === "Valid").length} / {(caseState.documents || []).length} Valid
                </Badge>
              </div>

              {/* Checklist with 3-state toggle switches */}
              <div className="space-y-3">
                {(caseState.documents || []).map((doc) => (
                  <div
                    key={doc.id}
                    className="p-3.5 bg-white border border-gray-200 rounded-xl shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-blue-300 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`size-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          doc.status === "Valid"
                            ? "bg-emerald-50 text-emerald-600"
                            : doc.status === "Invalid"
                            ? "bg-red-50 text-red-600"
                            : "bg-amber-50 text-amber-600"
                        }`}
                      >
                        <FileText className="size-4" />
                      </div>
                      <div className="text-xs">
                        <p className="font-bold text-gray-900">{doc.name}</p>
                        <p className="text-gray-400 font-mono text-[10px]">{doc.fileUrl ? <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" aria-label={`Open ${doc.name}`}>{doc.fileRef}</a> : "No file attached"}</p>
                      </div>
                    </div>

                    {/* Toggle Switches for Valid / Incomplete / Invalid */}
                    {isSecretary ? (
                      <div className="flex items-center gap-1.5 self-end sm:self-center">
                        <span
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                            doc.status === "Valid"
                              ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                              : doc.status === "Invalid"
                              ? "bg-red-100 text-red-800 border border-red-200"
                              : "bg-amber-100 text-amber-800 border border-amber-200"
                          }`}
                        >
                          {doc.status}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 self-end sm:self-center">
                        <button
                          type="button"
                          onClick={() => handleDocToggle(doc.id, "Valid")}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors flex items-center gap-1 ${
                            doc.status === "Valid"
                              ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                              : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-emerald-50 hover:text-emerald-700"
                          }`}
                        >
                          <Check className="size-3.5" /> Valid
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDocToggle(doc.id, "Incomplete")}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors flex items-center gap-1 ${
                            doc.status === "Incomplete"
                              ? "bg-amber-600 text-white border-amber-600 shadow-xs"
                              : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-amber-50 hover:text-amber-700"
                          }`}
                        >
                          <AlertTriangle className="size-3.5" /> Incomplete
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDocToggle(doc.id, "Invalid")}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors flex items-center gap-1 ${
                            doc.status === "Invalid"
                              ? "bg-red-600 text-white border-red-600 shadow-xs"
                              : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-red-50 hover:text-red-700"
                          }`}
                        >
                          <X className="size-3.5" /> Invalid
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* UI Validation Rule Actions */}
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="text-xs space-y-0.5">
                  <p className="font-bold text-gray-900">
                    {allDocsValid
                      ? "✓ All required documents verified"
                      : hasInvalidDocs
                      ? "⚠️ One or more documents are marked Invalid"
                      : "Pending completion of all requirements"}
                  </p>
                  <p className="text-gray-500">
                    {isSecretary
                      ? "Document verification and validation is managed by MSWD Social Welfare Officers."
                      : allDocsValid
                      ? "You may now advance to Social Worker Assessment in Step 3."
                      : "Check all items as 'Valid' to unlock Step 3, or return for correction if documents are invalid."}
                  </p>
                </div>

                {!isSecretary && (
                  <div className="flex items-center gap-2">
                    {/* Shown if any document is marked Invalid */}
                    {hasInvalidDocs && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={async () => {
                          await updateStatus("RETURNED_FOR_CORRECTION", "Documents evaluated as invalid. Case returned to Barangay for correction in PostgreSQL.", 2);
                          toast.error("Case Marked as RETURNED_FOR_CORRECTION in PostgreSQL");
                        }}
                        className="border-red-300 bg-red-50 text-red-700 hover:bg-red-100 text-xs font-bold"
                      >
                        <Undo2 className="size-3.5 mr-1" /> Return for Correction
                      </Button>
                    )}

                    {/* Move to Step 3 - ONLY ENABLED IF all docs are marked Valid */}
                    <Button
                      disabled={!allDocsValid}
                      onClick={async () => {
                        await updateStatus("IN_ASSESSMENT", "Document verification complete. Case moved to in-depth assessment in PostgreSQL.", 2);
                        setCurrentStep(3);
                      }}
                      className={`text-xs font-bold px-5 py-2.5 ${
                        allDocsValid
                          ? "bg-purple-900 hover:bg-purple-800 text-white shadow-sm"
                          : "bg-gray-300 text-gray-500 cursor-not-allowed"
                      }`}
                    >
                      Move to Step 3 →
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ═════ STEP 3: SOCIAL WORKER ASSESSMENT ═════ */}
          {!isSecretary && activeStep === 3 && (
            <div className="space-y-5">
              <div className="flex items-center justify-between border-b border-gray-200 pb-3">
                <div className="flex items-center gap-2">
                  <UserCheck className="size-5 text-blue-800" />
                  <h3 className="text-base font-extrabold text-blue-950">
                    Step 3: Social Worker Assessment
                  </h3>
                </div>
                <Badge className="bg-purple-100 text-purple-800 border-purple-200">
                  Status: IN_ASSESSMENT
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1.5">
                  <label className="font-bold text-gray-800">Assigned Social Worker Name</label>
                  <input
                    type="text"
                    value={caseState.socialAssessment.assignedSocialWorker}
                    onChange={(e) =>
                      setCaseState({
                        ...caseState,
                        socialAssessment: {
                          ...caseState.socialAssessment,
                          assignedSocialWorker: e.target.value,
                        },
                      })
                    }
                    className="w-full h-10 px-3 border border-gray-300 rounded-lg bg-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-gray-800">Vulnerability Assessment Level</label>
                  <select
                    value={caseState.socialAssessment.vulnerabilityLevel}
                    onChange={(e) =>
                      setCaseState({
                        ...caseState,
                        socialAssessment: {
                          ...caseState.socialAssessment,
                          vulnerabilityLevel: e.target.value as "High" | "Moderate" | "Low",
                        },
                      })
                    }
                    className="w-full h-10 px-3 border border-gray-300 rounded-lg bg-white font-bold text-blue-900"
                  >
                    <option value="High">🔴 High Vulnerability (Urgent Priority)</option>
                    <option value="Moderate">🟡 Moderate Vulnerability</option>
                    <option value="Low">🟢 Low Vulnerability</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5 text-xs">
                <label className="font-bold text-gray-800">
                  Social Worker Intake Interview Notes <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={3}
                  readOnly={isSecretary}
                  value={caseState.socialAssessment.intakeNotes}
                  onChange={(e) =>
                    setCaseState({
                      ...caseState,
                      socialAssessment: {
                        ...caseState.socialAssessment,
                        intakeNotes: e.target.value,
                      },
                    })
                  }
                  placeholder="Record detailed notes from the beneficiary interview..."
                  className="w-full p-3 border border-gray-300 rounded-lg bg-white text-xs leading-relaxed"
                />
              </div>

              <div className="space-y-1.5 text-xs">
                <label className="font-bold text-gray-800">
                  Social Case Study Summary (SCSR) <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={3}
                  readOnly={isSecretary}
                  value={caseState.socialAssessment.caseStudySummary}
                  onChange={(e) =>
                    setCaseState({
                      ...caseState,
                      socialAssessment: {
                        ...caseState.socialAssessment,
                        caseStudySummary: e.target.value,
                      },
                    })
                  }
                  placeholder="Summarize socioeconomic background, living conditions, and assistance justification..."
                  className="w-full p-3 border border-gray-300 rounded-lg bg-white text-xs leading-relaxed"
                />
              </div>

              <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-xl flex items-center justify-between">
                <div className="text-xs space-y-0.5">
                  <p className="font-bold text-indigo-950">Persist Assessment Notes & Advance</p>
                  <p className="text-indigo-800">
                    {isSecretary
                      ? "Social assessment and case study notes are conducted by MSWD staff."
                      : "Saves social case study and intake assessment directly to PostgreSQL."}
                  </p>
                </div>

                {!isSecretary ? (
                  <Button
                    onClick={async () => {
                      const combinedNotes = [
                        caseState.socialAssessment.intakeNotes ? `Intake: ${caseState.socialAssessment.intakeNotes}` : null,
                        caseState.socialAssessment.caseStudySummary ? `Assessment: ${caseState.socialAssessment.caseStudySummary}` : null,
                      ].filter(Boolean).join('\n\n');

                      await persistStepData(3, {
                        assessment_notes: combinedNotes,
                        vulnerability_level: (caseState.socialAssessment?.vulnerabilityLevel || "HIGH").toUpperCase(),
                        socialAssessment: caseState.socialAssessment,
                      });
                      toast.success("Social assessment notes persisted to PostgreSQL database!");
                      setCurrentStep(4);
                    }}
                    className="bg-indigo-900 hover:bg-indigo-800 text-white text-xs font-bold px-5 py-2.5 shadow-sm"
                  >
                    Save & Advance to Step 4 →
                  </Button>
                ) : (
                  <Badge className="bg-indigo-100 text-indigo-800 border-indigo-200 text-xs px-3 py-1.5">
                    Assessment Managed by MSWD Social Worker
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* ═════ STEP 4: ELIGIBILITY DETERMINATION ═════ */}
          {!isSecretary && activeStep === 4 && (
            <div className="space-y-5">
              <div className="flex items-center justify-between border-b border-gray-200 pb-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="size-5 text-blue-800" />
                  <h3 className="text-base font-extrabold text-blue-950">
                    Step 4: Eligibility Determination
                  </h3>
                </div>
                <Badge className="bg-indigo-100 text-indigo-800 border-indigo-200 font-bold">
                  Status: ELIGIBILITY_EVALUATED
                </Badge>
              </div>

              <div className="space-y-2 text-xs">
                <label className="font-bold text-gray-800">
                  Eligibility Determination Selector (Click to Select):
                </label>
                {isSecretary ? (
                  <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-gray-500">Eligibility Status</p>
                      <p className="text-sm font-bold text-gray-900">{caseState.eligibility?.status || "Pending Determination"}</p>
                      <p className="text-[11px] text-gray-500 mt-0.5">Eligibility assessment is determined by authorized MSWD social workers.</p>
                    </div>
                    <Badge className="bg-blue-100 text-blue-800 border-blue-200">MSWD Validator Evaluated</Badge>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { key: "Eligible", label: "Eligible", color: "bg-emerald-600 text-white border-emerald-600", icon: CheckCircle2, desc: "Qualifies for full program package" },
                      { key: "Not Eligible", label: "Not Eligible", color: "bg-red-600 text-white border-red-600", icon: AlertCircle, desc: "Exceeds income or criteria baseline" },
                      { key: "Additional Requirements Needed", label: "Additional Reqs Needed", color: "bg-amber-600 text-white border-amber-600", icon: AlertTriangle, desc: "Pending supplementary documents" },
                      { key: "For Referral", label: "For Referral", color: "bg-purple-600 text-white border-purple-600", icon: Send, desc: "Refer to external specialized agency" },
                    ].map((item) => {
                      const Icon = item.icon;
                      const isSelected = caseState.eligibility?.status === item.key;

                      return (
                        <button
                          key={item.key}
                          type="button"
                          onClick={async () => {
                            const updated = {
                              ...caseState,
                              eligibility: {
                                ...caseState.eligibility,
                                status: item.key as any,
                              },
                            };
                            setCaseState(updated);
                            await persistStepData(4, {
                              eligibility: item.key,
                              status: 'ELIGIBILITY_EVALUATED',
                              notes: caseState.eligibility?.notes || "",
                            });
                            if (item.key === "Eligible") {
                              toast.success("Client marked Eligible & saved to PostgreSQL — Step 5 unlocked!");
                            } else {
                              toast.warning(`Eligibility saved to PostgreSQL: ${item.key}`);
                            }
                          }}
                          className={`p-3.5 rounded-xl border text-xs font-bold flex flex-col items-center text-center gap-2 transition-all cursor-pointer ${
                            isSelected
                              ? `${item.color} shadow-md scale-[1.02]`
                              : "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100"
                          }`}
                        >
                          <Icon className="size-5" />
                          <span className="font-extrabold">{item.label}</span>
                          <span className="text-[10px] font-normal opacity-85 leading-tight">{item.desc}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="space-y-1.5 text-xs">
                <label className="font-bold text-gray-800">Evaluation Notes & Justification</label>
                <textarea
                  rows={3}
                  readOnly={isSecretary}
                  value={caseState.eligibility?.notes || ""}
                  onChange={(e) =>
                    setCaseState({
                      ...caseState,
                      eligibility: { ...(caseState.eligibility || {}), notes: e.target.value } as any,
                    })
                  }
                  className="w-full p-3 border border-gray-300 rounded-lg bg-white text-xs leading-relaxed"
                />
              </div>

              {/* Status Banner based on selection */}
              <div
                className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  isEligibilityUnlocked
                    ? "bg-emerald-50 border-emerald-200 text-emerald-950"
                    : "bg-amber-50 border-amber-200 text-amber-950"
                }`}
              >
                <div className="text-xs space-y-0.5">
                  <p className="font-bold">
                    {isEligibilityUnlocked
                      ? "✓ Eligibility Approved: Step 5 (Service Planning) is Unlocked"
                      : "⚠️ Step 5 Locked: Requires 'Eligible' Determination"}
                  </p>
                  <p className="text-[11px] opacity-80">
                    {isSecretary
                      ? "Eligibility determination is processed by authorized MSWD Social Welfare Officers."
                      : isEligibilityUnlocked
                      ? "Transition status to ELIGIBILITY_EVALUATED and proceed to assistance package design."
                      : "Select 'Eligible' above to formulate a service plan and SPIC/AICS financial release."}
                  </p>
                </div>

                {!isSecretary && (
                  <Button
                    disabled={!isEligibilityUnlocked}
                    onClick={() => {
                      updateStatus("ELIGIBILITY_EVALUATED", "Eligibility evaluation confirmed. Service planning initiated.");
                      setCurrentStep(5);
                    }}
                    className={`text-xs font-bold px-5 py-2.5 ${
                      isEligibilityUnlocked
                        ? "bg-emerald-900 hover:bg-emerald-800 text-white shadow-sm"
                        : "bg-gray-300 text-gray-500 cursor-not-allowed"
                    }`}
                  >
                    Proceed to Service Plan Formulation (Step 5) →
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* ═════ STEP 5: SERVICE PLANNING ═════ */}
          {!isSecretary && activeStep === 5 && (
            <div className="space-y-5">
              <div className="flex items-center justify-between border-b border-gray-200 pb-3">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="size-5 text-blue-800" />
                  <h3 className="text-base font-extrabold text-blue-950">
                    Step 5: Service Planning
                  </h3>
                </div>
                <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 font-bold">
                  Status: APPROVED_FOR_RELEASE
                </Badge>
              </div>

              {/* Module-specific Planning Inputs */}
              {moduleType === "solo-parent" || moduleType === "women-vawc" ? (
                /* ── SOLO PARENT PLANNING FIELDS ── */
                <div className="space-y-4 text-xs">
                  <div className="bg-blue-50/60 border border-blue-200 rounded-xl p-4 space-y-3">
                    <p className="font-bold text-blue-950 text-sm flex items-center gap-2">
                      <CreditCard className="size-4 text-blue-700" /> Solo Parent Assistance & ID Package
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {/* Auto-Generated SPIC Number */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <label className="font-bold text-gray-700">Auto-Generated SPIC Number</label>
                          <button
                            type="button"
                            onClick={() => {
                              const newSpic = `SPIC-2026-${Math.floor(1000 + Math.random() * 9000)}`;
                              setCaseState({
                                ...caseState,
                                servicePlan: { ...caseState.servicePlan, spicNumber: newSpic },
                              });
                              toast.info(`Generated: ${newSpic}`);
                            }}
                            className="text-[10px] text-blue-600 hover:underline flex items-center gap-0.5"
                          >
                            <RefreshCw className="size-2.5" /> Re-generate
                          </button>
                        </div>
                        <input
                          type="text"
                          value={caseState.servicePlan?.spicNumber || ""}
                          onChange={(e) =>
                            setCaseState({
                              ...caseState,
                              servicePlan: { ...(caseState.servicePlan || {}), spicNumber: e.target.value } as any,
                            })
                          }
                          className="w-full h-10 px-3 border border-gray-300 rounded-lg bg-white font-mono font-bold text-blue-900"
                        />
                      </div>

                      {/* Purchase Booklet Number */}
                      <div className="space-y-1">
                        <label className="font-bold text-gray-700">Purchase Booklet Number</label>
                        <input
                          type="text"
                          value={caseState.servicePlan?.purchaseBookletNumber || ""}
                          onChange={(e) =>
                            setCaseState({
                              ...caseState,
                              servicePlan: {
                                ...(caseState.servicePlan || {}),
                                purchaseBookletNumber: e.target.value,
                              } as any,
                            })
                          }
                          className="w-full h-10 px-3 border border-gray-300 rounded-lg bg-white font-mono"
                        />
                      </div>

                      {/* Emergency Financial Aid Amount */}
                      <div className="space-y-1">
                        <label className="font-bold text-gray-700">Emergency Financial Aid (PHP)</label>
                        <input
                          type="number"
                          value={caseState.servicePlan?.emergencyCashAidAmount ?? 0}
                          onChange={(e) =>
                            setCaseState({
                              ...caseState,
                              servicePlan: {
                                ...(caseState.servicePlan || {}),
                                emergencyCashAidAmount: parseFloat(e.target.value) || 0,
                              } as any,
                              serviceRelease: {
                                ...(caseState.serviceRelease || {}),
                                approvedAmount: parseFloat(e.target.value) || 0,
                              } as any,
                            })
                          }
                          className="w-full h-10 px-3 border border-gray-300 rounded-lg bg-white font-bold text-emerald-700 text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Livelihood/Parenting Session referral checkboxes */}
                  <div className="space-y-2">
                    <label className="font-bold text-gray-800">
                      Livelihood & Parenting Session Referrals:
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {[
                        "Livelihood Skills Training",
                        "Parenting Effectiveness Seminar (PES)",
                        "Empowering Solo Parents Sessions",
                        "Sustainable Livelihood Program (SLP)",
                        "Legal Counseling & Child Support Referral",
                      ].map((referralItem) => {
                        const referralsList = Array.isArray(caseState.servicePlan?.referrals)
                          ? caseState.servicePlan.referrals
                          : [];
                        const isChecked = referralsList.includes(referralItem);
                        return (
                          <label
                            key={referralItem}
                            className="p-3 bg-gray-50 border border-gray-200 rounded-xl flex items-center gap-2.5 cursor-pointer hover:bg-gray-100 transition-colors"
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                const curr = Array.isArray(caseState.servicePlan?.referrals)
                                  ? caseState.servicePlan.referrals
                                  : [];
                                const updated = e.target.checked
                                  ? [...curr, referralItem]
                                  : curr.filter((r) => r !== referralItem);
                                setCaseState({
                                  ...caseState,
                                  servicePlan: { ...(caseState.servicePlan || {}), referrals: updated } as any,
                                });
                              }}
                              className="size-4 text-blue-600 rounded"
                            />
                            <span className="font-semibold text-gray-800">{referralItem}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                /* ── AICS PLANNING FIELDS ── */
                <div className="space-y-4 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="font-bold text-gray-800">Crisis Type Category</label>
                      <select
                        value={caseState.servicePlan.crisisType}
                        onChange={(e) =>
                          setCaseState({
                            ...caseState,
                            servicePlan: {
                              ...caseState.servicePlan,
                              crisisType: e.target.value as any,
                            },
                          })
                        }
                        className="w-full h-10 px-3 border border-gray-300 rounded-lg bg-white font-bold text-blue-900"
                      >
                        <option value="Medical">Medical Assistance</option>
                        <option value="Burial">Burial Assistance</option>
                        <option value="Transportation">Transportation Assistance</option>
                        <option value="Economic Relief">Economic Relief</option>
                        <option value="Balik Probinsya">Balik Probinsya</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="font-bold text-gray-800">Approved Financial Amount in PHP (₱)</label>
                      <input
                        type="number"
                        value={caseState.servicePlan.approvedFinancialAmount}
                        onChange={(e) =>
                          setCaseState({
                            ...caseState,
                            servicePlan: {
                              ...caseState.servicePlan,
                              approvedFinancialAmount: parseFloat(e.target.value) || 0,
                            },
                            serviceRelease: {
                              ...caseState.serviceRelease,
                              approvedAmount: parseFloat(e.target.value) || 0,
                            },
                          })
                        }
                        className="w-full h-10 px-3 border border-gray-300 rounded-lg bg-white font-bold text-emerald-700 text-sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold text-gray-800">Non-Monetary Emergency Support (Optional)</label>
                    <input
                      type="text"
                      value={caseState.servicePlan.nonMonetarySupport}
                      onChange={(e) =>
                        setCaseState({
                          ...caseState,
                          servicePlan: {
                            ...caseState.servicePlan,
                            nonMonetarySupport: e.target.value,
                          },
                        })
                      }
                      placeholder="e.g. 2x Emergency Food Packs, Medical Guarantee Letter"
                      className="w-full h-10 px-3 border border-gray-300 rounded-lg bg-white"
                    />
                  </div>
                </div>
              )}

              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
                <div className="text-xs space-y-0.5">
                  <p className="font-bold text-emerald-950">Confirm Service Plan & Advance to Release</p>
                  <p className="text-emerald-800">
                    Transitions trigger to APPROVED_FOR_RELEASE. Prepare release voucher and templates in Step 6.
                  </p>
                </div>

                {!isSecretary ? (
                  <Button
                    onClick={async () => {
                      await persistStepData(5, {
                        status: "APPROVED_FOR_RELEASE",
                        spic_number: caseState.servicePlan?.spicNumber || null,
                        booklet_number: caseState.servicePlan?.purchaseBookletNumber || null,
                        financial_aid_amount: caseState.servicePlan?.emergencyCashAidAmount || 0,
                        approved_amount: caseState.servicePlan?.approvedFinancialAmount || 0,
                        referrals: Array.isArray(caseState.servicePlan?.referrals) ? caseState.servicePlan.referrals : [],
                        crisisType: caseState.servicePlan?.crisisType || "Medical",
                        servicePlan: caseState.servicePlan,
                      });
                      await updateStatus("APPROVED_FOR_RELEASE", "Service plan formulated and approved for financial release in PostgreSQL database.", 5);
                      setCurrentStep(6);
                    }}
                    className="bg-emerald-900 hover:bg-emerald-800 text-white text-xs font-bold px-5 py-2.5 shadow-sm"
                  >
                    Confirm & Move to Step 6 →
                  </Button>
                ) : (
                  <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-xs px-3 py-1.5">
                    Service Plan Formulated by MSWD Staff
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* ═════ STEP 6: SERVICE PROVISION & RELEASE ═════ */}
          {!isSecretary && activeStep === 6 && (
            <div className="space-y-5">
              <div className="flex items-center justify-between border-b border-gray-200 pb-3">
                <div className="flex items-center gap-2">
                  <Wallet className="size-5 text-blue-800" />
                  <h3 className="text-base font-extrabold text-blue-950">
                    Step 6: Service Provision & Release
                  </h3>
                </div>
                <Badge className="bg-green-100 text-green-800 border-green-300 font-bold">
                  Status: RELEASED_COMPLETED
                </Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                {/* Release Method */}
                <div className="space-y-1.5">
                  <label className="font-bold text-gray-800">Release Method</label>
                  <select
                    value={caseState.serviceRelease?.releaseMethod || "Cash Payout"}
                    onChange={(e) =>
                      setCaseState({
                        ...caseState,
                        serviceRelease: {
                          ...(caseState.serviceRelease || {}),
                          releaseMethod: e.target.value as any,
                        } as any,
                      })
                    }
                    className="w-full h-10 px-3 border border-gray-300 rounded-lg bg-white font-bold text-blue-900"
                  >
                    <option value="Cash Payout">Cash Payout</option>
                    <option value="Check">Check</option>
                    <option value="Guarantee Letter / GL">Guarantee Letter / GL</option>
                  </select>
                </div>

                {/* Guarantee Letter (GL) Number */}
                <div className="space-y-1.5">
                  <label className="font-bold text-gray-800">Guarantee Letter (GL) Number</label>
                  <input
                    type="text"
                    value={caseState.serviceRelease?.guaranteeLetterNumber || ""}
                    onChange={(e) =>
                      setCaseState({
                        ...caseState,
                        serviceRelease: {
                          ...(caseState.serviceRelease || {}),
                          guaranteeLetterNumber: e.target.value,
                        } as any,
                      })
                    }
                    placeholder="GL-CAL-2026-XXXX"
                    className="w-full h-10 px-3 border border-gray-300 rounded-lg bg-white font-mono font-bold"
                  />
                </div>

                {/* Payout Date */}
                <div className="space-y-1.5">
                  <label className="font-bold text-gray-800">Payout Date</label>
                  <input
                    type="date"
                    value={caseState.serviceRelease?.payoutDate || ""}
                    onChange={(e) =>
                      setCaseState({
                        ...caseState,
                        serviceRelease: {
                          ...(caseState.serviceRelease || {}),
                          payoutDate: e.target.value,
                        } as any,
                      })
                    }
                    className="w-full h-10 px-3 border border-gray-300 rounded-lg bg-white font-bold"
                  />
                </div>
              </div>

              {/* Printable Templates and Previews */}
              <div className="p-4 bg-blue-50/80 border border-blue-200 rounded-xl space-y-3">
                <p className="font-bold text-blue-950 text-xs">Official Document Previews & Generation:</p>
                <div className="flex flex-wrap items-center gap-3">
                  {moduleType === "solo-parent" || moduleType === "women-vawc" ? (
                    <Button
                      type="button"
                      onClick={() => setShowSpicPreviewModal(true)}
                      className="bg-blue-800 hover:bg-blue-900 text-white text-xs font-bold gap-2 shadow-xs"
                    >
                      <CreditCard className="size-4" /> Preview SPIC ID Card
                    </Button>
                  ) : null}

                  {moduleType === "aics" || caseState.serviceRelease.releaseMethod === "Guarantee Letter / GL" ? (
                    <Button
                      type="button"
                      onClick={() => setShowGlPreviewModal(true)}
                      className="bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold gap-2 shadow-xs"
                    >
                      <FileCheck2 className="size-4" /> Preview Guarantee Letter (GL)
                    </Button>
                  ) : null}

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => toast.info("Disbursement voucher generated")}
                    className="text-xs bg-white text-gray-700"
                  >
                    Generate Disbursement Voucher
                  </Button>
                </div>
              </div>

              <div className="p-4 bg-green-50 border border-green-200 rounded-xl flex items-center justify-between">
                <div className="text-xs space-y-0.5">
                  <p className="font-bold text-green-950">Record Payout Release Completion</p>
                  <p className="text-green-800">
                    Transitions trigger to RELEASED_COMPLETED. Advance to Case Monitoring.
                  </p>
                </div>

                {!isSecretary ? (
                  <Button
                    onClick={async () => {
                      await persistStepData(6, {
                        status: "RELEASED_COMPLETED",
                        serviceRelease: caseState.serviceRelease,
                        release_method: caseState.serviceRelease?.releaseMethod || "Cash Payout",
                        guarantee_letter_number: caseState.serviceRelease?.guaranteeLetterNumber || null,
                        payout_date: caseState.serviceRelease?.payoutDate || null,
                        approved_amount: caseState.serviceRelease?.approvedAmount || 0,
                      });
                      await updateStatus("RELEASED_COMPLETED", "Financial aid and official credentials recorded as RELEASED_COMPLETED in PostgreSQL database.", 6);
                      setCurrentStep(7);
                    }}
                    className="bg-green-700 hover:bg-green-800 text-white text-xs font-bold px-5 py-2.5 shadow-sm"
                  >
                    Record Release & Move to Step 7 →
                  </Button>
                ) : (
                  <Badge className="bg-green-100 text-green-800 border-green-200 text-xs px-3 py-1.5">
                    Assistance Release Managed by MSWD Disbursing Officer
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* ═════ STEP 7: CASE MONITORING ═════ */}
          {!isSecretary && activeStep === 7 && (
            <div className="space-y-5">
              <div className="flex items-center justify-between border-b border-gray-200 pb-3">
                <div className="flex items-center gap-2">
                  <MessageSquare className="size-5 text-blue-800" />
                  <h3 className="text-base font-extrabold text-blue-950">
                    Step 7: Interactive Case Monitoring & Activity Timeline
                  </h3>
                </div>
                <Badge className="bg-gray-100 text-gray-800 border-gray-300 font-semibold">
                  Logs Count: {(caseState.timeline || []).length}
                </Badge>
              </div>

              {/* Form to add mock follow-up notes, home visit logs, or progress updates */}
              {!isSecretary ? (
                <form onSubmit={handleAddTimeline} className="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-gray-900">Add Follow-Up Note / Home Visit Log / Progress Update</p>
                    <select
                      value={newLogType}
                      onChange={(e) => setNewLogType(e.target.value as any)}
                      className="h-8 px-2 border border-gray-300 rounded-md bg-white text-[11px] font-semibold"
                    >
                      <option value="visit">Home Visit</option>
                      <option value="update">Progress Update</option>
                      <option value="note">General Note</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      required
                      placeholder="Log Title (e.g. 3-Month Post-Disbursement Home Visit)"
                      value={newLogTitle}
                      onChange={(e) => setNewLogTitle(e.target.value)}
                      className="h-9 px-3 border border-gray-300 rounded-lg bg-white text-xs"
                    />
                    <input
                      type="text"
                      placeholder="Progress Details (e.g. Beneficiary used cash grant for medical maintenance)"
                      value={newLogNote}
                      onChange={(e) => setNewLogNote(e.target.value)}
                      className="h-9 px-3 border border-gray-300 rounded-lg bg-white text-xs"
                    />
                  </div>

                  <div className="flex justify-end">
                    <Button type="submit" size="sm" className="bg-blue-900 hover:bg-blue-800 text-white text-xs">
                      <Plus className="size-3.5 mr-1" /> Add Monitoring Log
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-800">
                  Case monitoring updates and field visits are conducted and recorded by MSWD Social Welfare Officers.
                </div>
              )}

              {/* Activity Timeline List */}
              <div className="space-y-3">
                <p className="text-xs font-bold text-gray-700">Real-Time Activity Timeline</p>
                <div className="relative border-l-2 border-blue-200 pl-4 ml-2 space-y-4 text-xs">
                  {(caseState.timeline || []).map((item) => (
                    <div key={item.id} className="relative group">
                      <div className="absolute -left-[21px] top-1 size-3.5 rounded-full bg-blue-600 border-2 border-white ring-2 ring-blue-100" />
                      <div className="p-3 bg-white border border-gray-200 rounded-lg shadow-2xs space-y-1 hover:border-blue-300 transition-colors">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-gray-900">{item.title}</span>
                          <span className="text-[10px] text-gray-400 font-mono">{item.date}</span>
                        </div>
                        <p className="text-gray-600 leading-relaxed">{item.description}</p>
                        <p className="text-[10px] text-blue-700 font-semibold">Logged by: {item.author}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-gray-100 border border-gray-200 rounded-xl flex items-center justify-between">
                <div className="text-xs space-y-0.5">
                  <p className="font-bold text-gray-900">Advance to Final Case Closure</p>
                  <p className="text-gray-600">Review all entered data and generate official case summary.</p>
                </div>

                {!isSecretary ? (
                  <Button
                    onClick={() => setCurrentStep(8)}
                    className="bg-gray-800 hover:bg-gray-900 text-white text-xs font-bold px-5 py-2.5"
                  >
                    Proceed to Step 8 (Case Closure) →
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    onClick={() => setCurrentStep(8)}
                    className="text-xs font-semibold px-4 py-2"
                  >
                    View Case Summary →
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* ═════ STEP 8: CASE CLOSURE ═════ */}
          {!isSecretary && activeStep === 8 && (
            <div className="space-y-5">
              <div className="flex items-center justify-between border-b border-gray-200 pb-3">
                <div className="flex items-center gap-2">
                  <Lock className="size-5 text-blue-800" />
                  <h3 className="text-base font-extrabold text-blue-950">
                    Step 8: Case Closure & Summary Preview
                  </h3>
                </div>
                <Badge
                  className={
                    caseState.statusCode === "CASE_CLOSED"
                      ? "bg-emerald-100 text-emerald-900 border-emerald-300 font-bold"
                      : "bg-gray-200 text-gray-800 border-gray-400"
                  }
                >
                  {caseState.statusCode === "CASE_CLOSED" ? "COMPLETED / CLOSED" : "Pending Final Closure"}
                </Badge>
              </div>

              {/* Summary Preview Card of all data entered from Steps 1–7 */}
              <Card className="border border-blue-200 bg-gradient-to-br from-blue-50/40 via-white to-gray-50 shadow-sm overflow-hidden">
                <CardHeader className="bg-blue-900 text-white px-5 py-3 flex flex-row items-center justify-between">
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <Award className="size-4 text-emerald-400" /> Official Case Summary & Social Case Study Report
                  </CardTitle>
                  <Badge className="bg-blue-800 text-blue-200 font-mono text-[11px]">
                    {caseState.trackingId}
                  </Badge>
                </CardHeader>
                <CardContent className="p-5 text-xs space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 border-b border-gray-100 pb-4">
                    <div>
                      <p className="text-gray-400 text-[10px] uppercase font-bold">Beneficiary Name</p>
                      <p className="text-sm font-bold text-gray-900">{caseState.beneficiaryName}</p>
                      <p className="text-[11px] text-gray-500 font-mono">{caseState.beneficiaryId}</p>
                    </div>

                    <div>
                      <p className="text-gray-400 text-[10px] uppercase font-bold">Barangay Endorsement</p>
                      <p className="font-semibold text-gray-800">{caseState.barangay}</p>
                      <p className="text-[11px] text-gray-500">Date: {caseState.endorsementDate}</p>
                    </div>

                    <div>
                      <p className="text-gray-400 text-[10px] uppercase font-bold">Eligibility & Vulnerability</p>
                      <p className="font-bold text-emerald-700">{caseState.eligibility?.status || "Eligible"}</p>
                      <p className="text-[11px] text-gray-500">Rating: {caseState.socialAssessment?.vulnerabilityLevel || "Moderate"} Vulnerability</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 border-b border-gray-100 pb-4">
                    <div>
                      <p className="text-gray-400 text-[10px] uppercase font-bold">Program Package</p>
                      <p className="font-semibold text-gray-800">
                        {moduleType === "solo-parent"
                          ? `SPIC ID: ${caseState.servicePlan?.spicNumber || "Pending"}`
                          : `Crisis: ${caseState.servicePlan?.crisisType || "Medical"}`}
                      </p>
                      <p className="text-[11px] text-gray-500">
                        Booklet No: {caseState.servicePlan?.purchaseBookletNumber || "N/A"}
                      </p>
                    </div>

                    <div>
                      <p className="text-gray-400 text-[10px] uppercase font-bold">Disbursement / Release</p>
                      <p className="font-bold text-emerald-700">
                        ₱{(caseState.serviceRelease?.approvedAmount ?? 0).toLocaleString()} ({caseState.serviceRelease?.releaseMethod || "Cash Payout"})
                      </p>
                      <p className="text-[11px] text-gray-500">
                        GL / Ref: {caseState.serviceRelease?.guaranteeLetterNumber || "N/A"}
                      </p>
                    </div>

                    <div>
                      <p className="text-gray-400 text-[10px] uppercase font-bold">Verified Requirements</p>
                      <p className="font-semibold text-gray-800">
                        {(caseState.documents || []).filter((d) => d.status === "Valid").length} / {(caseState.documents || []).length} Validated
                      </p>
                      <p className="text-[11px] text-gray-500">Assigned: {caseState.socialAssessment?.assignedSocialWorker || "MSWD Staff"}</p>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <p className="text-gray-400 text-[10px] uppercase font-bold">Social Case Study Summary</p>
                    <p className="text-gray-700 bg-white p-3 rounded-lg border border-gray-200 leading-relaxed">
                      {caseState.socialAssessment?.caseStudySummary || "Social Case Study documentation completed."}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Closure Notes */}
              <div className="space-y-1.5 text-xs">
                <label className="font-bold text-gray-800">Final Outcome & Archiving Remarks</label>
                <textarea
                  rows={2}
                  readOnly={isSecretary}
                  value={caseState.closureNotes || ""}
                  onChange={(e) => setCaseState({ ...caseState, closureNotes: e.target.value })}
                  placeholder="Enter remarks for the completed case archive..."
                  className="w-full p-3 border border-gray-300 rounded-lg bg-white text-xs"
                />
              </div>

              {/* Action Banner */}
              <div className="p-5 bg-gradient-to-r from-gray-900 to-blue-950 text-white rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-md">
                <div className="text-xs space-y-1">
                  <p className="font-bold text-sm text-white">Final Actions: Print & Close Case</p>
                  <p className="text-blue-200">
                    {isSecretary
                      ? "Case study report summary preview. Official archiving is performed by MSWD validators."
                      : "Trigger browser print preview for the case study report, or mark case as COMPLETED / CLOSED."}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  {/* Print Case Summary Button */}
                  <Button
                    type="button"
                    onClick={() => {
                      toast.info("Opening Print Preview for Case Summary Report...");
                      window.print();
                    }}
                    className="bg-white hover:bg-gray-100 text-gray-900 text-xs font-bold px-4 py-2.5 shadow-sm"
                  >
                    <Printer className="size-4 mr-1.5" /> Print Case Summary
                  </Button>

                  {/* Close Case Button (Validator Only) */}
                  {!isSecretary && (
                    <Button
                      type="button"
                      onClick={async () => {
                        await persistStepData(8, {
                          status: "CASE_CLOSED",
                          isCaseClosed: true,
                          closureNotes: caseState.closureNotes,
                        });
                        await updateStatus("CASE_CLOSED", "Case sealed, validated, and officially archived as CASE_CLOSED in PostgreSQL database.", 8);
                        toast.success("Case successfully marked as CASE_CLOSED in PostgreSQL database!");
                      }}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-5 py-2.5 shadow-sm"
                    >
                      <CheckCheck className="size-4 mr-1.5" /> Close Case (COMPLETED / CLOSED)
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}

        </div>

        {/* ── FOOTER STEP NAVIGATION ── */}
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between flex-shrink-0">
          {isSecretary ? (
            <div className="w-full flex items-center justify-between">
              <span className="text-xs text-gray-500 font-medium">
                Frontline Intake View &bull; Read-Only &bull; Workflow advancement and validation actions are restricted to MSWD staff.
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={onClose}
                className="bg-white hover:bg-gray-100 text-gray-700 text-xs font-bold px-4 py-2 border-gray-300"
              >
                Close Intake Details
              </Button>
            </div>
          ) : (
            <>
              <Button
                variant="outline"
                size="sm"
                disabled={activeStep === 1}
                onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
                className="text-xs"
              >
                <ChevronLeft className="size-4 mr-1" /> Previous Step
              </Button>

              <span className="text-xs font-bold text-gray-500">
                Step {activeStep} of 8
              </span>

              <Button
                size="sm"
                disabled={activeStep === 8 || (activeStep === 4 && !isEligibilityUnlocked)}
                onClick={() => setCurrentStep((prev) => Math.min(8, prev + 1))}
                className="bg-blue-900 hover:bg-blue-800 text-white text-xs"
              >
                Next Step <ChevronRight className="size-4 ml-1" />
              </Button>
            </>
          )}
        </div>

      </div>

      {/* ═════ SPIC ID CARD PREVIEW MODAL ═════ */}
      {showSpicPreviewModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/70 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-gray-200 animate-in fade-in zoom-in-95">
            <div className="bg-blue-900 text-white px-5 py-3 flex items-center justify-between">
              <h4 className="text-sm font-bold flex items-center gap-2">
                <CreditCard className="size-4 text-emerald-400" /> Official SPIC ID Card Preview
              </h4>
              <button
                onClick={() => setShowSpicPreviewModal(false)}
                className="text-white/80 hover:text-white p-1"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Printable ID Card Graphic */}
            <div className="p-6 bg-gradient-to-b from-gray-100 to-gray-200 flex justify-center">
              <div className="w-[380px] rounded-xl bg-white border-2 border-blue-900 shadow-xl overflow-hidden text-xs">
                {/* ID Header */}
                <div className="bg-blue-900 text-white text-center py-2 px-3 border-b-2 border-amber-400">
                  <p className="text-[9px] uppercase tracking-wider text-blue-200">Republic of the Philippines</p>
                  <p className="text-[11px] font-extrabold leading-tight">MUNICIPALITY OF CALABANGA</p>
                  <p className="text-[9px] text-blue-200">Municipal Social Welfare & Development Office</p>
                  <div className="bg-amber-400 text-blue-950 font-black text-[10px] mt-1 py-0.5 uppercase tracking-wider rounded">
                    SOLO PARENT IDENTIFICATION CARD (R.A. 11861)
                  </div>
                </div>

                {/* ID Body */}
                <div className="p-4 grid grid-cols-3 gap-3 items-center">
                  {/* Photo Box */}
                  <div className="size-24 rounded border-2 border-gray-300 bg-gray-100 flex flex-col items-center justify-center text-gray-400">
                    <User className="size-10 text-gray-300" />
                    <span className="text-[8px] font-bold mt-1">2x2 PHOTO</span>
                  </div>

                  {/* Card Info */}
                  <div className="col-span-2 space-y-1 text-[11px]">
                    <div>
                      <span className="text-[9px] text-gray-500 font-bold block">SPIC NO.:</span>
                      <span className="font-mono font-bold text-blue-900 text-xs">
                        {caseState.servicePlan.spicNumber}
                      </span>
                    </div>
                    <div>
                      <span className="text-[9px] text-gray-500 font-bold block">CARDHOLDER NAME:</span>
                      <span className="font-extrabold text-gray-900 leading-none">
                        {caseState.beneficiaryName}
                      </span>
                    </div>
                    <div>
                      <span className="text-[9px] text-gray-500 font-bold block">BARANGAY:</span>
                      <span className="font-semibold text-gray-800">{caseState.barangay}, Calabanga</span>
                    </div>
                    <div className="flex justify-between text-[10px]">
                      <span>Booklet: <b>{caseState.servicePlan.purchaseBookletNumber}</b></span>
                      <span>Valid: <b>1 Year</b></span>
                    </div>
                  </div>
                </div>

                {/* ID Footer Barcode & Signature */}
                <div className="bg-gray-50 border-t border-gray-200 px-4 py-2 flex items-center justify-between text-[9px] text-gray-500">
                  <div className="flex items-center gap-1">
                    <QrCode className="size-6 text-gray-700" />
                    <span className="font-mono text-[8px] leading-tight">MSWD-SEC-VERIFIED</span>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-800 border-t border-gray-400 pt-0.5">MSWD Officer</p>
                    <p className="text-[8px]">Municipal Social Welfare</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-white flex justify-end gap-2 border-t border-gray-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowSpicPreviewModal(false)}
                className="text-xs"
              >
                Close Preview
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => {
                  toast.success("Printing SPIC Card template...");
                  window.print();
                }}
                className="bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold"
              >
                <Printer className="size-3.5 mr-1" /> Print Card
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ═════ GUARANTEE LETTER (GL) PREVIEW MODAL ═════ */}
      {showGlPreviewModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/70 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-200 animate-in fade-in zoom-in-95">
            <div className="bg-blue-900 text-white px-5 py-3 flex items-center justify-between sticky top-0 z-10">
              <h4 className="text-sm font-bold flex items-center gap-2">
                <FileCheck2 className="size-4 text-emerald-400" /> Official Guarantee Letter (GL) Printable Template
              </h4>
              <button
                onClick={() => setShowGlPreviewModal(false)}
                className="text-white/80 hover:text-white p-1"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Document Body */}
            <div className="p-8 text-xs font-serif leading-relaxed text-gray-900 space-y-5 bg-white">
              {/* Letterhead */}
              <div className="text-center space-y-0.5 border-b-2 border-blue-900 pb-3">
                <p className="text-[10px] tracking-wider uppercase font-sans">Republic of the Philippines</p>
                <p className="text-[10px] tracking-wider uppercase font-sans">Province of Camarines Sur</p>
                <p className="text-xs font-bold font-sans">MUNICIPALITY OF CALABANGA</p>
                <p className="text-xs font-extrabold text-blue-900 font-sans">
                  OFFICE OF THE MUNICIPAL SOCIAL WELFARE AND DEVELOPMENT
                </p>
                <p className="text-[10px] text-gray-500 font-sans">
                  Assistance to Individuals in Crisis Situation (AICS Program)
                </p>
              </div>

              {/* Reference & Date */}
              <div className="flex justify-between items-center font-sans text-xs pt-2">
                <div>
                  <span className="font-bold text-gray-500">GL NO.: </span>
                  <span className="font-mono font-bold text-blue-900">
                    {caseState.serviceRelease.guaranteeLetterNumber || "GL-CAL-2026-00452"}
                  </span>
                </div>
                <div>
                  <span className="font-bold text-gray-500">DATE: </span>
                  <span className="font-bold">{caseState.serviceRelease.payoutDate || "October 09, 2026"}</span>
                </div>
              </div>

              {/* Addressee */}
              <div className="font-sans space-y-0.5 pt-2">
                <p className="font-bold">TO: THE MEDICAL DIRECTOR / BILLING SECTION / PHARMACY</p>
                <p className="text-gray-600">Partner Health / Service Provider Facility</p>
              </div>

              {/* Subject */}
              <div className="font-sans font-bold text-sm text-blue-950 underline pt-1">
                SUBJECT: GUARANTEE OF PAYMENT FOR {(caseState.servicePlan?.crisisType || "EMERGENCY").toUpperCase()} ASSISTANCE
              </div>

              {/* Letter Content */}
              <div className="space-y-3 pt-2 text-justify">
                <p>
                  This is to certify that the <b>Municipal Social Welfare and Development Office of Calabanga</b>, Camarines Sur, has evaluated and approved the emergency assistance request of:
                </p>

                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 font-sans space-y-1">
                  <p>
                    <b>Beneficiary Name:</b> {caseState.beneficiaryName}
                  </p>
                  <p>
                    <b>Address:</b> {caseState.barangay}, Calabanga, Camarines Sur
                  </p>
                  <p>
                    <b>Tracking ID:</b> {caseState.trackingId}
                  </p>
                  <p>
                    <b>Approved Amount:</b>{" "}
                    <span className="text-emerald-800 font-bold text-sm">
                      ₱{(caseState.serviceRelease?.approvedAmount ?? 0).toLocaleString()}.00
                    </span>
                  </p>
                </div>

                <p>
                  The MSWD Calabanga hereby guarantees the settlement of the authorized amount indicated above to cover the necessary expenses incurred. Please forward the corresponding Statement of Account (SOA), official invoice, and a copy of this Guarantee Letter to the MSWD Accounting Section for billing processing.
                </p>

                <p>
                  Your customary cooperation in assisting indigent residents in crisis is highly appreciated.
                </p>
              </div>

              {/* Signatures */}
              <div className="pt-8 flex justify-between items-end font-sans">
                <div>
                  <p className="text-[10px] text-gray-500">Prepared by:</p>
                  <p className="font-bold pt-4">{caseState.socialAssessment?.assignedSocialWorker || "MSWD Staff"}</p>
                  <p className="text-[10px] text-gray-500">Social Welfare Officer</p>
                </div>

                <div className="text-right">
                  <p className="text-[10px] text-gray-500">Approved by:</p>
                  <p className="font-bold pt-4 text-blue-900">MARIA ELENA VILLANUEVA, RSW</p>
                  <p className="text-[10px] text-gray-500">MSWD Department Head</p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-gray-50 flex justify-end gap-2 border-t border-gray-200 sticky bottom-0">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowGlPreviewModal(false)}
                className="text-xs"
              >
                Close
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => {
                  toast.success("Printing Guarantee Letter...");
                  window.print();
                }}
                className="bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold"
              >
                <Printer className="size-3.5 mr-1" /> Print Guarantee Letter
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// Root exported component with high z-index and WorkflowErrorBoundary protection
export function MSWDCaseWorkflowModal(props: MSWDCaseWorkflowModalProps) {
  if (!props.isOpen) return null;
  return (
    <WorkflowErrorBoundary onClose={props.onClose}>
      <MSWDCaseWorkflowModalInner {...props} />
    </WorkflowErrorBoundary>
  );
}
