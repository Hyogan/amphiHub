import type { RawProgram, RawProgramCourseLevel, RawUniversity } from '@/features/catalog/types/catalog';
import { supabase } from '@/services/supabase/client';

/** Raw in, raw out. Guests may read all of this. */
export const catalogApi = {
  listUniversities: async (): Promise<RawUniversity[]> => {
    const { data, error } = await supabase
      .from('universities')
      .select('id, name, short_name, country_code, primary_language, status')
      .eq('status', 'active')
      .order('name');
    if (error) throw error;
    return (data ?? []) as RawUniversity[];
  },

  listPrograms: async (universityId: string): Promise<RawProgram[]> => {
    const { data, error } = await supabase
      .from('programs')
      .select('id, university_id, unit_id, name, code, degree_type')
      .eq('university_id', universityId)
      .eq('status', 'active')
      .order('name');
    if (error) throw error;
    return (data ?? []) as RawProgram[];
  },

  listProgramLevels: async (programId: string): Promise<RawProgramCourseLevel[]> => {
    const { data, error } = await supabase.from('program_courses').select('level, semester').eq('program_id', programId);
    if (error) throw error;
    return (data ?? []) as RawProgramCourseLevel[];
  },
};
