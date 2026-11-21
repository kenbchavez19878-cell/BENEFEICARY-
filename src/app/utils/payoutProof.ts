export interface PayoutProof {
  id: number;
  proof_type: 'OFFICIAL_RECEIPT' | 'PAYOUT_PHOTO';
  fileRef: string;
  fileUrl: string;
  content_type?: string;
  available: boolean;
  receipt_number: string;
  received_by: string;
  amount: string;
  released_on: string;
  approval_checkpoint: string;
  notes: string;
  verified_by_id: number;
  verified_by_name: string;
  verified_at: string;
}

export function hasMatchingPayoutProof(proofs: PayoutProof[] = [], amount: number, payoutDate: string, approval = '') {
  return amount > 0 && Boolean(payoutDate) && proofs.some(proof => proof.available && Boolean(proof.receipt_number?.trim()) && Number(proof.amount) === amount && proof.released_on === payoutDate && proof.approval_checkpoint === approval);
}
