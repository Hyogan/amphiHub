import type {
  RawCourseHit,
  RawResourceFileInsert,
  RawResourceInsert,
} from "@/features/contribute/types/contribution";
import type { RawSubmissionRow } from "@/features/contribute/types/submission";
import type { RawSuggestionInsert } from "@/features/contribute/types/suggestion";
import { supabase } from "@/services/supabase/client";

/** Raw in, raw out. Everything here needs a signed-in user. */
export const contributionApi = {
  searchCourses: async (
    query: string,
    universityId: string | null,
    limit: number,
  ): Promise<RawCourseHit[]> => {
    console.log("searchCourses", { query, universityId, limit });
    const { data, error } = await supabase.rpc("search_courses", {
      p_query: query,
      p_university: universityId,
      p_limit: limit,
    });
    if (error) {
      console.log(error);
      throw error;
    }
    return (data ?? []) as RawCourseHit[];
  },

  uploadPdf: async (storagePath: string, bytes: Uint8Array): Promise<void> => {
    const { error } = await supabase.storage
      .from("resources")
      .upload(storagePath, bytes, {
        contentType: "application/pdf",
        upsert: false,
      });
    if (error) throw error;
  },

  // Ids are generated on the phone, so no row has to be read back after the insert.
  insertResource: async (payload: RawResourceInsert): Promise<void> => {
    const { error } = await supabase.from("resources").insert(payload);
    if (error) throw error;
  },

  insertFile: async (payload: RawResourceFileInsert): Promise<void> => {
    const { error } = await supabase.from("resource_files").insert(payload);
    if (error) throw error;
  },

  finalizeFile: async (
    fileId: string,
    sha256: string,
    pageCount: number | null,
  ): Promise<void> => {
    const { error } = await supabase.rpc("finalize_resource_file", {
      p_file_id: fileId,
      p_sha256: sha256,
      p_page_count: pageCount,
    });
    if (error) throw error;
  },

  // inside contributionApi:
  listMine: async (): Promise<RawSubmissionRow[]> => {
    const { data, error } = await supabase
      .from("my_contributions")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as RawSubmissionRow[];
  },

  suggestCourse: async (payload: RawSuggestionInsert): Promise<void> => {
    const { error } = await supabase
      .from("catalog_suggestions")
      .insert(payload);
    if (error) throw error;
  },
};
