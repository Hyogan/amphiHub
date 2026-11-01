import type { RawFileInfo } from "@/features/library/types/download";
import { supabase } from "@/services/supabase/client";

const SIGNED_URL_SECONDS = 300;

/** Raw in, raw out. Needs a signed-in user. */
export const downloadApi = {
  /** The current ready file of a published resource, or null. */
  getFileInfo: async (resourceId: string): Promise<RawFileInfo | null> => {
    const { data, error } = await supabase.rpc("resource_file_for_download", {
      p_resource: resourceId,
    });
    if (error) throw error;
    const rows = (data ?? []) as RawFileInfo[];
    return rows[0] ?? null;
  },

  /** A short-lived link. Never store it. */
  createSignedUrl: async (storagePath: string): Promise<string> => {
    const { data, error } = await supabase.storage
      .from("resources")
      .createSignedUrl(storagePath, SIGNED_URL_SECONDS);
    if (error) throw error;
    return data.signedUrl;
  },
};
