import { useState, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import { Button } from './ui/button';
import { IntakeDocumentUploads } from './IntakeDocumentUploads';
import { apiUploadPayoutProof, type DbCaseRecord, type IntakeDocument } from '../services/caseService';
import { PayoutProofPreview } from './PayoutProofPreview';
import { hasMatchingPayoutProof, type PayoutProof } from '../utils/payoutProof';
import { getIntakeFileError } from '../utils/intakeFileValidation';

export function PayoutProofVerification({ caseNumber, moduleType, expectedVersion, payoutDate, amount, approval, proofs = [], canUpload, onUploaded, onSavingChange }: {
  caseNumber: string; moduleType: string; expectedVersion?: number; payoutDate: string; amount: number;
  approval?: string; proofs?: PayoutProof[]; canUpload: boolean; onUploaded: (record: DbCaseRecord) => void; onSavingChange?: (saving: boolean) => void;
}) {
  const [proofType, setProofType] = useState<'OFFICIAL_RECEIPT' | 'PAYOUT_PHOTO'>('OFFICIAL_RECEIPT');
  const [documents, setDocuments] = useState<IntakeDocument[]>([]);
  const [receiptNumber, setReceiptNumber] = useState('');
  const [recipient, setRecipient] = useState('');
  const [notes, setNotes] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [saving, setSaving] = useState(false);
  const inFlight = useRef(false);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; onSavingChange?.(false); };
  }, [onSavingChange]);
  const verified = hasMatchingPayoutProof(proofs, amount, payoutDate, approval);

  const saveProof = async () => {
    if (inFlight.current || !canUpload) return;
    const file = documents[0]?.file;
    if (!file) { toast.error('Select an Official Receipt or payout photo.'); return; }
    const error = getIntakeFileError(file);
    if (error) { toast.error(error); return; }
    if (proofType === 'PAYOUT_PHOTO' && !/\.(jpg|jpeg|png)$/i.test(file.name)) { toast.error('Payout photos must be JPG or PNG images.'); return; }
    if (!receiptNumber.trim()) { toast.error('Enter the Official Receipt number.'); return; }
    if (recipient.trim().length < 2 || !/\p{L}/u.test(recipient)) { toast.error('Enter the beneficiary, parent, or authorized recipient name.'); return; }
    if (!payoutDate) { toast.error('Set the payout date before verifying proof.'); return; }
    if (!confirmed) { toast.error('Confirm that the named recipient received the assistance.'); return; }
    if (expectedVersion == null) { toast.error('Reload the saved case before verifying payout proof.'); return; }
    inFlight.current = true;
    setSaving(true);
    onSavingChange?.(true);
    try {
      const updated = await apiUploadPayoutProof(caseNumber, { moduleType, expected_version: expectedVersion,
        proof_type: proofType, receipt_number: receiptNumber.trim(), received_by: recipient.trim(),
        released_on: payoutDate, confirmed_received: confirmed, notes: notes.trim() }, file);
      if (!mounted.current) return;
      onUploaded(updated);
      setDocuments([]); setReceiptNumber(''); setRecipient(''); setNotes(''); setConfirmed(false);
      toast.success('Payout proof verified and recorded in the beneficiary case history.');
    } catch (error) {
      if (mounted.current) toast.error(error instanceof Error ? error.message : 'Could not save payout proof.');
    } finally {
      inFlight.current = false;
      if (mounted.current) { setSaving(false); onSavingChange?.(false); }
    }
  };

  return <section className="space-y-3 rounded-xl border border-gray-200 bg-gray-50 p-4" aria-label="Payout proof verification">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <h4 className="text-xs font-bold text-blue-900">Disbursement / Payout Proof</h4>
      <span className="text-xs font-semibold text-gray-700">{verified ? 'Verified for this payout' : canUpload ? 'Proof required before completion' : 'Recorded payout evidence'}</span>
    </div>
    {proofs.map(proof => <div key={proof.id} className="space-y-1 rounded-lg border border-gray-200 bg-white p-3 text-xs">
      <PayoutProofPreview proof={proof} />
      <p className="break-words text-gray-700">Recipient: {proof.received_by} - PHP {Number(proof.amount).toLocaleString()} - {proof.released_on}</p>
      {proof.receipt_number && <p className="text-gray-600">OR: {proof.receipt_number}</p>}
      <p className="text-gray-500">Verified by {proof.verified_by_name} on {new Date(proof.verified_at).toLocaleString()}</p>
      {proof.notes && <p className="whitespace-pre-wrap break-words text-gray-600">{proof.notes}</p>}
      {!proof.available && <p className="text-red-700">The uploaded file is unavailable. A valid proof file is required.</p>}
    </div>)}
    {!proofs.length && !canUpload && <p className="text-xs text-gray-500">No payout proof has been recorded.</p>}
    {canUpload && <div className="space-y-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="space-y-1 text-xs font-semibold text-gray-700">Proof type
          <select aria-label="Payout proof type" value={proofType} disabled={saving} onChange={event => setProofType(event.target.value as typeof proofType)} className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs">
            <option value="OFFICIAL_RECEIPT">Official Receipt (OR)</option><option value="PAYOUT_PHOTO">Payout Photo</option>
          </select>
        </label>
        <label className="space-y-1 text-xs font-semibold text-gray-700">Official Receipt (OR) number *
          <input required aria-required="true" aria-label="Official Receipt number" value={receiptNumber} maxLength={120} disabled={saving} onChange={event => setReceiptNumber(event.target.value)} className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs" />
        </label>
      </div>
      <label className="block space-y-1 text-xs font-semibold text-gray-700">Recipient (beneficiary / parent / authorized representative)
        <input aria-label="Payout recipient name" value={recipient} maxLength={150} disabled={saving} onChange={event => setRecipient(event.target.value)} className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs" />
      </label>
      <IntakeDocumentUploads requirements={[{ id: 'payout-proof', name: 'Receipt PDF / image or payout photo' }]} documents={documents} onChange={setDocuments} disabled={saving} />
      <label className="block space-y-1 text-xs font-semibold text-gray-700">Verification remarks (optional)
        <textarea aria-label="Payout verification remarks" value={notes} maxLength={2000} rows={2} disabled={saving} onChange={event => setNotes(event.target.value)} className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs" />
      </label>
      <label className="flex items-start gap-2 text-xs text-gray-700">
        <input type="checkbox" checked={confirmed} disabled={saving} onChange={event => setConfirmed(event.target.checked)} />
        I confirm this evidence shows that the named recipient received the approved financial assistance.
      </label>
      <Button type="button" disabled={saving} onClick={() => void saveProof()} className="bg-blue-900 text-xs text-white hover:bg-blue-800">
        {saving ? 'Saving proof...' : 'Upload & Verify Payout Proof'}
      </Button>
    </div>}
  </section>;
}
