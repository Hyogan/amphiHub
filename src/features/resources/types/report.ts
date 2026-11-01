export const REPORT_REASONS = [
  "wrong_metadata",
  "unreadable",
  "duplicate",
  "wrong_correction",
  "unauthorized_content",
  "other",
] as const;

export type ReportReason = (typeof REPORT_REASONS)[number];

export interface ReportInput {
  resourceId: string;
  reason: ReportReason;
  details: string;
}

export interface RawReportInsert {
  resource_id: string;
  reporter_id: string;
  reason: ReportReason;
  details: string | null;
}

/** Empty details become null. The database allows at most 1000 characters. */
export function toRawReportInsert(
  input: ReportInput,
  userId: string,
): RawReportInsert {
  return {
    resource_id: input.resourceId,
    reporter_id: userId,
    reason: input.reason,
    details: input.details.trim().slice(0, 1000) || null,
  };
}
