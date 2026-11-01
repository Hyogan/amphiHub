import type { ResourceSummary } from "@/features/resources/types/resource";

// Raw types mirror the database or the local SQLite table. Only services and this file import them.
export interface RawFileInfo {
  file_id: string;
  storage_path: string;
  size_bytes: number | string;
  sha256: string | null;
  page_count: number | null;
}

export interface RawDownloadRow {
  resource_id: string;
  file_id: string;
  local_uri: string;
  size_bytes: number;
  sha256: string | null;
  summary: string; // JSON of the ResourceSummary, so the list works offline
  downloaded_at: number;
}

export interface DownloadFileInfo {
  fileId: string;
  storagePath: string;
  sizeBytes: number;
  sha256: string | null;
  pageCount: number | null;
}

export interface DownloadRecord {
  resourceId: string;
  fileId: string;
  localUri: string;
  sizeBytes: number;
  sha256: string | null;
  summary: ResourceSummary;
  downloadedAt: number;
}

export function toDownloadFileInfo(raw: RawFileInfo): DownloadFileInfo {
  return {
    fileId: raw.file_id,
    storagePath: raw.storage_path,
    sizeBytes: Number(raw.size_bytes),
    sha256: raw.sha256,
    pageCount: raw.page_count,
  };
}

/** Throws if the stored summary is not valid JSON. The caller drops such a row. */
export function toDownloadRecord(raw: RawDownloadRow): DownloadRecord {
  return {
    resourceId: raw.resource_id,
    fileId: raw.file_id,
    localUri: raw.local_uri,
    sizeBytes: raw.size_bytes,
    sha256: raw.sha256,
    summary: JSON.parse(raw.summary) as ResourceSummary,
    downloadedAt: raw.downloaded_at,
  };
}

export function toRawDownloadRow(record: DownloadRecord): RawDownloadRow {
  return {
    resource_id: record.resourceId,
    file_id: record.fileId,
    local_uri: record.localUri,
    size_bytes: record.sizeBytes,
    sha256: record.sha256,
    summary: JSON.stringify(record.summary),
    downloaded_at: record.downloadedAt,
  };
}
