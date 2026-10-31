import type {
  RawRelationRow,
  RawResourceDetail,
  RawResourceType,
  RawSearchRow,
} from '@/features/resources/types/resource';
import { supabase } from '@/services/supabase/client';

// Name the columns: the database refuses "select *" on resources, which hides uploader and private notes.
const DETAIL_COLUMNS =
  'id, university_id, course_id, type_code, title, description, academic_year, year_unknown, exam_session, language, status, ' +
  'source_type, source_status, metadata_reviewed, correction_reviewed, ai_assisted, published_at, ' +
  'courses(name, code), universities(name), resource_files(id, size_bytes, page_count, processing_status, is_current)';

const RELATION_COLUMNS =
  'resource_id, related_id, relation_type, ' +
  'resource:resources!resource_relations_resource_id_fkey(id, title, type_code, correction_reviewed, academic_year), ' +
  'related:resources!resource_relations_related_id_fkey(id, title, type_code, academic_year)';

/** Raw in, raw out. Guests can read all of this. */
export const resourcesApi = {
  search: async (p: {
    query: string;
    universityId: string | null;
    level: string | null;
    typeCode: string | null;
    academicYear: string | null;
    hasCorrection: boolean | null;
    limit: number;
    offset: number;
  }): Promise<RawSearchRow[]> => {
    const { data, error } = await supabase.rpc('search_resources', {
      p_query: p.query || null,
      p_university: p.universityId,
      p_level: p.level,
      p_type: p.typeCode,
      p_year: p.academicYear,
      p_has_correction: p.hasCorrection,
      p_limit: p.limit,
      p_offset: p.offset,
    });
    if (error) throw error;
    return (data ?? []) as RawSearchRow[];
  },

  listTypes: async (): Promise<RawResourceType[]> => {
    const { data, error } = await supabase.from('resource_types').select('code, label_fr, label_en, sort').eq('active', true).order('sort');
    if (error) throw error;
    return (data ?? []) as RawResourceType[];
  },

  get: async (id: string): Promise<RawResourceDetail> => {
    const { data, error } = await supabase.from('resources').select(DETAIL_COLUMNS).eq('id', id).single();
    if (error) throw error;
    return data as unknown as RawResourceDetail;
  },

  listRelations: async (id: string): Promise<RawRelationRow[]> => {
    const { data, error } = await supabase
      .from('resource_relations')
      .select(RELATION_COLUMNS)
      .or(`resource_id.eq.${id},related_id.eq.${id}`);
    if (error) throw error;
    return (data ?? []) as unknown as RawRelationRow[];
  },

  /** "I could not find this": a signal for what to collect next. */
  request: async (input: { userId: string; universityId: string | null; query: string }): Promise<void> => {
    const { error } = await supabase
      .from('resource_requests')
      .insert({ user_id: input.userId, university_id: input.universityId, query: input.query.slice(0, 200) });
    if (error) throw error;
  },
};
