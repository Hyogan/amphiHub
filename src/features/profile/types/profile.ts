export interface RawProfile {
  id: string;
  display_name: string | null;
  preferred_language: 'fr' | 'en';
  university_id: string | null;
  program_id: string | null;
  level: string | null;
  semester: number | null;
}

export interface Profile {
  id: string;
  displayName: string | null;
  preferredLanguage: 'fr' | 'en';
  universityId: string | null;
  programId: string | null;
  level: string | null;
  semester: number | null;
}

export interface AcademicProfileInput {
  universityId: string | null;
  programId: string | null;
  level: string | null;
  semester: number | null;
}

export interface RawAcademicProfileUpdate {
  university_id: string | null;
  program_id: string | null;
  level: string | null;
  semester: number | null;
}

export function toProfile(raw: RawProfile): Profile {
  return {
    id: raw.id,
    displayName: raw.display_name,
    preferredLanguage: raw.preferred_language,
    universityId: raw.university_id,
    programId: raw.program_id,
    level: raw.level,
    semester: raw.semester,
  };
}

/** Empty values become null, so the database never stores an empty string. */
export function toRawAcademicUpdate(input: AcademicProfileInput): RawAcademicProfileUpdate {
  return {
    university_id: input.universityId || null,
    program_id: input.programId || null,
    level: input.level || null,
    semester: input.semester ?? null,
  };
}

export function isAcademicProfileComplete(p: Pick<Profile, 'universityId' | 'programId' | 'level'>): boolean {
  return Boolean(p.universityId && p.programId && p.level);
}
