import type { DocumentCheckItem } from "../components/MSWDCaseWorkflowModal";

export function getDocumentReviewLabel(doc: DocumentCheckItem, caseStatus?: string): string {
  if (doc.status === "Valid") return "Approved";
  if (caseStatus === "RETURNED_FOR_CORRECTION") return "Returned for Correction";
  if (doc.status === "Invalid") return "Correction Required";
  return doc.reviewed ? "Reviewed (Incomplete)" : "Pending Review";
}

export function getDocumentReviewSummary(documents: DocumentCheckItem[], caseStatus?: string) {
  if (caseStatus === "RETURNED_FOR_CORRECTION") {
    return { label: "Returned for Correction", tone: "correction" } as const;
  }
  if (documents.length === 0) return { label: "No Documents Uploaded", tone: "pending" } as const;
  if (documents.every((doc) => doc.status === "Valid")) {
    return { label: "Approved", tone: "approved" } as const;
  }
  if (documents.some((doc) => doc.status === "Invalid")) {
    return { label: "Correction Required", tone: "correction" } as const;
  }
  const reviewed = documents.filter((doc) => doc.reviewed || doc.status !== "Incomplete").length;
  return {
    label: reviewed === documents.length ? "Reviewed (Incomplete)" : reviewed > 0 ? "Review In Progress" : "Pending Review",
    tone: "pending",
  } as const;
}
