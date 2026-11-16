import { authFetch } from "./authService";
import { mapIntakeProfile, mapNameFields, type SeparatedNameFields } from "../utils/intakeProfile";
import type { CaseData, DocumentCheckItem, TimelineEntry, WorkflowStatusCode } from "../components/MSWDCaseWorkflowModal";

export interface IntakeDocument {
  id: string;
  name: string;
  file: File;
}

// Let the browser set the multipart boundary; File objects cannot be JSON encoded.
function intakeRequest(data: object, documents: IntakeDocument[] = []): RequestInit {
  const replacements = documents.filter(document => document.file instanceof File);
  const body = new FormData();
  body.append('payload', JSON.stringify({
    ...data,
    document_metadata: replacements.map(({ id, name }) => ({ id, name })),
  }));
  replacements.forEach(({ file }) => body.append('uploaded_files', file, file.name));
  return { method: 'POST', body };
}

export interface DbCaseRecord {
  correction_notes?: string;
  id?: number;
  workflow_version?: number;
  payout_officer_name?: string;
  case_number: string;
  beneficiary_name: string;
  first_name?: string;
  middle_name?: string;
  last_name?: string;
  extension_name?: string;
  gender?: string;
  civil_status?: string;
  birth_date?: string;
  contact_number?: string;
  income_status?: string;
  indigency_level?: string;
  dependent_children?: number;
  solo_parent_reason?: string;
  crisis_summary?: string;
  service_provider?: string;
  intake_notes?: string;
  workflow_data?: Record<string, any>;
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
  const workflow = safeRow.workflow_data || {};
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
        reviewed: doc.reviewed ?? Object.prototype.hasOwnProperty.call(safeRow.documents_status || {}, doc.id),
      }))
    : [];

  // Map Vulnerability
  let vuln: "High" | "Moderate" | "Low" = "Moderate";
  if (safeRow.vulnerability_level === 'HIGH') vuln = 'High';
  else if (safeRow.vulnerability_level === 'LOW') vuln = 'Low';

  // Map Eligibility
  let eligStatus: "Eligible" | "Not Eligible" | "Additional Requirements Needed" | "For Referral" | "" = "";
  if (safeRow.eligibility === 'ELIGIBLE') eligStatus = 'Eligible';
  else if (safeRow.eligibility === 'NOT_ELIGIBLE') eligStatus = 'Not Eligible';
  else if (safeRow.eligibility === 'ADDITIONAL_REQUIREMENTS') eligStatus = 'Additional Requirements Needed';
  else if (safeRow.eligibility === 'FOR_REFERRAL') eligStatus = 'For Referral';

  // Map Release Method
  let relMethod: CaseData["serviceRelease"]["releaseMethod"] = "Cash Payout";
  if (safeRow.release_method === 'DIRECT_SERVICE') relMethod = 'Direct Service';
  else if (safeRow.release_method === 'REFERRAL') relMethod = 'Referral';
  else if (safeRow.release_method === 'CHECK') relMethod = 'Check';
  else if (safeRow.release_method === 'GUARANTEE_LETTER') relMethod = 'Guarantee Letter / GL';

  // Map AICS crisis type
  let crisis: "Medical" | "Burial" | "Transportation" | "Economic Relief" | "Balik Probinsya" = "Medical";
  if (safeRow.aics_type === 'BURIAL') crisis = 'Burial';
  else if (safeRow.aics_type === 'TRANSPORTATION') crisis = 'Transportation';
  else if (safeRow.aics_type === 'ECONOMIC_RELIEF') crisis = 'Economic Relief';
  else if (safeRow.aics_type === 'BALIK_PROBINSYA') crisis = 'Balik Probinsya';

  const amount = Number(safeRow.financial_aid_amount ?? safeRow.approved_amount ?? 0);
  const trackingNumber = safeRow.case_number || safeRow.tracking_id || safeRow.trackingId || (safeRow.id != null ? String(safeRow.id) : "");
  const beneficiaryName = safeRow.beneficiary_name || safeRow.fullName || "Beneficiary Client";
  const barangayName = safeRow.barangay_name ?? safeRow.barangay ?? "";

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
    workflowVersion: safeRow.workflow_version,
    completedActivities: workflow._completed || {},
    applicantProfile: mapIntakeProfile(safeRow),
    beneficiaryId: trackingNumber,
    barangay: barangayName,
    moduleType,
    statusCode: safeStatusCode,
    endorsementDate: safeRow.created_at ? new Date(safeRow.created_at).toISOString().split('T')[0] : '2026-10-01',
    endorsedBy: `Barangay Secretary (${barangayName})`,
    endorsementNotes: (safeRow.intake_notes ?? safeRow.assessment_notes) || safeRow.crisis_summary || "No endorsement notes provided.",
    correctionNotes: getCorrectionNotes(safeRow),
    documents,
    socialAssessment: {
      intakeNotes: workflow.socialAssessment?.intakeNotes ?? workflow.intakeInterview?.notes ?? safeRow.intake_notes ?? safeRow.assessment_notes ?? "",
      caseStudySummary: workflow.socialAssessment?.caseStudySummary ?? "",
      vulnerabilityLevel: workflow.socialAssessment?.vulnerabilityLevel ?? vuln,
      vulnerabilityNotes: workflow.socialAssessment?.vulnerabilityNotes ?? "",
      assignedSocialWorker: workflow.socialAssessment?.assignedSocialWorker ?? workflow.intakeInterview?.interviewer ?? "",
    },
    eligibility: {
      status: eligStatus,
      notes: workflow.eligibilityDetails?.notes ?? "",
      evaluatedDate: workflow.eligibilityDetails?.evaluatedDate ?? undefined,
    },
    servicePlan: {
      spicNumber: safeRow.spic_number ?? '',
      purchaseBookletNumber: safeRow.booklet_number ?? '',
      emergencyCashAidAmount: Number(safeRow.financial_aid_amount ?? workflow.servicePlan?.emergencyCashAidAmount ?? amount),
      referrals: Array.isArray(safeRow.referrals) ? safeRow.referrals : (workflow.servicePlan?.referrals || []),
      crisisType: crisis,
      approvedFinancialAmount: Number(safeRow.approved_amount ?? workflow.servicePlan?.approvedFinancialAmount ?? amount),
      nonMonetarySupport: workflow.servicePlan?.nonMonetarySupport ?? "",
    },
    serviceRelease: {
      releaseMethod: relMethod,
      guaranteeLetterNumber: safeRow.guarantee_letter_number ?? workflow.serviceRelease?.guaranteeLetterNumber ?? '',
      payoutDate: safeRow.payout_date ? String(safeRow.payout_date).split('T')[0] : '',
      approvedAmount: Number(workflow.serviceRelease?.approvedAmount ?? amount),
      payoutOfficer: safeRow.payout_officer_name || workflow.serviceRelease?.payoutOfficer || "",
      disbursementStatus: safeRow.status === 'RELEASED_COMPLETED' || safeRow.status === 'CASE_CLOSED' ? 'Disbursed / Completed' : 'Pending Payout',
    },
    timeline: Array.isArray(safeRow.monitoring_logs) ? safeRow.monitoring_logs.map((log: any) => ({
      id: log.id,
      date: log.date ?? log.timestamp ?? "",
      author: log.author ?? log.performed_by ?? "",
      title: log.title ?? log.action ?? "",
      description: log.description ?? log.note ?? "",
      type: log.type ?? "status",
    })) : [],
    caseClosedDate: safeRow.status === 'CASE_CLOSED' ? (safeRow.updated_at ? new Date(safeRow.updated_at).toISOString().split('T')[0] : undefined) : undefined,
    closureNotes: workflow.closureNotes ?? '',
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
export async function apiGetWomenSoloParentCases(filters?: { status?: string; category?: string; search?: string; barangay?: string; queue?: "secretary" }) {
  const params = new URLSearchParams();
  if (filters?.status && filters.status !== 'all') params.set('status', filters.status);
  if (filters?.category && filters.category !== 'all') params.set('category', filters.category);
  if (filters?.search) params.set('search', filters.search);
  if (filters?.barangay && filters.barangay !== 'all') params.set('barangay', filters.barangay);
  if (filters?.queue) params.set('queue', filters.queue);

  const url = `/api/cases/women-solo-parent${params.toString() ? `?${params.toString()}` : ''}`;
  const res = await authFetch(url, { cache: 'no-store' });
  if (!res.ok) {
    const errorJson = await res.json().catch(() => ({}));
    throw new Error(extractErrorMessage(errorJson, `Failed to fetch women & solo parent cases: ${res.statusText}`));
  }
  const json = await res.json();
  const list = Array.isArray(json.data) ? json.data : Array.isArray(json.results) ? json.results : Array.isArray(json) ? json : null;
  if (list === null) throw new Error('Invalid case-list response. Please try again.');
  return list as DbCaseRecord[];
}

