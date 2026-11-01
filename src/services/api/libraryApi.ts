import type { RawResourceRow } from "@/features/resources/types/resource";
import { supabase } from "@/services/supabase/client";

/** Raw in, raw out. Everything here needs a signed-in user. */
export const libraryApi = {
  listSavedIds: async (userId: string): Promise<string[]> => {
    const { data, error } = await supabase
      .from("saved_resources")
      .select("resource_id")
      .eq("user_id", userId);
    if (error) throw error;
    return (data ?? []).map((row) => row.resource_id as string);
  },

  listSaved: async (): Promise<RawResourceRow[]> => {
    const { data, error } = await supabase
      .from("my_saved_resources")
      .select("*")
      .order("saved_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as RawResourceRow[];
  },

  save: async (userId: string, resourceId: string): Promise<void> => {
    const { error } = await supabase
      .from("saved_resources")
      .insert({ user_id: userId, resource_id: resourceId });
    // 23505: already saved. The wanted state is reached, so this is not a failure.
    if (error && error.code !== "23505") throw error;
  },

  unsave: async (userId: string, resourceId: string): Promise<void> => {
    const { error } = await supabase
      .from("saved_resources")
      .delete()
      .eq("user_id", userId)
      .eq("resource_id", resourceId);
    if (error) throw error;
  },
};
