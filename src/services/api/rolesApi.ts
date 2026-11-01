import { supabase } from "@/services/supabase/client";

/** Raw in, raw out. A user can read only their own roles. */
export const rolesApi = {
  listMine: async (userId: string): Promise<{ role: string }[]> => {
    const { data, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);
    if (error) throw error;
    return (data ?? []) as { role: string }[];
  },
};
