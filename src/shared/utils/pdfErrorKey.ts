const KEYS: Record<string, string> = {
  "file-not-found": "reader.errorMissing",
  "invalid-pdf": "reader.errorInvalid",
  "unsupported-pdf": "reader.errorProtected",
  "password-required": "reader.errorProtected",
  "invalid-password": "reader.errorProtected",
  "out-of-memory": "reader.errorMemory",
};

/** Translation key (resources namespace) for a PDF viewer error code. */
export function pdfErrorKey(code: string): string {
  return KEYS[code] ?? "reader.errorGeneric";
}
