import type { CaseData, DocumentCheckItem, TimelineEntry, WorkflowStatusCode } from "../components/MSWDCaseWorkflowModal";

export interface IntakeDocument {
  id: string;
  name: string;
  file: File;
}

// Let the browser set the multipart boundary; File objects cannot be JSON encoded.
function intakeRequest(data: object, documents: IntakeDocument[] = []): RequestInit {
  const body = new FormData();
  body.append('payload', JSON.stringify({
    ...data,
    document_metadata: documents.map(({ id, name }) => ({ id, name })),
  }));
  documents.forEach(({ file }) => body.append('uploaded_files', file, file.name));
  return { method: 'POST', body };
}

export interface DbCaseRecord {
  id?: number;
  case_number: string;
  beneficiary_name: string;
  barangay_name: string;
  category?: 'SOLO_PARENT' | 'WOMEN_VAWC';
  aics_type?: 'MEDICAL' | 'BURIAL' | 'TRANSPORTATION' | 'ECONOMIC_RELIEF' | 'BALIK_PROBINSYA';
  status: WorkflowStatusCode;
  eligibility?: 'ELIGIBLE' | 'NOT_ELIGIBLE' | 'ADDITIONAL_REQUIREMENTS' | 'FOR_REFERRAL' | null;
  documents?: DocumentCheckItem[];
  documents_status?: Record<string, 'Valid' | 'Incomplete' | 'Invalid'>;
  assessment_notes?: string;
  vulnerability_level?: 'HIGH' | 'MODERATE' | 'LOW' | null;
  spic_number?: string | null;
  booklet_number?: string | null;
  financial_aid_amount?: number | string | null;
  approved_amount?: number | string | null;
  referrals?: string[] | null;
  release_method?: 'CASH' | 'CHECK' | 'GUARANTEE_LETTER' | null;
  guarantee_letter_number?: string | null;
  payout_date?: string | null;
  monitoring_logs?: TimelineEntry[] | null;
  created_at?: string;
  updated_at?: string;
}

