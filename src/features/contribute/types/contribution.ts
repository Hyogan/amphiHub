// Raw types mirror the database. Only services/api and this file import them.
export const SOURCE_TYPES = [
  "community_upload",
  "official_source",
  "other",
] as const;
export type ContributionSourceType = (typeof SOURCE_TYPES)[number];

export const EXAM_SESSIONS = ["normal", "retake", "other"] as const;
export const UNKNOWN_YEAR = "unknown";
export const MAX_PDF_BYTES = 26_214_400; // 25 MB, the same limit as the storage bucket

export interface RawCourseHit {
  id: string;
  university_id: string;
  name: string;
  code: string | null;
  rank: number;
}

export interface CourseHit {
  id: string;
  universityId: string;
  name: string;
  code: string | null;
}

export function toCourseHit(raw: RawCourseHit): CourseHit {
  return {
    id: raw.id,
    universityId: raw.university_id,
    name: raw.name,
    code: raw.code,
  };
}

/** What the form collects. Optional choices are '' when empty. */
export interface ContributionInput {
  universityId: string;
  courseId: string;
  typeCode: string;
  /** An academic year such as "2023-2024", or UNKNOWN_YEAR. */
  yearChoice: string;
  examSession: string;
  language: string;
  sourceType: ContributionSourceType;
  sourceNote: string;
  title: string;
}

export interface RawResourceInsert {
  id: string;
  university_id: string;
  course_id: string;
  type_code: string;
  title: string;
  academic_year: string | null;
  year_unknown: boolean;
  exam_session: string | null;
  language: string | null;
  source_type: ContributionSourceType;
  source_note: string | null;
  rights_declared: true;
  uploader_id: string;
}

export interface RawResourceFileInsert {
  id: string;
  resource_id: string;
  storage_path: string;
  size_bytes: number;
}

/** Status and verification are not sent: the database defaults and the insert rule force a plain submission. */
export function toRawResourceInsert(
  input: ContributionInput,
  ids: { resourceId: string; userId: string },
): RawResourceInsert {
  const unknownYear = input.yearChoice === UNKNOWN_YEAR;
  return {
    id: ids.resourceId,
    university_id: input.universityId,
    course_id: input.courseId,
    type_code: input.typeCode,
    title: input.title.trim(),
    academic_year: unknownYear ? null : input.yearChoice,
    year_unknown: unknownYear,
    exam_session: input.examSession || null,
    language: input.language || null,
    source_type: input.sourceType,
    source_note: input.sourceNote.trim().slice(0, 1000) || null,
    rights_declared: true,
    uploader_id: ids.userId,
  };
}
