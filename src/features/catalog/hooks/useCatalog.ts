import { useQuery } from "@tanstack/react-query";

import { catalogApi } from "@/services/api/catalogApi";

import {
  toCourse,
  toCoverageRows,
  toLevelOptions,
  toProgram,
  toUniversity,
} from "../types/catalog";

export const catalogKeys = {
  all: ["catalog"] as const,
  universities: () => [...catalogKeys.all, "universities"] as const,
  programs: (universityId: string) =>
    [...catalogKeys.all, "programs", universityId] as const,
  levels: (programId: string) =>
    [...catalogKeys.all, "levels", programId] as const,
  course: (id: string) => [...catalogKeys.all, "course", id] as const,
  coverage: (programId: string, level: string, years: string[]) =>
    [...catalogKeys.all, "coverage", programId, level, years] as const,
};

// The catalogue changes rarely, so it stays fresh for five minutes.
const CATALOG_STALE_MS = 5 * 60 * 1000;

export function useUniversitiesQuery() {
  return useQuery({
    queryKey: catalogKeys.universities(),
    queryFn: async () =>
      (await catalogApi.listUniversities()).map(toUniversity),
    staleTime: CATALOG_STALE_MS,
  });
}

export function useProgramsQuery(universityId?: string | null) {
  return useQuery({
    queryKey: catalogKeys.programs(universityId ?? ""),
    queryFn: async () =>
      (await catalogApi.listPrograms(universityId as string)).map(toProgram),
    enabled: Boolean(universityId),
    staleTime: CATALOG_STALE_MS,
  });
}

export function useProgramLevelsQuery(programId?: string | null) {
  return useQuery({
    queryKey: catalogKeys.levels(programId ?? ""),
    queryFn: async () =>
      toLevelOptions(await catalogApi.listProgramLevels(programId as string)),
    enabled: Boolean(programId),
    staleTime: CATALOG_STALE_MS,
  });
}

export function useCourseQuery(id?: string) {
  return useQuery({
    queryKey: catalogKeys.course(id ?? ""),
    queryFn: async () => toCourse(await catalogApi.getCourse(id as string)),
    enabled: Boolean(id),
    staleTime: CATALOG_STALE_MS,
  });
}

/** The user's courses against past academic years, for the home grid. */
export function useCourseCoverageQuery(input: {
  programId?: string | null;
  level?: string | null;
  years: string[];
}) {
  return useQuery({
    queryKey: catalogKeys.coverage(
      input.programId ?? "",
      input.level ?? "",
      input.years,
    ),
    queryFn: async () =>
      toCoverageRows(
        await catalogApi.courseCoverage({
          programId: input.programId as string,
          level: input.level ?? null,
          years: input.years,
          limit: 8,
        }),
        input.years,
      ),
    enabled: Boolean(input.programId),
  });
}
