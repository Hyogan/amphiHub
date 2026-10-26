// Raw types mirror the database. They are imported only by services/api and by this file.
export interface RawUniversity {
  id: string;
  name: string;
  short_name: string;
  country_code: string;
  primary_language: 'fr' | 'en';
  status: string;
}

export interface RawProgram {
  id: string;
  university_id: string;
  unit_id: string | null;
  name: string;
  code: string | null;
  degree_type: string | null;
}

export interface RawProgramCourseLevel {
  level: string;
  semester: number | null;
}

// Domain types are what the app uses.
export interface University {
  id: string;
  name: string;
  shortName: string;
  primaryLanguage: 'fr' | 'en';
}

export interface Program {
  id: string;
  universityId: string;
  name: string;
  code: string | null;
  degreeType: string | null;
}

export interface LevelOption {
  level: string;
  semesters: number[];
}

export function toUniversity(raw: RawUniversity): University {
  return { id: raw.id, name: raw.name, shortName: raw.short_name, primaryLanguage: raw.primary_language };
}

export function toProgram(raw: RawProgram): Program {
  return { id: raw.id, universityId: raw.university_id, name: raw.name, code: raw.code, degreeType: raw.degree_type };
}

// Used until a program has courses mapped to levels.
const FALLBACK_LEVELS = ['L1', 'L2', 'L3', 'M1', 'M2'];

/** Distinct levels of a program with the semesters seen at each level, in study order (L1, L2, L3, M1, M2). */
export function toLevelOptions(rows: RawProgramCourseLevel[]): LevelOption[] {
  if (rows.length === 0) return FALLBACK_LEVELS.map((level) => ({ level, semesters: [] }));
  const byLevel = new Map<string, Set<number>>();
  for (const row of rows) {
    const set = byLevel.get(row.level) ?? new Set<number>();
    if (row.semester !== null) set.add(row.semester);
    byLevel.set(row.level, set);
  }
  return [...byLevel.entries()]
    .map(([level, semesters]) => ({ level, semesters: [...semesters].sort((a, b) => a - b) }))
    .sort((a, b) => levelRank(a.level) - levelRank(b.level) || a.level.localeCompare(b.level));
}

function levelRank(level: string): number {
  const letter = level.trim().charAt(0).toUpperCase();
  const number = Number.parseInt(level.replace(/\D/g, ''), 10) || 0;
  const base = letter === 'L' ? 0 : letter === 'M' ? 10 : letter === 'D' ? 20 : 30;
  return base + number;
}
