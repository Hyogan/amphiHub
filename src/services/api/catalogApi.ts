import type {
  RawCourse,
  RawCoverageRow,
  RawProgram,
  RawProgramCourseLevel,
  RawUniversity,
} from "@/features/catalog/types/catalog";
import { supabase } from "@/services/supabase/client";

/** Raw in, raw out. Guests may read all of this. */
export const catalogApi = {
  listUniversities: async (): Promise<RawUniversity[]> => {
    const { data, error } = await supabase
      .from("universities")
      .select("id, name, short_name, country_code, primary_language, status")
      .eq("status", "active")
      .order("name");
    if (error) throw error;
    return (data ?? []) as RawUniversity[];
  },

  listPrograms: async (universityId: string): Promise<RawProgram[]> => {
    const { data, error } = await supabase
      .from("programs")
      .select("id, university_id, unit_id, name, code, degree_type")
      .eq("university_id", universityId)
      .eq("status", "active")
      .order("name");
    if (error) throw error;
    return (data ?? []) as RawProgram[];
  },

  listProgramLevels: async (
    programId: string,
  ): Promise<RawProgramCourseLevel[]> => {
    const { data, error } = await supabase
      .from("program_courses")
      .select("level, semester")
      .eq("program_id", programId);
    if (error) throw error;
    return (data ?? []) as RawProgramCourseLevel[];
  },

  getCourse: async (id: string): Promise<RawCourse> => {
    const { data, error } = await supabase
      .from("courses")
      .select("id, university_id, name, code, universities(name)")
      .eq("id", id)
      .single();
    if (error) throw error;
    return data as unknown as RawCourse;
  },

  courseCoverage: async (input: {
    programId: string;
    level: string | null;
    years: string[];
    limit: number;
  }): Promise<RawCoverageRow[]> => {
    const { data, error } = await supabase.rpc("course_coverage", {
      p_program: input.programId,
      p_level: input.level,
      p_years: input.years,
      p_limit: input.limit,
    });
    if (error) throw error;
    return (data ?? []) as RawCoverageRow[];
  },
};
