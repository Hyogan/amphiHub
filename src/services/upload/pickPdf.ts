import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";

import { MAX_PDF_BYTES } from "@/features/contribute/types/contribution";

export interface PickedPdf {
  uri: string;
  name: string;
  sizeBytes: number;
}

export type PickPdfResult =
  | { status: "picked"; file: PickedPdf }
  | { status: "cancelled" }
  | { status: "error"; error: "type" | "size" | "empty" };

export async function pickPdf(): Promise<PickPdfResult> {
  const result = await DocumentPicker.getDocumentAsync({
    type: "application/pdf",
    copyToCacheDirectory: true,
  });
  if (result.canceled || !result.assets[0]) return { status: "cancelled" };

  const asset = result.assets[0];
  if (asset.mimeType && asset.mimeType !== "application/pdf") {
    return { status: "error", error: "type" };
  }
  const info = await FileSystem.getInfoAsync(asset.uri);
  const sizeBytes = info.exists ? info.size : (asset.size ?? 0);
  if (sizeBytes <= 0) return { status: "error", error: "empty" };
  if (sizeBytes > MAX_PDF_BYTES) return { status: "error", error: "size" };

  return {
    status: "picked",
    file: { uri: asset.uri, name: asset.name, sizeBytes },
  };
}
