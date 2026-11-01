import "expo-sqlite/localStorage/install";
import type { PdfViewport } from "react-native-better-pdf";

const keyFor = (resourceId: string) => `amphihub.reader.${resourceId}`;

export function loadReaderViewport(
  resourceId: string,
): PdfViewport | undefined {
  try {
    const raw = localStorage.getItem(keyFor(resourceId));
    return raw ? (JSON.parse(raw) as PdfViewport) : undefined;
  } catch {
    return undefined;
  }
}

export function saveReaderViewport(resourceId: string, viewport: PdfViewport) {
  try {
    localStorage.setItem(keyFor(resourceId), JSON.stringify(viewport));
  } catch {
    // Losing the reading position is harmless.
  }
}

export function clearReaderViewport(resourceId: string) {
  try {
    localStorage.removeItem(keyFor(resourceId));
  } catch {
    // Nothing to clear.
  }
}
