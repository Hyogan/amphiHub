import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import type { ResourceSummary } from "@/features/resources/types/resource";
import { track } from "@/services/analytics";
import {
  cancelDownload,
  DownloadError,
  downloadResource,
  loadDownloads,
} from "@/services/download/downloadService";
import { openDocument } from "@/services/download/openDocument";
import { useCelebrate } from "@/shared/celebration/useCelebrate";
import { useToast } from "@/shared/toast/useToast";
import {
  downloadFinished,
  downloadProgress,
  downloadStarted,
} from "@/store/downloadsSlice";
import { useAppDispatch } from "@/store/hooks";
import { DownloadRecord } from "../types/download";

export const downloadKeys = {
  all: ["downloads"] as const,
  list: () => [...downloadKeys.all, "list"] as const,
};

/** Documents stored on this phone. Local data, kept in the query cache like server data. */
export function useDownloadsQuery() {
  return useQuery({
    queryKey: downloadKeys.list(),
    queryFn: loadDownloads,
    staleTime: Infinity, // changes only through the mutations and dialogs below, which invalidate it
  });
}

/** The local copy of one document, if there is one. */
export function useDownloadRecord(resourceId: string) {
  return useQuery({
    queryKey: downloadKeys.list(),
    queryFn: loadDownloads,
    staleTime: Infinity,
    select: (records) => records.find((r) => r.resourceId === resourceId),
  });
}

export function useStartDownload() {
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  const toast = useToast();
  const { t } = useTranslation("resources");
  const celebrate = useCelebrate();
  return useMutation({
    mutationFn: async (resource: ResourceSummary) => {
      track("resource_download_started", { id: resource.id });
      dispatch(downloadStarted(resource.id));
      let last = 0;
      try {
        return await downloadResource(resource, (fraction) => {
          // Redux hears about every 2 percent, not every chunk.
          if (fraction - last >= 0.02 || fraction >= 1) {
            last = fraction;
            dispatch(downloadProgress({ id: resource.id, progress: fraction }));
          }
        });
      } finally {
        dispatch(downloadFinished(resource.id));
      }
    },

    onSuccess: (record) => {
      // Read before invalidating: an empty list means this is the first download on this phone.
      const before = queryClient.getQueryData<DownloadRecord[]>(
        downloadKeys.list(),
      );
      queryClient.invalidateQueries({ queryKey: downloadKeys.all });
      if (before && before.length === 0) celebrate(t("download.firstDone"));
      else toast.success(t("download.done"));
      track("resource_download_completed", { id: record.resourceId });
    },
    onError: (error, resource) => {
      console.log(
        error,
        error instanceof DownloadError ? error.original : null,
      );
      const kind = error instanceof DownloadError ? error.kind : "failed";
      if (kind === "cancelled") {
        toast.info(t("download.cancelled"));
        return;
      }
      toast.error(
        kind === "unavailable"
          ? t("download.unavailable")
          : kind === "integrity"
            ? t("download.corrupt")
            : t("download.error"),
      );
      track("resource_download_failed", { id: resource.id, reason: kind });
    },
  });
}

export { cancelDownload };

/** Opens a downloaded file. Tells the user when no app can read PDFs. */
export function useOpenDownload() {
  const toast = useToast();
  const { t } = useTranslation("resources");
  return async (localUri: string) => {
    try {
      await openDocument(localUri);
    } catch {
      toast.error(t("download.openError"));
    }
  };
}
