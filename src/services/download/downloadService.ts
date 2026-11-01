import { clearReaderViewport } from "@/services/storage/readerPosition";
import * as FileSystem from "expo-file-system/legacy";

import {
  toDownloadFileInfo,
  toDownloadRecord,
  toRawDownloadRow,
  type DownloadRecord,
} from "@/features/library/types/download";
import type { ResourceSummary } from "@/features/resources/types/resource";
import { downloadApi } from "@/services/api/downloadApi";
import { downloadsDb } from "@/services/storage/downloadsDb";

import { sha256OfFile } from "./fileHash";

const DIRECTORY = `${FileSystem.documentDirectory}downloads/`;

export type DownloadErrorKind =
  | "unavailable"
  | "integrity"
  | "cancelled"
  | "failed";

export class DownloadError extends Error {
  constructor(
    public kind: DownloadErrorKind,
    public original?: unknown,
  ) {
    super(kind);
  }
}

/** Downloads in progress. Not Redux: functions are not serialisable. */
const active = new Map<
  string,
  { cancelled: boolean; pause: () => Promise<unknown> }
>();

async function discard(uri: string) {
  await FileSystem.deleteAsync(uri, { idempotent: true });
}

/**
 * Signed link, then download to a temporary file, then size and hash check, then move into place.
 * A file that fails a check is deleted and never recorded.
 */
export async function downloadResource(
  resource: ResourceSummary,
  onProgress: (fraction: number) => void,
): Promise<DownloadRecord> {
  if (active.has(resource.id)) throw new DownloadError("failed");

  const raw = await downloadApi.getFileInfo(resource.id);
  if (!raw) throw new DownloadError("unavailable");
  const info = toDownloadFileInfo(raw);

  await FileSystem.makeDirectoryAsync(DIRECTORY, { intermediates: true });
  const destination = `${DIRECTORY}${resource.id}-${info.fileId}.pdf`;
  const temporary = `${destination}.part`;

  try {
    const url = await downloadApi.createSignedUrl(info.storagePath);
    const resumable = FileSystem.createDownloadResumable(
      url,
      temporary,
      {},
      ({ totalBytesWritten, totalBytesExpectedToWrite }) => {
        const total =
          totalBytesExpectedToWrite > 0
            ? totalBytesExpectedToWrite
            : info.sizeBytes;
        onProgress(Math.min(1, totalBytesWritten / total));
      },
    );
    const handle = { cancelled: false, pause: () => resumable.pauseAsync() };
    active.set(resource.id, handle);

    let result;
    try {
      result = await resumable.downloadAsync();
    } catch (error) {
      if (handle.cancelled) throw new DownloadError("cancelled");
      {
        throw error;
      }
    } finally {
      active.delete(resource.id);
    }
    if (handle.cancelled) throw new DownloadError("cancelled");
    if (!result || result.status < 200 || result.status >= 300) {
      throw new DownloadError("failed");
    }

    const stat = await FileSystem.getInfoAsync(temporary);
    if (!stat.exists || stat.size !== info.sizeBytes) {
      throw new DownloadError("integrity");
    }
    // The hash is only checked when the database holds one.
    if (info.sha256 && (await sha256OfFile(temporary)) !== info.sha256) {
      throw new DownloadError("integrity");
    }

    await discard(destination);
    await FileSystem.moveAsync({ from: temporary, to: destination });

    const record: DownloadRecord = {
      resourceId: resource.id,
      fileId: info.fileId,
      localUri: destination,
      sizeBytes: info.sizeBytes,
      sha256: info.sha256,
      summary: resource,
      downloadedAt: Date.now(),
    };
    await downloadsDb.put(toRawDownloadRow(record));
    return record;
  } catch (error) {
    await discard(temporary);
    // throw error instanceof DownloadError ? error : new DownloadError("failed");
    if (error instanceof DownloadError) throw error;
    throw new DownloadError("failed", error);
  }
}

export async function cancelDownload(resourceId: string): Promise<void> {
  const handle = active.get(resourceId);
  if (!handle) return;
  handle.cancelled = true;
  await handle.pause();
}

export async function deleteDownload(resourceId: string): Promise<void> {
  try {
    const row = await downloadsDb.get(resourceId);

    if (!row) {
      throw new DownloadError("unavailable");
    }

    await discard(row.local_uri);
    await downloadsDb.remove(resourceId);
    clearReaderViewport(resourceId);
  } catch (error) {
    if (error instanceof DownloadError) throw error;

    throw new DownloadError("failed", error);
  }
}

/** Everything on this phone. A record whose file has disappeared (cleared storage) is dropped. */
export async function loadDownloads(): Promise<DownloadRecord[]> {
  const rows = await downloadsDb.list();
  const records: DownloadRecord[] = [];
  for (const row of rows) {
    try {
      const stat = await FileSystem.getInfoAsync(row.local_uri);
      if (!stat.exists) throw new Error("missing");
      records.push(toDownloadRecord(row));
    } catch {
      await downloadsDb.remove(row.resource_id);
    }
  }
  return records;
}
