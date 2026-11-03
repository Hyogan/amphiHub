import type {
    RawModerateArgs,
    RawModerationRow,
    RawReviewFile,
} from "@/features/moderation/types/moderation";
import { supabase } from "@/services/supabase/client";

/** Raw in, raw out. The database refuses all of this for anyone who is not a moderator. */
export const moderationApi = {
  /** Oldest first: whoever has waited longest is reviewed first. */
  listQueue: async (): Promise<RawModerationRow[]> => {
    const { data, error } = await supabase
      .from("moderation_items")
      .select("*")
      .in("status", ["submitted", "in_review"])
      .order("created_at", { ascending: true });
    if (error) throw error;
    return (data ?? []) as RawModerationRow[];
  },

  getItem: async (id: string): Promise<RawModerationRow> => {
    const { data, error } = await supabase
      .from("moderation_items")
      .select("*")
      .eq("id", id)
      .single();
    if (error) throw error;
    return data as RawModerationRow;
  },

  getReviewFile: async (resourceId: string): Promise<RawReviewFile | null> => {
    const { data, error } = await supabase.rpc("moderator_file_for_review", {
      p_resource: resourceId,
    });
    if (error) throw error;
    return ((data ?? []) as RawReviewFile[])[0] ?? null;
  },

  /** Writes the audit log too: that happens inside the database function. */
  moderate: async (args: RawModerateArgs): Promise<void> => {
    const { error } = await supabase.rpc("moderate_resource", args);
    if (error) throw error;
  },
};