// 2. Fetch AICS Cases
export async function apiGetAicsCases(filters?: { status?: string; aics_type?: string; search?: string; barangay?: string; queue?: "secretary" }) {
  const params = new URLSearchParams();
  if (filters?.status && filters.status !== 'all') params.set('status', filters.status);
  if (filters?.aics_type && filters.aics_type !== 'all') params.set('aics_type', filters.aics_type);
  if (filters?.search) params.set('search', filters.search);
  if (filters?.barangay && filters.barangay !== 'all') params.set('barangay', filters.barangay);
  if (filters?.queue) params.set('queue', filters.queue);

  const url = `/api/cases/aics${params.toString() ? `?${params.toString()}` : ''}`;
  const res = await authFetch(url, { cache: 'no-store' });
  if (!res.ok) {
    const errorJson = await res.json().catch(() => ({}));
    throw new Error(extractErrorMessage(errorJson, `Failed to fetch AICS cases: ${res.statusText}`));
  }
  const json = await res.json();
  const list = Array.isArray(json.data) ? json.data : Array.isArray(json.results) ? json.results : Array.isArray(json) ? json : null;
  if (list === null) throw new Error('Invalid case-list response. Please try again.');
  return list as DbCaseRecord[];
}

// 3. Fetch Case Record & Audit Log by ID
export async function apiGetCaseById(idOrCaseNumber: string | number, moduleHint?: string) {
  const url = `/api/cases/${encodeURIComponent(String(idOrCaseNumber))}${moduleHint ? `?module=${encodeURIComponent(moduleHint)}` : ''}`;
  const res = await authFetch(url, { cache: 'no-store' });
  if (!res.ok) {
    const errorJson = await res.json().catch(() => ({}));
    throw new Error(extractErrorMessage(errorJson, `Failed to fetch case ${idOrCaseNumber}: ${res.statusText}`));
  }
  return await res.json();
}

