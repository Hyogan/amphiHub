import {
    useMutation,
    useQuery,
    useQueryClient,
    type QueryClient,
} from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { submissionKeys } from "@/features/contribute/hooks/useContribute";
import { resourceKeys } from "@/features/resources/hooks/useResources";
import { downloadApi } from "@/services/api/downloadApi";
import { moderationApi } from "@/services/api/moderationApi";
import { useToast } from "@/shared/toast/useToast";
import { useAppSelector } from "@/store/hooks";

import {
    toModerationItem,
    toRawModerateArgs,
    type ModerateInput,
} from "../types/moderation";

export const moderationKeys = {
  all: ["moderation"] as const,
  queue: () => [...moderationKeys.all, "queue"] as const,
  item: (id: string) => [...moderationKeys.all, "item", id] as const,
  reviewFile: (id: string) => [...moderationKeys.all, "file", id] as const,
};

/** UX only. The database decides what a role may do. */
export function useIsModerator() {
  const role = useAppSelector((state) => state.session.role);
  return role === "moderator" || role === "admin";
}

/** A decision changes what moderators, students and the contributor see. */
export function invalidateAfterModeration(client: QueryClient) {
  client.invalidateQueries({ queryKey: moderationKeys.all });
  client.invalidateQueries({ queryKey: resourceKeys.all });
  client.invalidateQueries({ queryKey: submissionKeys.all });
}

export function useModerationQueueQuery() {
  const isModerator = useIsModerator();
  return useQuery({
    queryKey: moderationKeys.queue(),
    queryFn: async () =>
      (await moderationApi.listQueue()).map(toModerationItem),
    enabled: isModerator,
  });
}

export function useModerationItemQuery(id?: string) {
  const isModerator = useIsModerator();
  return useQuery({
    queryKey: moderationKeys.item(id ?? ""),
    queryFn: async () =>
      toModerationItem(await moderationApi.getItem(id as string)),
    enabled: Boolean(id) && isModerator,
  });
}

/** A short-lived link to the submitted file. Never kept long. */
export function useReviewFileQuery(id?: string) {
  const isModerator = useIsModerator();
  return useQuery({
    queryKey: moderationKeys.reviewFile(id ?? ""),
    queryFn: async () => {
      const file = await moderationApi.getReviewFile(id as string);
      if (!file) throw new Error("no file");
      return {
        fileId: file.file_id,
        url: await downloadApi.createSignedUrl(file.storage_path),
      };
    },
    enabled: Boolean(id) && isModerator,
    staleTime: 2 * 60 * 1000,
  });
}

export function useModerateMutation() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const { t } = useTranslation("resources");
  return useMutation({
    mutationFn: (input: ModerateInput) =>
      moderationApi.moderate(toRawModerateArgs(input)),
    onSuccess: (_data, { action }) => {
      invalidateAfterModeration(queryClient);
      toast.success(
        t(
          action === "start_review"
            ? "moderation.started"
            : action === "publish"
              ? "moderation.published"
              : "moderation.rejected",
        ),
      );
    },
    onError: (error) => {
      // 22023: the action is not valid now, a reason is missing, or the file is not ready.
      const code = (error as { code?: string }).code;
      toast.error(
        t(code === "22023" ? "moderation.errorInvalid" : "moderation.error"),
      );
    },
  });
}
