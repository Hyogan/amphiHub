import type { SubmissionStatus } from "@/features/contribute/types/submission";

export type ModerationAction =
  | "start_review"
  | "publish"
  | "reject"
  | "restrict"
  | "restore"
  | "remove";

// Raw type mirrors the moderation_items view. Only services/api and this file import it.
export interface RawModerationRow {
  id: string;
  title: string;
  status: SubmissionStatus;
  type_code: string;
  academic_year: string | null;
  year_unknown: boolean;
  exam_session: string | null;
  language: string | null;
  source_type: "community_upload" | "official_source" | "other";
  source_note: string | null;
  source_status: "unverified" | "confirmed" | "official_confirmed";
  metadata_reviewed: boolean;
  correction_reviewed: boolean;
  rights_declared: boolean;
  moderation_note: string | null;
  duplicate_of: string | null;
  duplicate_title: string | null;
  duplicate_status: string | null;
  course_id: string;
  course_name: string;
  course_code: string | null;
  university_id: string;
  university_name: string;
  created_at: string;
  file_id: string | null;
  size_bytes: number | null;
  page_count: number | null;
  file_status: string | null;
}

export interface RawReviewFile {
  file_id: string;
  storage_path: string;
  size_bytes: number | string;
  page_count: number | null;
}

export interface ModerationItem {
  id: string;
  title: string;
  status: SubmissionStatus;
  typeCode: string;
  academicYear: string | null;
  yearUnknown: boolean;
  examSession: string | null;
  language: string | null;
  sourceType: RawModerationRow["source_type"];
  sourceNote: string | null;
  moderationNote: string | null;
  duplicateOf: string | null;
  duplicateTitle: string | null;
  courseName: string;
  courseCode: string | null;
  universityName: string;
  createdAt: string;
  fileId: string | null;
  fileReady: boolean;
  sizeBytes: number | null;
  pageCount: number | null;

  sourceStatus: RawModerationRow["source_status"];
  metadataReviewed: boolean;
  correctionReviewed: boolean;
}

export interface ModerateInput {
  resourceId: string;
  action: ModerationAction;
  reason: string | null;
}

export interface RawModerateArgs {
  p_resource_id: string;
  p_action: ModerationAction;
  p_reason: string | null;
}

export function toModerationItem(raw: RawModerationRow): ModerationItem {
  return {
    id: raw.id,
    title: raw.title,
    status: raw.status,
    typeCode: raw.type_code,
    academicYear: raw.academic_year,
    yearUnknown: raw.year_unknown,
    examSession: raw.exam_session,
    language: raw.language,
    sourceType: raw.source_type,
    sourceNote: raw.source_note,
    moderationNote: raw.moderation_note,
    duplicateOf: raw.duplicate_of,
    duplicateTitle: raw.duplicate_title,
    courseName: raw.course_name,
    courseCode: raw.course_code,
    universityName: raw.university_name,
    createdAt: raw.created_at,
    fileId: raw.file_id,
    fileReady: raw.file_status === "ready",
    sizeBytes: raw.size_bytes,
    pageCount: raw.page_count,

    sourceStatus: raw.source_status,
    metadataReviewed: raw.metadata_reviewed,
    correctionReviewed: raw.correction_reviewed,
  };
}

/** An empty reason becomes null, so the database never stores a blank one. */
export function toRawModerateArgs(input: ModerateInput): RawModerateArgs {
  return {
    p_resource_id: input.resourceId,
    p_action: input.action,
    p_reason: input.reason?.trim() || null,
  };
}

export type SourceStatus = RawModerationRow["source_status"];

// ── Reports ──────────────────────────────────────────────────────────────────
export interface RawModerationReportRow {
  id: string;
  resource_id: string;
  resource_title: string;
  resource_status: SubmissionStatus;
  course_name: string;
  university_name: string;
  reason: string;
  details: string | null;
  status: "open" | "resolved" | "dismissed";
  resolution: string | null;
  created_at: string;
  resolved_at: string | null;
  open_on_resource: number | string;
}

