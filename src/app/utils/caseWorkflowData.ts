import { hasMatchingPayoutProof } from "./payoutProof";
import type { CaseData } from "../components/MSWDCaseWorkflowModal";

export const ELIGIBILITY_CODES: Record<string, string> = {
  Eligible: "ELIGIBLE", "Not Eligible": "NOT_ELIGIBLE",
  "Additional Requirements Needed": "ADDITIONAL_REQUIREMENTS", "For Referral": "FOR_REFERRAL",
};

export function nonFinancialKind(state: CaseData): "Direct Service" | "Referral" | null {
  const value = state.moduleType === "aics" ? state.servicePlan.approvedFinancialAmount : state.servicePlan.emergencyCashAidAmount;
  if (value !== 0) return null;
  if (state.eligibility.status === "For Referral" && state.servicePlan.nonMonetarySupport?.trim()) return "Referral";
  if (state.servicePlan.referrals?.length) return "Referral";
  return state.servicePlan.nonMonetarySupport?.trim() ? "Direct Service" : null;
}

export function releaseMethod(state: CaseData): CaseData["serviceRelease"]["releaseMethod"] {
  const kind = nonFinancialKind(state);
  if (kind) return ["Direct Service", "Referral"].includes(state.serviceRelease.releaseMethod) ? state.serviceRelease.releaseMethod : kind;
  return ["Direct Service", "Referral"].includes(state.serviceRelease.releaseMethod) ? "Cash Payout" : state.serviceRelease.releaseMethod;
}

export function accessibleStep(state: CaseData): number {
  if (state.statusCode === "IN_ASSESSMENT" && state.completedActivities?.assessment) return 4;
  const stage = { BARANGAY_ENDORSED: 1, UNDER_REVIEW: 2, RETURNED_FOR_CORRECTION: 2,
    IN_ASSESSMENT: 3, ELIGIBILITY_EVALUATED: 5, APPROVED_FOR_RELEASE: 6, RELEASED_COMPLETED: 7, CASE_CLOSED: 8 }[state.statusCode];
  return state.statusCode === "RELEASED_COMPLETED" && state.completedActivities?.monitoring ? 8 : stage;
}

export function getWorkflowStepError(state: CaseData, step: number): string | null {
  if (step === 3 && (!state.socialAssessment.intakeNotes.trim() || !state.socialAssessment.caseStudySummary.trim() || !state.socialAssessment.assignedSocialWorker.trim())) {
    return "Enter the assigned social worker, intake notes, and case study summary.";
  }
  if (step === 4 && (!["Eligible", "For Referral"].includes(state.eligibility.status) || !state.eligibility.notes.trim())) {
    return "Record eligibility/referral and evaluation notes before planning.";
  }
  if (step === 5) {
    const amount = state.moduleType === "aics" ? state.servicePlan.approvedFinancialAmount : state.servicePlan.emergencyCashAidAmount;
    if (state.eligibility.status === "For Referral" && amount > 0) return "For Referral requires a zero cash amount and a referral service. Choose Eligible in Step 4 to approve financial assistance.";
    if (!Number.isFinite(amount) || amount < 0 || (amount === 0 && !nonFinancialKind(state))) return "Enter a positive amount or identify a zero-amount direct service/referral.";
    if (state.moduleType === "solo-parent" && (!state.servicePlan.spicNumber.trim() || !state.servicePlan.purchaseBookletNumber.trim())) {
      return "Enter the Solo Parent ID and purchase booklet numbers.";
    }
  }
  if (step === 6) {
    const officer = state.serviceRelease.payoutOfficer;
    if (!state.serviceRelease.payoutDate || typeof officer !== "string" || officer.trim().length < 2 || officer.trim().length > 150 || !/\p{L}/u.test(officer) || /^(n\/?a|none|null|unknown|tbd|officer|mswd staff|staff|test)$/i.test(officer.trim())) return "Enter the release date and accountable payout/service officer name.";
    if (!Number.isFinite(state.serviceRelease.approvedAmount) || state.serviceRelease.approvedAmount < 0 || (!nonFinancialKind(state) && state.serviceRelease.approvedAmount <= 0)) return "Enter the approved payout amount; nonfinancial services use zero.";
    const approved = state.moduleType === "aics" ? state.servicePlan.approvedFinancialAmount : state.servicePlan.emergencyCashAidAmount;
    if (state.serviceRelease.approvedAmount !== approved) return "Release amount must match the approved plan.";
    if (releaseMethod(state) === "Guarantee Letter / GL" && !state.serviceRelease.guaranteeLetterNumber.trim()) return "Enter the guarantee letter number.";
  }
  if (step === 8 && state.eligibility.status !== 'Not Eligible' && !nonFinancialKind(state)) {
    const approved = state.moduleType === 'aics' ? state.servicePlan.approvedFinancialAmount : state.servicePlan.emergencyCashAidAmount;
    if (approved > 0 && !hasMatchingPayoutProof(state.payoutProofs, approved, state.serviceRelease.payoutDate, state.completedActivities?.approval)) return 'In Step 8, upload and verify payout proof with an OR number before closing this financial assistance case.';
  }
  if (step === 8 && !state.closureNotes?.trim()) return "Enter the closure notes before closing this case.";
  return null;
}

export function workflowStepPayload(state: CaseData, step: number): Record<string, unknown> {
  if (step === 3) return {
    socialAssessment: state.socialAssessment,
    assessment_notes: state.socialAssessment.intakeNotes,
    vulnerability_level: state.socialAssessment.vulnerabilityLevel.toUpperCase(),
  };
  if (step === 4) return {
    eligibility: ELIGIBILITY_CODES[state.eligibility.status],
    eligibilityDetails: { ...state.eligibility, evaluatedDate: new Date().toLocaleDateString("en-CA") },
  };
  if (step === 5) return {
    servicePlan: state.servicePlan,
    ...(state.moduleType === "aics" ? {
      approved_amount: state.servicePlan.approvedFinancialAmount,
      aics_type: state.servicePlan.crisisType.toUpperCase().replace(/ /g, "_"),
    } : {
      spic_number: state.servicePlan.spicNumber,
      booklet_number: state.servicePlan.purchaseBookletNumber,
      financial_aid_amount: state.servicePlan.emergencyCashAidAmount,
      referrals: state.servicePlan.referrals,
    }),
  };
  if (step === 6) return {
    serviceRelease: { ...state.serviceRelease, releaseMethod: releaseMethod(state) },
    release_method: { "Cash Payout": "CASH", Check: "CHECK", "Guarantee Letter / GL": "GUARANTEE_LETTER", "Direct Service": "DIRECT_SERVICE", Referral: "REFERRAL" }[releaseMethod(state)],
    guarantee_letter_number: state.serviceRelease.guaranteeLetterNumber || null,
    payout_date: state.serviceRelease.payoutDate,
    ...(state.moduleType === "aics" ? { approved_amount: state.serviceRelease.approvedAmount } : { financial_aid_amount: state.serviceRelease.approvedAmount }),
  };
  if (step === 8) return { closureNotes: state.closureNotes?.trim() };
  return {};
}
