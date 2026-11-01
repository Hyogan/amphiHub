import * as Crypto from "expo-crypto";
import { File } from "expo-file-system";
import { PdfDocument, PdfOpenError } from "react-native-better-pdf";

import {
    MAX_PDF_BYTES,
    toRawResourceInsert,
    type ContributionInput,
} from "@/features/contribute/types/contribution";
import { contributionApi } from "@/services/api/contributionApi";
import { sha256OfBytes } from "@/services/download/fileHash";

import type { PickedPdf } from "./pickPdf";

export type ContributionErrorKind = "file" | "upload" | "save" | "finalize";

export class ContributionError extends Error {
  constructor(
    public kind: ContributionErrorKind,
    public original?: unknown,
  ) {
    super(kind);
  }
}

/** Opening the file also proves it is a real PDF before anything is uploaded. */
async function readPageCount(uri: string): Promise<number | null> {
  try {
    const document = await PdfDocument.open({ uri });
    try {
      return document.pageCount;
    } finally {
      document.close();
    }
  } catch (error) {
    if (
      error instanceof PdfOpenError &&
      (error.code === "invalid-pdf" || error.code === "file-not-found")
    ) {
      throw new ContributionError("file", error);
    }
    // Protected files, or phones that cannot read them: not a reason to refuse.
    return null;
  }
}

/**
 * Read and check the file, upload it, create the resource and file rows, then finalize.
 * Upload comes first: a failed upload leaves nothing behind. The hash is only a hint for the server.
 */
export async function submitContribution(input: {
  file: PickedPdf;
  values: ContributionInput;
  userId: string;
}): Promise<{ resourceId: string }> {
  const { file, values, userId } = input;
  const resourceId = Crypto.randomUUID();
  const fileId = Crypto.randomUUID();
  const storagePath = `incoming/${userId}/${fileId}.pdf`;

  let bytes: Uint8Array;
  try {
    bytes = await new File(file.uri).bytes();
  } catch (error) {
    throw new ContributionError("file", error);
  }
  if (bytes.length === 0 || bytes.length > MAX_PDF_BYTES) {
    throw new ContributionError("file");
  }
  const pageCount = await readPageCount(file.uri);
  const sha256 = await sha256OfBytes(bytes);

  try {
    await contributionApi.uploadPdf(storagePath, bytes);
  } catch (error) {
    throw new ContributionError("upload", error);
  }

  try {
    await contributionApi.insertResource(
      toRawResourceInsert(values, { resourceId, userId }),
    );
    await contributionApi.insertFile({
      id: fileId,
      resource_id: resourceId,
      storage_path: storagePath,
      size_bytes: bytes.length,
    });
  } catch (error) {
    throw new ContributionError("save", error);
  }

  try {
    await contributionApi.finalizeFile(fileId, sha256, pageCount);
  } catch (error) {
    throw new ContributionError("finalize", error);
  }
  return { resourceId };
}