// Convert DB record to UI CaseData
export function mapDbRecordToCaseData(row: DbCaseRecord | null | undefined, moduleTypeHint?: 'solo-parent' | 'women-vawc' | 'aics'): CaseData {
  const safeRow: any = row || {};
  let moduleType: 'solo-parent' | 'women-vawc' | 'aics' = 'solo-parent';
  if (safeRow.aics_type) {
    moduleType = 'aics';
  } else if (safeRow.category === 'WOMEN_VAWC') {
    moduleType = 'women-vawc';
  } else if (moduleTypeHint) {
    const hint = String(moduleTypeHint).toLowerCase();
    moduleType = hint.includes('vawc') ? 'women-vawc' : hint.includes('aics') ? 'aics' : 'solo-parent';
  }

  // The API returns persisted attachments, never sample filenames.
  const documents: DocumentCheckItem[] = Array.isArray(safeRow.documents)
    ? safeRow.documents.map((doc: DocumentCheckItem) => ({
        ...doc,
        status: safeRow.documents_status?.[doc.id] || doc.status || "Incomplete",
      }))
    : [];

  // Map Vulnerability
  let vuln: "High" | "Moderate" | "Low" = "Moderate";
  if (safeRow.vulnerability_level === 'HIGH') vuln = 'High';
  else if (safeRow.vulnerability_level === 'LOW') vuln = 'Low';

  // Map Eligibility
  let eligStatus: "Eligible" | "Not Eligible" | "Additional Requirements Needed" | "For Referral" | "" = "Eligible";
  if (safeRow.eligibility === 'NOT_ELIGIBLE') eligStatus = 'Not Eligible';
  else if (safeRow.eligibility === 'ADDITIONAL_REQUIREMENTS') eligStatus = 'Additional Requirements Needed';
  else if (safeRow.eligibility === 'FOR_REFERRAL') eligStatus = 'For Referral';

  // Map Release Method
  let relMethod: "Cash Payout" | "Check" | "Guarantee Letter / GL" = "Cash Payout";
  if (safeRow.release_method === 'CHECK') relMethod = 'Check';
  else if (safeRow.release_method === 'GUARANTEE_LETTER') relMethod = 'Guarantee Letter / GL';

  // Map AICS crisis type
  let crisis: "Medical" | "Burial" | "Transportation" | "Economic Relief" | "Balik Probinsya" = "Medical";
  if (safeRow.aics_type === 'BURIAL') crisis = 'Burial';
  else if (safeRow.aics_type === 'TRANSPORTATION') crisis = 'Transportation';
  else if (safeRow.aics_type === 'ECONOMIC_RELIEF') crisis = 'Economic Relief';
  else if (safeRow.aics_type === 'BALIK_PROBINSYA') crisis = 'Balik Probinsya';

  const amount = Number(safeRow.financial_aid_amount || safeRow.approved_amount || (moduleType === 'aics' ? 5000 : 3000));
  const trackingNumber = safeRow.case_number || `BEN-2026-${Math.floor(100000 + Math.random() * 900000)}`;
  const beneficiaryName = safeRow.beneficiary_name || safeRow.fullName || "Beneficiary Client";
  const barangayName = safeRow.barangay_name || safeRow.barangay || "San Juan";

  const rawStatus = (safeRow.status || 'BARANGAY_ENDORSED').toString().toUpperCase().replace(/\s+/g, '_');
  const validStatuses: WorkflowStatusCode[] = [
    'BARANGAY_ENDORSED', 'UNDER_REVIEW', 'RETURNED_FOR_CORRECTION',
    'IN_ASSESSMENT', 'ELIGIBILITY_EVALUATED', 'APPROVED_FOR_RELEASE',
    'RELEASED_COMPLETED', 'CASE_CLOSED'
  ];
  let safeStatusCode: WorkflowStatusCode = 'BARANGAY_ENDORSED';
  if (validStatuses.includes(rawStatus as WorkflowStatusCode)) {
    safeStatusCode = rawStatus as WorkflowStatusCode;
  } else if (rawStatus.includes('REVIEW')) {
    safeStatusCode = 'UNDER_REVIEW';
  } else if (rawStatus.includes('ASSESS')) {
    safeStatusCode = 'IN_ASSESSMENT';
  } else if (rawStatus.includes('ELIGIB')) {
    safeStatusCode = 'ELIGIBILITY_EVALUATED';
  } else if (rawStatus.includes('APPROV')) {
    safeStatusCode = 'APPROVED_FOR_RELEASE';
  } else if (rawStatus.includes('RELEASE') || rawStatus.includes('COMPLETE')) {
    safeStatusCode = 'RELEASED_COMPLETED';
  } else if (rawStatus.includes('CLOSE')) {
    safeStatusCode = 'CASE_CLOSED';
  }

  return {
    id: safeRow.id || 0,
    trackingId: trackingNumber,
    beneficiaryName,
    beneficiaryId: trackingNumber,
    barangay: barangayName,
    moduleType,
    statusCode: safeStatusCode,
    endorsementDate: safeRow.created_at ? new Date(safeRow.created_at).toISOString().split('T')[0] : '2026-10-01',
    endorsedBy: `Barangay Secretary (${barangayName})`,
    endorsementNotes: safeRow.assessment_notes || "Barangay endorsement and case documentation submitted for MSWD intake evaluation.",
    documents,
    socialAssessment: {
      intakeNotes: safeRow.assessment_notes || "Client intake interview conducted. Household socio-economic assessment documented.",
      caseStudySummary: safeRow.assessment_notes || "Social Case Study Report filed recommending municipal welfare intervention.",
      vulnerabilityLevel: vuln,
      vulnerabilityNotes: `Assessed ${vuln.toLowerCase()} vulnerability prioritization.`,
      assignedSocialWorker: "Juan Miguel Ramos, RSW",
    },
    eligibility: {
      status: eligStatus,
      notes: "Assessed under official Municipal Social Welfare guidelines and Republic Act statutory requirements.",
      evaluatedDate: safeRow.updated_at ? new Date(safeRow.updated_at).toISOString().split('T')[0] : '2026-10-03',
    },
    servicePlan: {
      spicNumber: safeRow.spic_number || (moduleType === 'solo-parent' ? `SPIC-2026-1082` : ''),
      purchaseBookletNumber: safeRow.booklet_number || 'BK-2026-0842',
      emergencyCashAidAmount: amount,
      referrals: Array.isArray(safeRow.referrals) ? safeRow.referrals : ["Livelihood Skills Training", "Parenting Effectiveness Seminar (PES)"],
      crisisType: crisis,
      approvedFinancialAmount: amount,
      nonMonetarySupport: moduleType === 'aics' ? 'Medical Guarantee Letter + Food Subsidy' : 'Solo Parent Welfare Support',
    },
    serviceRelease: {
      releaseMethod: relMethod,
      guaranteeLetterNumber: safeRow.guarantee_letter_number || 'GL-CAL-2026-00452',
      payoutDate: safeRow.payout_date ? String(safeRow.payout_date).split('T')[0] : '2026-10-15',
      approvedAmount: amount,
      payoutOfficer: "Treasury Disbursing Officer",
      disbursementStatus: safeRow.status === 'RELEASED_COMPLETED' || safeRow.status === 'CASE_CLOSED' ? 'Disbursed / Completed' : 'Pending Payout',
    },
    timeline: (safeRow.monitoring_logs && Array.isArray(safeRow.monitoring_logs) && safeRow.monitoring_logs.length > 0)
      ? safeRow.monitoring_logs
      : [
          {
            id: 'tl-1',
            date: '2026-10-01 09:15 AM',
            author: 'Barangay Secretary',
            title: 'Barangay Endorsement Recorded',
            description: `Case forwarded from Barangay ${barangayName} to Municipal MSWD Office.`,
            type: 'status',
          },
        ],
    caseClosedDate: safeRow.status === 'CASE_CLOSED' ? (safeRow.updated_at ? new Date(safeRow.updated_at).toISOString().split('T')[0] : '2026-10-09') : undefined,
    closureNotes: safeRow.status === 'CASE_CLOSED' ? 'All case objectives achieved. Case officially closed and archived.' : undefined,
  };
}

