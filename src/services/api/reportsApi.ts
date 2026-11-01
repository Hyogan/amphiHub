import type { RawReportInsert } from "@/features/resources/types/report";
import { supabase } from "@/services/supabase/client";

export const reportsApi = {
  /** 'duplicate': this user already has an open report for this document and reason. */
  create: async (
    payload: RawReportInsert,
  ): Promise<"created" | "duplicate"> => {
    const { error } = await supabase.from("reports").insert(payload);
    if (error?.code === "23505") return "duplicate";
    if (error) throw error;
    return "created";
  },
};