// Save individual attributes without replacing them with a formatted display name.
export async function apiUpdateCaseNames(
  idOrCaseNumber: string | number,
  names: SeparatedNameFields,
  module: 'women-solo-parent' | 'aics',
): Promise<DbCaseRecord> {
  const res = await authFetch(`/api/cases/${module}/${encodeURIComponent(String(idOrCaseNumber))}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(mapNameFields(names)),
  });
  if (!res.ok) {
    const errorJson = await res.json().catch(() => ({}));
    throw new Error(extractErrorMessage(errorJson, 'Could not save beneficiary name fields.'));
  }
  const json = await res.json();
  notifyDataUpdated();
  return (json.data || json) as DbCaseRecord;
}

// 4. Update Step & Persist to PostgreSQL (Steps 1 to 8)
export async function apiUpdateCaseStep(idOrCaseNumber: string | number, payload: any, documents: IntakeDocument[] = []) {
  const hint = payload.moduleType;
  const namespace = hint === 'aics' ? 'aics' : hint ? 'women-solo-parent' : null;
  const url = `/api/cases/${namespace ? namespace + '/' : ''}${encodeURIComponent(String(idOrCaseNumber))}/step`;
  const request: RequestInit = documents.length ? { ...intakeRequest(payload, documents), method: 'PATCH' } : {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  };
  const res = await authFetch(url, request);

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
  firstName: string;
  middleName?: string;
  lastName: string;
  extensionName?: string;
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
  const res = await authFetch('/api/cases/women-solo-parent', intakeRequest(data, documents));

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
  firstName: string;
  middleName?: string;
  lastName: string;
  extensionName?: string;
  birthDate?: string;
  gender?: string;
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
  const res = await authFetch('/api/cases/aics', intakeRequest(data, documents));

  if (!res.ok) {
    const errorJson = await res.json().catch(() => ({}));
    throw new Error(extractErrorMessage(errorJson, `Failed to register AICS intake: ${res.statusText}`));
  }

  const json = await res.json();
  notifyDataUpdated();
  return (json.data || json) as DbCaseRecord;
}

export type DashboardPeriod = 'all' | 'month' | 'year';
export interface DashboardFilters {
  period?: DashboardPeriod;
  barangay?: string;
}
export interface DashboardStats {
  filteredRecords?: Array<{ id: string; name: string; barangay: string; program: string; status: string; module: string }>;
  matchedRecords?: number;
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
export async function apiGetDashboardStats(filters: DashboardFilters = {}, signal?: AbortSignal): Promise<DashboardStats> {
  const query = new URLSearchParams();
  if (filters.period) query.set('period', filters.period);
  if (filters.barangay) query.set('barangay', filters.barangay);
  const res = await authFetch(`/api/dashboard/stats${query.size ? `?${query}` : ''}`, { cache: 'no-store', signal });
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
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        const channel = new BroadcastChannel('benefitrack:case-updates');
        channel.postMessage('updated');
        channel.close();
      } else {
        localStorage.setItem('benefitrack:data-updated', `${Date.now()}:${Math.random()}`);
      }
    } catch {}
  }
}

export function subscribeDataUpdated(callback: () => void | Promise<void>) {
  if (typeof window === 'undefined') return () => {};
  let disposed = false;
  let running = false;
  let queued = false;
  const run = async () => {
    if (disposed) return;
    if (running) { queued = true; return; }
    running = true;
    try { await callback(); }
    catch (error) { console.warn('[BENEFITRACK] Could not refresh data:', error); }
    finally {
      running = false;
      if (queued && !disposed) { queued = false; void run(); }
    }
  };
  const handler = () => { void run(); };
  const visibleHandler = () => { if (document.visibilityState === 'visible') handler(); };
  const storageHandler = (event: StorageEvent) => { if (event.key === 'benefitrack:data-updated') handler(); };
  let channel: BroadcastChannel | undefined;
  try {
    if (typeof BroadcastChannel !== 'undefined') {
      channel = new BroadcastChannel('benefitrack:case-updates');
      channel.onmessage = handler;
    }
  } catch {}
  const poll = window.setInterval(visibleHandler, 2000);
  window.addEventListener('benefitrack:data-updated', handler);
  window.addEventListener('focus', handler);
  window.addEventListener('storage', storageHandler);
  document.addEventListener('visibilitychange', visibleHandler);
  return () => {
    disposed = true;
    window.removeEventListener('benefitrack:data-updated', handler);
    window.removeEventListener('focus', handler);
    window.removeEventListener('storage', storageHandler);
    document.removeEventListener('visibilitychange', visibleHandler);
    window.clearInterval(poll);
    channel?.close();
  };
}

export async function apiResubmitReturnedCase(id: string | number, names: SeparatedNameFields & { birthDate?: string; gender?: string; civilStatus?: string; contactNumber?: string } & Record<string, unknown>, module: 'women-solo-parent' | 'aics', version?: number, documents: IntakeDocument[] = []) {
  return apiUpdateCaseStep(id, {
    ...names, ...mapNameFields(names), status: 'BARANGAY_ENDORSED', expected_version: version,
    moduleType: module === 'aics' ? 'aics' : 'solo-parent',
    action_note: 'Barangay submitted applicant corrections for renewed MSWD review.',
  }, documents);
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


export function getCorrectionNotes(record?: DbCaseRecord): string {
  const value = record?.correction_notes ?? record?.workflow_data?.correctionNotes;
  if (typeof value === 'string' && value.trim()) return value.trim();
  const logs = record?.monitoring_logs;
  if (Array.isArray(logs)) {
    const returned = [...logs].reverse().find((log: any) => log?.action === 'RETURNED_FOR_CORRECTION');
    if (typeof (returned as any)?.note === 'string') return (returned as any).note;
  }
  return 'No correction instructions were recorded. Please contact MSWD before resubmitting.';
}

export async function apiReturnCaseForCorrection(id: string | number, notes: string, module: 'women-solo-parent' | 'aics', version?: number, sourceStatus?: string) {
  if (!notes.trim()) throw new Error('Specific correction instructions are required.');
  const moduleType = module === 'aics' ? 'aics' : 'solo-parent';
  let expectedVersion = version;
  if (sourceStatus === 'BARANGAY_ENDORSED') {
    const acknowledged = await apiUpdateCaseStep(id, {
      moduleType, status: 'UNDER_REVIEW', expected_version: expectedVersion,
      action_note: 'MSWD acknowledged the endorsement for profile review.',
    });
    expectedVersion = acknowledged.workflow_version;
  }
  return apiUpdateCaseStep(id, {
    moduleType, status: 'RETURNED_FOR_CORRECTION', expected_version: expectedVersion,
    correctionNotes: notes.trim(), action_note: notes.trim(),
  });
}
