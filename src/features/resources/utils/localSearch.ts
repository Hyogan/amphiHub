import type { ResourceSummary } from "../types/resource";

// Lowercase, without accents, so "ecole" finds "École".
const normalize = (text: string) =>
  text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

/** The offline version of search: every word must appear in the title, course, code or university. */
export function matchesSearch(
  resource: ResourceSummary,
  query: string,
  typeCode: string | null,
): boolean {
  if (typeCode && resource.typeCode !== typeCode) return false;
  const words = normalize(query.trim()).split(/\s+/).filter(Boolean);
  if (words.length === 0) return true;
  const haystack = normalize(
    [
      resource.title,
      resource.courseName,
      resource.courseCode,
      resource.universityName,
    ]
      .filter(Boolean)
      .join(" "),
  );
  return words.every((word) => haystack.includes(word));
}
