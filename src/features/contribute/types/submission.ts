export type SubmissionStatus =
  | "submitted"
  | "in_review"
  | "published"
  | "rejected"
  | "restricted"
  | "removed";

// Raw type mirrors the my_contributions view. Only services/api and this file import it.
export interface RawSubmissionRow {
  id: string;
  title: string;
  status: SubmissionStatus;
  type_code: string;
  academic_year: string | null;
  year_unknown: boolean;
  exam_session: string | null;
  course_id: string;
  course_name: string;
  course_code: string | null;
  university_id: string;
  university_name: string;
  moderation_note: string | null;
  created_at: string;
  published_at: string | null;
  size_bytes: number | null;
  page_count: number | null;
}

export interface Submission {
  id: string;
  title: string;
  status: SubmissionStatus;
  typeCode: string;
  academicYear: string | null;
  yearUnknown: boolean;
  examSession: string | null;
  courseName: string;
  courseCode: string | null;
  universityName: string;
  /** The moderator's reason. Only set when the document was rejected, restricted or removed. */
  reason: string | null;
  createdAt: string;
  sizeBytes: number | null;
}

const STATUSES_WITH_REASON: SubmissionStatus[] = [
  "rejected",
  "restricted",
  "removed",
];

export function toSubmission(raw: RawSubmissionRow): Submission {
  return {
    id: raw.id,
    title: raw.title,
    status: raw.status,
    typeCode: raw.type_code,
    academicYear: raw.academic_year,
    yearUnknown: raw.year_unknown,
    examSession: raw.exam_session,
    courseName: raw.course_name,
    courseCode: raw.course_code,
    universityName: raw.university_name,
    // The note can also hold a remark made when publishing. The contributor only sees reasons for refusals.
    reason: STATUSES_WITH_REASON.includes(raw.status)
      ? raw.moderation_note
      : null,
    createdAt: raw.created_at,
    sizeBytes: raw.size_bytes,
  };
}