// Helper to parse DRF validation errors or standard HTTP errors into clean toast messages
function extractErrorMessage(errorJson: any, fallback: string): string {
  if (!errorJson) return fallback;
  if (typeof errorJson === 'string') return errorJson;
  if (errorJson.error) return String(errorJson.error);
  if (errorJson.detail) return String(errorJson.detail);
  if (errorJson.message) return String(errorJson.message);
  for (const k of Object.keys(errorJson)) {
    const val = errorJson[k];
    if (Array.isArray(val) && val.length > 0) return `${k}: ${val[0]}`;
    if (typeof val === 'string') return `${k}: ${val}`;
  }
  return fallback;
}

// 1. Fetch Women & Solo Parent Cases
export async function apiGetWomenSoloParentCases(filters?: { status?: string; category?: string; search?: string; barangay?: string }) {
  const params = new URLSearchParams();
  if (filters?.status && filters.status !== 'all') params.set('status', filters.status);
  if (filters?.category && filters.category !== 'all') params.set('category', filters.category);
  if (filters?.search) params.set('search', filters.search);
  if (filters?.barangay && filters.barangay !== 'all') params.set('barangay', filters.barangay);

  const url = `/api/cases/women-solo-parent${params.toString() ? `?${params.toString()}` : ''}`;
  const res = await fetch(url);
  if (!res.ok) {
    const errorJson = await res.json().catch(() => ({}));
    throw new Error(extractErrorMessage(errorJson, `Failed to fetch women & solo parent cases: ${res.statusText}`));
  }
  const json = await res.json();
  const list = Array.isArray(json.data) ? json.data : Array.isArray(json.results) ? json.results : Array.isArray(json) ? json : [];
  return list as DbCaseRecord[];
}

// 2. Fetch AICS Cases
export async function apiGetAicsCases(filters?: { status?: string; aics_type?: string; search?: string; barangay?: string }) {
  const params = new URLSearchParams();
  if (filters?.status && filters.status !== 'all') params.set('status', filters.status);
  if (filters?.aics_type && filters.aics_type !== 'all') params.set('aics_type', filters.aics_type);
  if (filters?.search) params.set('search', filters.search);
  if (filters?.barangay && filters.barangay !== 'all') params.set('barangay', filters.barangay);

  const url = `/api/cases/aics${params.toString() ? `?${params.toString()}` : ''}`;
  const res = await fetch(url);
  if (!res.ok) {
    const errorJson = await res.json().catch(() => ({}));
    throw new Error(extractErrorMessage(errorJson, `Failed to fetch AICS cases: ${res.statusText}`));
  }
  const json = await res.json();
  const list = Array.isArray(json.data) ? json.data : Array.isArray(json.results) ? json.results : Array.isArray(json) ? json : [];
  return list as DbCaseRecord[];
}

// 3. Fetch Case Record & Audit Log by ID
export async function apiGetCaseById(idOrCaseNumber: string | number, moduleHint?: string) {
  const url = `/api/cases/${encodeURIComponent(String(idOrCaseNumber))}${moduleHint ? `?module=${encodeURIComponent(moduleHint)}` : ''}`;
  const res = await fetch(url);
  if (!res.ok) {
    const errorJson = await res.json().catch(() => ({}));
    throw new Error(extractErrorMessage(errorJson, `Failed to fetch case ${idOrCaseNumber}: ${res.statusText}`));
  }
  return await res.json();
}

// 4. Update Step & Persist to PostgreSQL (Steps 1 to 8)
export async function apiUpdateCaseStep(idOrCaseNumber: string | number, payload: any) {
  const url = `/api/cases/${encodeURIComponent(String(idOrCaseNumber))}/step`;
  const res = await fetch(url, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorJson = await res.json().catch(() => ({}));
    throw new Error(extractErrorMessage(errorJson, `Failed to update case step: ${res.statusText}`));
  }

  const json = await res.json();
  notifyDataUpdated();
  return (json.data || json) as DbCaseRecord;
}

