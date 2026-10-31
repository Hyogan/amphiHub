const SEPTEMBER = 8;

// Computed once when the app starts. The academic year begins in September.
const now = new Date();
const startYear = now.getMonth() >= SEPTEMBER ? now.getFullYear() : now.getFullYear() - 1;

/** The last seven academic years, newest first: ["2026-2027", "2025-2026", ...]. */
export const ACADEMIC_YEARS: string[] = Array.from({ length: 7 }, (_, i) => `${startYear - i}-${startYear - i + 1}`);

/** Levels offered in filters. Programs may use others, but these cover the usual LMD cycle. */
export const FILTER_LEVELS = ['L1', 'L2', 'L3', 'M1', 'M2'];
