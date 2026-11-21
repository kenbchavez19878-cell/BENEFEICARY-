import { useEffect, useRef, useState } from 'react';
import { FileText, ImageIcon, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { authFetch } from '../services/authService';
import type { PayoutProof } from '../utils/payoutProof';

export function PayoutProofPreview({ proof, compact = false }: { proof: PayoutProof; compact?: boolean }) {
  const [open, setOpen] = useState(false);
  const [visible, setVisible] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [resource, setResource] = useState<{ url: string; type: string } | null>(null);
  const [error, setError] = useState('');
  const trigger = useRef<HTMLButtonElement>(null);
  const isImage = proof.content_type?.startsWith('image/') || /\.(png|jpe?g)$/i.test(proof.fileRef);
  const shouldLoad = open || Boolean(!compact && isImage && visible);

  useEffect(() => {
    const element = trigger.current;
    if (!element || !isImage) return;
    if (!('IntersectionObserver' in window)) { setVisible(true); return; }
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) { setVisible(true); observer.disconnect(); }
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [isImage]);

  useEffect(() => {
    if (!shouldLoad) { setResource(null); setError(''); return; }
    const controller = new AbortController();
    let objectUrl = '';
    setResource(null); setError('');
    void (async () => {
      try {
        const response = await authFetch(proof.fileUrl, { cache: 'no-store', signal: controller.signal });
        if (!response.ok) throw new Error('Could not load the payout evidence. Check your session and file access, then retry.');
        const type = (response.headers.get('Content-Type') || '').split(';')[0].trim();
        if (!['application/pdf', 'image/jpeg', 'image/png'].includes(type)) throw new Error('This file cannot be previewed as a receipt or payout photo.');
        const blob = await response.blob();
        if (controller.signal.aborted) return;
        objectUrl = URL.createObjectURL(blob);
        setResource({ url: objectUrl, type });
      } catch (error) {
        if (!controller.signal.aborted) setError(error instanceof Error ? error.message : 'Could not load payout evidence.');
      }
    })();
    return () => { controller.abort(); if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [proof.fileUrl, shouldLoad, attempt]);

  return <>
    {compact ? <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)} title={`OR: ${proof.receipt_number || 'Not recorded'} - ${proof.fileRef}`} aria-label={`View Proof: ${proof.fileRef}`} className="bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-100 font-bold">View Proof</Button> : <button ref={trigger} type="button" onClick={() => setOpen(true)} aria-label={`Preview payout proof: ${proof.fileRef}`}
      className="flex max-w-full items-center gap-3 text-left text-xs text-blue-700 hover:text-blue-900 focus-visible:outline-2 focus-visible:outline-blue-500">
      <span className="flex h-16 w-24 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
        {resource?.type.startsWith('image/') && !error ? <img src={resource.url} alt={`Thumbnail: ${proof.fileRef}`} className="h-full w-full object-cover" onError={() => setError("The uploaded image could not be displayed. Upload a valid JPG or PNG image.")} />
          : isImage ? <ImageIcon className="size-6 text-blue-700" /> : <FileText className="size-6 text-blue-700" />}
      </span>
      <span className="min-w-0 break-words font-semibold underline">{proof.fileRef}<span className="block text-[11px] font-normal">Click to preview {isImage ? 'photo' : 'receipt'}</span></span>
    </button>}
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-h-[90vh] overflow-y-auto bg-white sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle className="break-words text-blue-900">Payout evidence: {proof.fileRef}</DialogTitle>
          <DialogDescription className="break-words">OR: {proof.receipt_number || 'Not recorded'} - Recipient: {proof.received_by} - PHP {Number(proof.amount).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</DialogDescription>
        </DialogHeader>
        {error ? <div className="space-y-3 text-sm text-gray-700"><p role="alert">{error}</p><Button type="button" variant="outline" onClick={() => setAttempt(value => value + 1)}>Retry preview</Button></div>
          : !resource ? <div role="status" className="flex items-center justify-center gap-2 p-8 text-sm text-gray-600"><Loader2 className="size-4 animate-spin" />Loading payout evidence...</div>
          : resource.type.startsWith('image/') ? <img src={resource.url} alt={`Payout evidence: ${proof.fileRef}`} className="max-h-[65vh] w-full rounded-lg object-contain" onError={() => setError("The uploaded image could not be displayed. Upload a valid JPG or PNG image.")} />
          : <iframe src={resource.url} title="Official Receipt preview" className="h-[60vh] w-full rounded-lg border border-gray-200" />}
        <p className="break-words text-xs text-gray-500">Payout date: {proof.released_on}. Verified by {proof.verified_by_name} on {new Date(proof.verified_at).toLocaleString()}.</p>
      </DialogContent>
    </Dialog>
  </>;
}

export function PayoutProofActions({ proofs = [] }: { proofs?: PayoutProof[] }) {
  return <>{proofs.map(proof => <PayoutProofPreview key={proof.id} proof={proof} compact />)}</>;
}

export function PayoutProofGallery({ proofs = [] }: { proofs?: PayoutProof[] }) {
  if (!proofs.length) return null;
  return <section className="space-y-3 rounded-xl border border-gray-200 bg-gray-50 p-4" aria-label="Beneficiary payout evidence">
    <h3 className="text-xs font-bold uppercase tracking-widest text-blue-900">Payout Evidence &amp; Official Receipts</h3>
    {proofs.map(proof => <div key={proof.id} className="space-y-1 rounded-lg border border-gray-200 bg-white p-3 text-xs">
      <PayoutProofPreview proof={proof} />
      <p className="break-words text-gray-700">OR: {proof.receipt_number || 'Not recorded'} - Recipient: {proof.received_by}</p>
      <p className="break-words text-gray-500">PHP {Number(proof.amount).toLocaleString('en-PH', { minimumFractionDigits: 2 })} - {proof.released_on} - Verified by {proof.verified_by_name}</p>
    </div>)}
  </section>;
}
