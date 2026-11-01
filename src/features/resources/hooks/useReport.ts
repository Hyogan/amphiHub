import { useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { track } from "@/services/analytics";
import { reportsApi } from "@/services/api/reportsApi";
import { useToast } from "@/shared/toast/useToast";
import { useAppSelector } from "@/store/hooks";

import { toRawReportInsert, type ReportInput } from "../types/report";

export function useReportResourceMutation() {
  const userId = useAppSelector((state) => state.session.userId);
  const toast = useToast();
  const { t } = useTranslation("resources");
  return useMutation({
    mutationFn: async (input: ReportInput) => {
      if (!userId) throw new Error("not signed in");
      return reportsApi.create(toRawReportInsert(input, userId));
    },
    onSuccess: (result, input) => {
      toast.success(
        t(result === "created" ? "report.sent" : "report.alreadySent"),
      );
      if (result === "created") {
        track("resource_reported", {
          id: input.resourceId,
          reason: input.reason,
        });
      }
    },
    onError: () => toast.error(t("report.error")),
  });
}
