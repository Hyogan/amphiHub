import type {
  RawAcademicProfileUpdate,
  RawProfile,
} from "@/features/profile/types/profile";
import { supabase } from "@/services/supabase/client";

const COLUMNS =
  "id, display_name, preferred_language, university_id, program_id, level, semester";

/** Raw in, raw out. The access rules let a user read and edit only their own profile. */
export const profileApi = {
  get: async (userId: string): Promise<RawProfile> => {
    const { data, error } = await supabase
      .from("profiles")
      .select(COLUMNS)
      .eq("id", userId)
      .single();
    if (error) {
      console.log(error);
      throw error;
    }
    return data as RawProfile;
  },

  updateAcademic: async (
    userId: string,
    payload: RawAcademicProfileUpdate,
  ): Promise<RawProfile> => {
    const { data, error } = await supabase
      .from("profiles")
      .update(payload)
      .eq("id", userId)
      .select(COLUMNS)
      .single();
    if (error) throw error;
    return data as RawProfile;
  },
};
