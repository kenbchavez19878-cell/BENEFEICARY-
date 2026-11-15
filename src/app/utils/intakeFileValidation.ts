export const MAX_INTAKE_FILE_SIZE = 10 * 1024 * 1024;

const ALLOWED_FILE_TYPES = new Map([
  ["pdf", "application/pdf"],
  ["jpg", "image/jpeg"],
  ["jpeg", "image/jpeg"],
  ["png", "image/png"],
]);

export function getIntakeFileError(file: Pick<File, "name" | "size" | "type">): string | null {
  const extension = file.name.match(/\.([^.]+)$/)?.[1].toLowerCase() || "";
  const expectedType = ALLOWED_FILE_TYPES.get(extension);
  // Some browsers leave the MIME type empty; the server also checks file contents.
  if (!expectedType || (file.type && file.type.toLowerCase() !== expectedType)) {
    return `"${file.name}" must be a PDF, JPG/JPEG, or PNG file.`;
  }
  if (file.size === 0) {
    return `"${file.name}" is empty. Please select a non-empty file.`;
  }
  if (file.size > MAX_INTAKE_FILE_SIZE) {
    return `"${file.name}" exceeds the 10 MB limit. Please select a smaller file.`;
  }
  return null;
}
