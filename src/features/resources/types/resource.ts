import type { VerificationKind } from '@/shared/components/Stamp';

// Raw types mirror the database. Only services/api and this file import them.
export interface RawSearchRow {
  id: string;
  title: string;
  university_id: string;
  university_name: string;
  course_id: string;
  course_name: string;
  course_code: string | null;
  type_code: string;
  academic_year: string | null;
  exam_session: string | null;
  source_status: 'unverified' | 'confirmed' | 'official_confirmed';
  metadata_reviewed: boolean;
  correction_reviewed: boolean;
  has_correction: boolean;
  size_bytes: number | null;
  page_count: number | null;
  rank: number;
  total_count: number | string;
}

export interface RawResourceType {
  code: string;
  label_fr: string;
  label_en: string;
  sort: number;
}

export interface RawResourceDetail {
  id: string;
  university_id: string;
  course_id: string;
  type_code: string;
  title: string;
  description: string | null;
  academic_year: string | null;
  year_unknown: boolean;
  exam_session: string | null;
  language: 'fr' | 'en' | null;
  status: string;
  source_type: 'community_upload' | 'official_source' | 'other';
  source_note: string | null;
  source_status: 'unverified' | 'confirmed' | 'official_confirmed';
  metadata_reviewed: boolean;
  correction_reviewed: boolean;
  ai_assisted: boolean;
  published_at: string | null;
  courses: { name: string; code: string | null } | null;
  universities: { name: string } | null;
  resource_files: { id: string; size_bytes: number; page_count: number | null; processing_status: string; is_current: boolean }[];
}

export interface RawRelationRow {
  resource_id: string;
  related_id: string;
  relation_type: string;
  resource: { id: string; title: string; type_code: string; correction_reviewed: boolean; academic_year: string | null } | null;
  related: { id: string; title: string; type_code: string; academic_year: string | null } | null;
}

// Domain types are what the app uses.
export interface ResourceSummary {
  id: string;
  title: string;
  universityId: string;
  universityName: string;
  courseId: string;
  courseName: string;
  courseCode: string | null;
  typeCode: string;
  academicYear: string | null;
  examSession: string | null;
  sourceStatus: RawSearchRow['source_status'];
  metadataReviewed: boolean;
  correctionReviewed: boolean;
  hasCorrection: boolean;
  sizeBytes: number | null;
  pageCount: number | null;
}

export interface ResourceType {
  code: string;
  labelFr: string;
  labelEn: string;
}

export interface ResourceDetail {
  id: string;
  title: string;
  description: string | null;
  universityId: string;
  universityName: string;
  courseId: string;
  courseName: string;
  courseCode: string | null;
  typeCode: string;
  academicYear: string | null;
  yearUnknown: boolean;
  examSession: string | null;
  language: 'fr' | 'en' | null;
  sourceType: RawResourceDetail['source_type'];
  sourceNote: string | null;
  sourceStatus: RawResourceDetail['source_status'];
  metadataReviewed: boolean;
  correctionReviewed: boolean;
  aiAssisted: boolean;
  file: { id: string; sizeBytes: number; pageCount: number | null; ready: boolean } | null;
}

export interface RelatedResource {
  id: string;
  title: string;
  typeCode: string;
  academicYear: string | null;
  correctionReviewed: boolean;
}

export interface ResourceRelations {
  /** Corrections of this paper. */
  corrections: RelatedResource[];
  /** The paper this resource corrects, when it is itself a correction. */
  paper: RelatedResource | null;
}

export interface SearchParams {
  query: string;
  universityId: string | null;
  level: string | null;
  typeCode: string | null;
  academicYear: string | null;
  hasCorrection: boolean | null;
}

export function toResourceSummary(raw: RawSearchRow): ResourceSummary {
  return {
    id: raw.id,
    title: raw.title,
    universityId: raw.university_id,
    universityName: raw.university_name,
    courseId: raw.course_id,
    courseName: raw.course_name,
    courseCode: raw.course_code,
    typeCode: raw.type_code,
    academicYear: raw.academic_year,
    examSession: raw.exam_session,
    sourceStatus: raw.source_status,
    metadataReviewed: raw.metadata_reviewed,
    correctionReviewed: raw.correction_reviewed,
    hasCorrection: raw.has_correction,
    sizeBytes: raw.size_bytes,
    pageCount: raw.page_count,
  };
}

export function toResourceType(raw: RawResourceType): ResourceType {
  return { code: raw.code, labelFr: raw.label_fr, labelEn: raw.label_en };
}

export function toResourceDetail(raw: RawResourceDetail): ResourceDetail {
  const current = raw.resource_files.find((f) => f.is_current);
  return {
    id: raw.id,
    title: raw.title,
    description: raw.description,
    universityId: raw.university_id,
    universityName: raw.universities?.name ?? '',
    courseId: raw.course_id,
    courseName: raw.courses?.name ?? '',
    courseCode: raw.courses?.code ?? null,
    typeCode: raw.type_code,
    academicYear: raw.academic_year,
    yearUnknown: raw.year_unknown,
    examSession: raw.exam_session,
    language: raw.language,
    sourceType: raw.source_type,
    sourceNote: raw.source_note,
    sourceStatus: raw.source_status,
    metadataReviewed: raw.metadata_reviewed,
    correctionReviewed: raw.correction_reviewed,
    aiAssisted: raw.ai_assisted,
    file: current
      ? { id: current.id, sizeBytes: current.size_bytes, pageCount: current.page_count, ready: current.processing_status === 'ready' }
      : null,
  };
}

export function toResourceRelations(resourceId: string, rows: RawRelationRow[]): ResourceRelations {
  const corrections = rows
    .filter((r) => r.relation_type === 'correction_of' && r.related_id === resourceId && r.resource)
    .map((r) => ({
      id: r.resource!.id,
      title: r.resource!.title,
      typeCode: r.resource!.type_code,
      academicYear: r.resource!.academic_year,
      correctionReviewed: r.resource!.correction_reviewed,
    }));
  const paperRow = rows.find((r) => r.relation_type === 'correction_of' && r.resource_id === resourceId && r.related);
  const paper = paperRow?.related
    ? { id: paperRow.related.id, title: paperRow.related.title, typeCode: paperRow.related.type_code, academicYear: paperRow.related.academic_year, correctionReviewed: false }
    : null;
  return { corrections, paper };
}

/** Verification is a set of separate attributes. A moderated file is never presented as "correct". */
export function getVerificationKinds(r: {
  sourceStatus: RawSearchRow['source_status'];
  metadataReviewed: boolean;
  correctionReviewed: boolean;
  typeCode: string;
  aiAssisted?: boolean;
}): VerificationKind[] {
  const kinds: VerificationKind[] = [];
  if (r.sourceStatus === 'official_confirmed') kinds.push('official');
  else if (r.sourceStatus === 'confirmed') kinds.push('source');
  else kinds.push('community');
  if (r.metadataReviewed) kinds.push('metadata');
  if (r.typeCode === 'correction' && r.correctionReviewed) kinds.push('correction');
  if (r.aiAssisted) kinds.push('ai');
  return kinds;
}

/** "2023-2024" becomes "2024". */
export function shortYear(academicYear: string | null): string | null {
  return academicYear ? academicYear.slice(5, 9) : null;
}
