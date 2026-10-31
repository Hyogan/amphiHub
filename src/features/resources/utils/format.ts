/** "1,2 Mo" in French, "1.2 MB" in English. */
export function formatFileSize(bytes: number, language: string): string {
  const fr = language !== 'en';
  const kb = bytes / 1024;
  if (kb < 1024) return `${Math.max(1, Math.round(kb))} ${fr ? 'Ko' : 'KB'}`;
  const mb = (kb / 1024).toFixed(1);
  return `${fr ? mb.replace('.', ',') : mb} ${fr ? 'Mo' : 'MB'}`;
}
