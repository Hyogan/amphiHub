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
