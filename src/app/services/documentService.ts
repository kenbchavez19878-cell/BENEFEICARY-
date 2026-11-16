import { authFetch } from "./authService";

export async function openDocumentPreview(url: string) {
  const preview = window.open('', '_blank');
  if (!preview) throw new Error('Allow pop-ups to open the uploaded document.');
  preview.opener = null;
  try {
    const response = await authFetch(url, { cache: 'no-store' });
    if (!response.ok) throw new Error('Could not open the document. Please check your session and access permissions.');
    const objectUrl = URL.createObjectURL(await response.blob());
    preview.location.replace(objectUrl);
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60000);
  } catch (error) {
    preview.close();
    throw error;
  }
}
