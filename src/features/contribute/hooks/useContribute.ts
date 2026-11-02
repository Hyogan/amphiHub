import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { track } from "@/services/analytics";
import { contributionApi } from "@/services/api/contributionApi";
import {
  ContributionError,
  submitContribution,
} from "@/services/upload/contributionService";
import type { PickedPdf } from "@/services/upload/pickPdf";
import { useCelebrate } from "@/shared/celebration/useCelebrate";
import { useToast } from "@/shared/toast/useToast";
import { useAppSelector } from "@/store/hooks";
import {
  toRawSuggestionInsert,
  type CourseSuggestionInput,
} from "../types/suggestion";

import { toCourseHit, type ContributionInput } from "../types/contribution";

export const submissionKeys = {
  all: ["submissions"] as const,
};

/** `term` is already debounced by the caller. Needs a university and at least two letters. */
export function useCourseSearchQuery(
  term: string,
  universityId: string | null,
) {
  return useQuery({
    queryKey: ["contribute", "courses", universityId ?? "", term],
    queryFn: async () =>
      (await contributionApi.searchCourses(term, universityId, 10)).map(
        toCourseHit,
      ),
    enabled: term.length >= 2 && Boolean(universityId),
    placeholderData: keepPreviousData,
  });
}

export function useSubmitContribution() {
  const userId = useAppSelector((state) => state.session.userId);
  const queryClient = useQueryClient();
  const toast = useToast();
  const celebrate = useCelebrate();
  const { t } = useTranslation("resources");

  return useMutation({
    mutationFn: async (input: {
      file: PickedPdf;
      values: ContributionInput;
    }) => {
      if (!userId) throw new Error("not signed in");
      track("resource_submission_started", { type: input.values.typeCode });
      return submitContribution({ ...input, userId });
    },
    onSuccess: (_result, { values }) => {
      queryClient.invalidateQueries({ queryKey: submissionKeys.all });
      celebrate(t("contribute.sent")); // a sent document is a real achievement
      track("resource_submission_completed", { type: values.typeCode });
    },
    onError: (error) => {
      if (__DEV__) {
        console.log(
          error,
          error instanceof ContributionError ? error.original : null,
        );
      }
      const kind = error instanceof ContributionError ? error.kind : "save";
      toast.error(
        t(
          kind === "file"
            ? "contribute.errorFile"
            : kind === "upload"
              ? "contribute.errorUpload"
              : kind === "finalize"
                ? "contribute.errorFinalize"
                : "contribute.errorSave",
        ),
      );
    },
  });
}

export function useSuggestCourseMutation() {
  const userId = useAppSelector((state) => state.session.userId);
  const toast = useToast();
  const { t } = useTranslation("resources");
  return useMutation({
    mutationFn: async (input: CourseSuggestionInput) => {
      if (!userId) throw new Error("not signed in");
      await contributionApi.suggestCourse(toRawSuggestionInsert(input, userId));
    },
    onSuccess: () => {
      toast.success(t("contribute.suggest.sent"));
      track("catalog_suggestion_sent", { kind: "course" });
    },
    onError: () => toast.error(t("contribute.suggest.error")),
  });
}
