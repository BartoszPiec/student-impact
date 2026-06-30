export function storageDownloadUrl(ref: string): string {
  return `/api/storage/download?ref=${encodeURIComponent(ref)}`;
}
