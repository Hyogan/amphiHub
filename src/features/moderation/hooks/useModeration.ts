import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { catalogKeys } from "@/features/catalog/hooks/useCatalog";
import { submissionKeys } from "@/features/contribute/hooks/useContribute";
import { resourceKeys } from "@/features/resources/hooks/useResources";
import { downloadApi } from "@/services/api/downloadApi";
import { moderationApi } from "@/services/api/moderationApi";
import { useToast } from "@/shared/toast/useToast";
import { useAppSelector } from "@/store/hooks";

import {
  toModerationItem,
  toModerationReport,
  toModerationSuggestion,
  toRawModerateArgs,
  toRawResolveReportArgs,
  toRawReviewSuggestionArgs,
  toRawVerificationArgs,
  type ModerateInput,
  type ModerationAction,
  type ResolveReportInput,
  type ReviewSuggestionInput,
  type VerificationInput,
} from "../types/moderation";

export const moderationKeys = {
  all: ["moderation"] as const,
  queue: () => [...moderationKeys.all, "queue"] as const,
  item: (id: string) => [...moderationKeys.all, "item", id] as const,
  reviewFile: (id: string) => [...moderationKeys.all, "file", id] as const,
  reports: () => [...moderationKeys.all, "reports"] as const,
  suggestions: () => [...moderationKeys.all, "suggestions"] as const,
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

/** 22023: not possible now (state changed, reason missing, file not ready). 42501: not allowed. */
function errorKey(error: unknown): string {
  const code = (error as { code?: string }).code;
  if (code === "22023") return "moderation.errorInvalid";
  if (code === "42501") return "moderation.errorForbidden";
  return "moderation.error";
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

export function useModerationReportsQuery() {
  const isModerator = useIsModerator();
  return useQuery({
    queryKey: moderationKeys.reports(),
    queryFn: async () =>
      (await moderationApi.listReports()).map(toModerationReport),
    enabled: isModerator,
  });
}

export function useModerationSuggestionsQuery() {
  const isModerator = useIsModerator();
  return useQuery({
    queryKey: moderationKeys.suggestions(),
    queryFn: async () =>
      (await moderationApi.listSuggestions()).map(toModerationSuggestion),
    enabled: isModerator,
  });
}

const MODERATE_TOAST: Record<ModerationAction, string> = {
  start_review: "moderation.started",
  publish: "moderation.published",
  reject: "moderation.rejected",
  restrict: "moderation.restricted",
  restore: "moderation.restored",
  remove: "moderation.removed",
};

export function useModerateMutation() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const { t } = useTranslation("resources");
  return useMutation({
    mutationFn: (input: ModerateInput) =>
      moderationApi.moderate(toRawModerateArgs(input)),
    onSuccess: (_data, { action }) => {
      invalidateAfterModeration(queryClient);
      toast.success(t(MODERATE_TOAST[action]));
    },
    onError: (error) => toast.error(t(errorKey(error))),
  });
}

export function useResolveReportMutation() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const { t } = useTranslation("resources");
  return useMutation({
    mutationFn: (input: ResolveReportInput) =>
      moderationApi.resolveReport(toRawResolveReportArgs(input)),
    onSuccess: (_data, { decision }) => {
      queryClient.invalidateQueries({ queryKey: moderationKeys.reports() });
      toast.success(
        t(
          decision === "resolved"
            ? "moderation.reportResolved"
            : "moderation.reportDismissed",
        ),
      );
    },
    onError: (error) => toast.error(t(errorKey(error))),
  });
}

export function useReviewSuggestionMutation() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const { t } = useTranslation("resources");
  return useMutation({
    mutationFn: (input: ReviewSuggestionInput) =>
      moderationApi.reviewSuggestion(toRawReviewSuggestionArgs(input)),
    onSuccess: (_data, { decision }) => {
      queryClient.invalidateQueries({ queryKey: moderationKeys.suggestions() });
      if (decision === "accept") {
        queryClient.invalidateQueries({ queryKey: catalogKeys.all });
        queryClient.invalidateQueries({ queryKey: ["contribute", "courses"] });
      }
      toast.success(
        t(
          decision === "accept"
            ? "moderation.suggestionAccepted"
            : "moderation.suggestionRejected",
        ),
      );
    },
    onError: (error) => toast.error(t(errorKey(error))),
  });
}

export function useSetVerificationMutation() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const { t } = useTranslation("resources");
  return useMutation({
    mutationFn: (input: VerificationInput) =>
      moderationApi.setVerification(toRawVerificationArgs(input)),
    onSuccess: () => {
      invalidateAfterModeration(queryClient);
      toast.success(t("moderation.verification.saved"));
    },
    onError: (error) => toast.error(t(errorKey(error))),
  });
}