export interface ModerationReport {
  id: string;
  resourceId: string;
  resourceTitle: string;
  courseName: string;
  universityName: string;
  reason: string;
  details: string | null;
  createdAt: string;
  openOnResource: number;
}

export function toModerationReport(
  raw: RawModerationReportRow,
): ModerationReport {
  return {
    id: raw.id,
    resourceId: raw.resource_id,
    resourceTitle: raw.resource_title,
    courseName: raw.course_name,
    universityName: raw.university_name,
    reason: raw.reason,
    details: raw.details,
    createdAt: raw.created_at,
    openOnResource: Number(raw.open_on_resource),
  };
}

export interface ResolveReportInput {
  reportId: string;
  decision: "resolved" | "dismissed";
  resolution: string;
}

export interface RawResolveReportArgs {
  p_report_id: string;
  p_decision: "resolved" | "dismissed";
  p_resolution: string;
}

export function toRawResolveReportArgs(
  i: ResolveReportInput,
): RawResolveReportArgs {
  return {
    p_report_id: i.reportId,
    p_decision: i.decision,
    p_resolution: i.resolution.trim(),
  };
}

// ── Course suggestions ───────────────────────────────────────────────────────
export interface RawModerationSuggestionRow {
  id: string;
  university_id: string | null;
  university_name: string | null;
  kind: "course" | "program" | "unit";
  payload: unknown;
  status: "pending" | "accepted" | "rejected";
  created_at: string;
}

export interface ModerationSuggestion {
  id: string;
  universityName: string;
  kind: RawModerationSuggestionRow["kind"];
  name: string;
  code: string | null;
  createdAt: string;
  /** Only course suggestions with a university can be accepted from the app. */
  acceptable: boolean;
}

export function toModerationSuggestion(
  raw: RawModerationSuggestionRow,
): ModerationSuggestion {
  const payload = (
    raw.payload && typeof raw.payload === "object" ? raw.payload : {}
  ) as Record<string, unknown>;
  return {
    id: raw.id,
    universityName: raw.university_name ?? "",
    kind: raw.kind,
    name: typeof payload.name === "string" ? payload.name : "",
    code:
      typeof payload.code === "string" && payload.code ? payload.code : null,
    createdAt: raw.created_at,
    acceptable: raw.kind === "course" && raw.university_id !== null,
  };
}

export interface ReviewSuggestionInput {
  suggestionId: string;
  decision: "accept" | "reject";
  name: string;
  code: string;
}

export interface RawReviewSuggestionArgs {
  p_suggestion_id: string;
  p_decision: "accept" | "reject";
  p_name: string | null;
  p_code: string | null;
}

export function toRawReviewSuggestionArgs(
  i: ReviewSuggestionInput,
): RawReviewSuggestionArgs {
  const accept = i.decision === "accept";
  return {
    p_suggestion_id: i.suggestionId,
    p_decision: i.decision,
    p_name: accept ? i.name.trim() : null,
    p_code: accept ? i.code.trim() : null, // '' clears the code
  };
}

// ── Verification labels ──────────────────────────────────────────────────────
/** A null field is left unchanged by the database function. */
export interface VerificationInput {
  resourceId: string;
  metadataReviewed: boolean | null;
  sourceStatus: SourceStatus | null;
  correctionReviewed: boolean | null;
  note: string;
}

export interface RawVerificationArgs {
  p_resource_id: string;
  p_metadata_reviewed: boolean | null;
  p_source_status: SourceStatus | null;
  p_correction_reviewed: boolean | null;
  p_note: string | null;
}

export function toRawVerificationArgs(
  i: VerificationInput,
): RawVerificationArgs {
  return {
    p_resource_id: i.resourceId,
    p_metadata_reviewed: i.metadataReviewed,
    p_source_status: i.sourceStatus,
    p_correction_reviewed: i.correctionReviewed,
    p_note: i.note.trim() || null,
  };
}