// 5. Create Women & Solo Parent Case (POST /api/cases/women-solo-parent)
export async function apiCreateWomenSoloParentCase(data: {
  case_number?: string;
  fullName: string;
  birthDate?: string;
  gender?: string;
  civilStatus?: string;
  barangay: string;
  contactNumber?: string;
  indigencyLevel?: string;
  category: 'SOLO_PARENT' | 'WOMEN_VAWC';
  dependentChildren?: number;
  soloParentReason?: string;
  status?: string;
  financialAidAmount?: number;
  notes?: string;
}, documents: IntakeDocument[] = []) {
  const res = await fetch('/api/cases/women-solo-parent', intakeRequest(data, documents));

  if (!res.ok) {
    const errorJson = await res.json().catch(() => ({}));
    throw new Error(extractErrorMessage(errorJson, `Failed to register beneficiary: ${res.statusText}`));
  }

  const json = await res.json();
  notifyDataUpdated();
  return (json.data || json) as DbCaseRecord;
}

// 6. Create AICS Case (POST /api/cases/aics)
export async function apiCreateAicsCase(data: {
  case_number?: string;
  fullName: string;
  birthDate?: string;
  civilStatus?: string;
  barangay: string;
  contactNumber?: string;
  incomeStatus?: string;
  crisisType: 'MEDICAL' | 'BURIAL' | 'TRANSPORTATION' | 'ECONOMIC_RELIEF' | 'BALIK_PROBINSYA';
  crisisSummary?: string;
  serviceProvider?: string;
  requestedAmount?: number;
  status?: string;
}, documents: IntakeDocument[] = []) {
  const res = await fetch('/api/cases/aics', intakeRequest(data, documents));

  if (!res.ok) {
    const errorJson = await res.json().catch(() => ({}));
    throw new Error(extractErrorMessage(errorJson, `Failed to register AICS intake: ${res.statusText}`));
  }

  const json = await res.json();
  notifyDataUpdated();
  return (json.data || json) as DbCaseRecord;
}

export interface DashboardStats {
  totalBeneficiaries: number;
  activeCases: number;
  approvedReleasedCases: number;
  totalDisbursed: number;
  categoryBreakdown: Array<{ name: string; value: number; color: string }>;
  aicsBreakdown: Array<{ name: string; value: number; color: string }>;
  barangayDistribution: Array<{ barangay: string; count: number }>;
  recentActivities: Array<{
    id: string;
    clientName: string;
    clientId: string;
    program: string;
    barangay: string;
    date: string;
    time: string;
    title: string;
    description: string;
    status: string;
    statusLabel: string;
    author: string;
    timestamp?: string;
  }>;
}

// 7. Get Live Dashboard Statistics (GET /api/dashboard/stats)
export async function apiGetDashboardStats(): Promise<DashboardStats> {
  const res = await fetch('/api/dashboard/stats');
  if (!res.ok) {
    throw new Error(`Failed to load dashboard statistics: ${res.statusText}`);
  }
  const json = await res.json();
  return json.data as DashboardStats;
}

// 8. Event synchronization helpers
export function notifyDataUpdated() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('benefitrack:data-updated'));
  }
}

export function subscribeDataUpdated(callback: () => void) {
  if (typeof window === 'undefined') return () => {};
  const handler = () => callback();
  window.addEventListener('benefitrack:data-updated', handler);
  return () => {
    window.removeEventListener('benefitrack:data-updated', handler);
  };
}

// 9. Session-based submitted cases tracking for Secretary intake
export function getSecretarySubmittedCases(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = sessionStorage.getItem('benefitrack_submitted_cases');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveSecretarySubmittedCase(caseNumber: string) {
  if (typeof window === 'undefined' || !caseNumber) return;
  try {
    const list = getSecretarySubmittedCases();
    if (!list.includes(caseNumber)) {
      list.push(caseNumber);
      sessionStorage.setItem('benefitrack_submitted_cases', JSON.stringify(list));
    }
  } catch {}
}

// 10. Role checking helpers
export function isSecretaryRole(role?: string): boolean {
  let r = (role || "").trim().toLowerCase().replace(/[\s_]+/g, '');
  if (!r && typeof window !== 'undefined') {
    const stored = (sessionStorage.getItem('benefitrack_active_role') || '').trim().toLowerCase().replace(/[\s_]+/g, '');
    r = stored;
  }
  if (!r) return false;
  return (
    r.includes('secretary') ||
    r.includes('barangay') ||
    r.includes('frontline') ||
    r.includes('intake')
  );
}

export function isStaffRole(role?: string): boolean {
  if (!role) return false;
  const r = role.trim().toLowerCase().replace(/[\s_]+/g, '');
  return (
    r === 'staff' ||
    r === 'validator' ||
    r === 'mswdstaff' ||
    r === 'socialworker' ||
    r === 'mswdofficer'
  );
}

