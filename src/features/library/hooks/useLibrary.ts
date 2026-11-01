import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import {
    toResourceSummary,
    type ResourceSummary,
} from "@/features/resources/types/resource";
import { track } from "@/services/analytics";
import { libraryApi } from "@/services/api/libraryApi";
import { useToast } from "@/shared/toast/useToast";
import { useAppSelector } from "@/store/hooks";

export const libraryKeys = {
  all: ["library"] as const,
  ids: (userId: string) => [...libraryKeys.all, "ids", userId] as const,
  list: (userId: string) => [...libraryKeys.all, "list", userId] as const,
};

/** Ids of saved documents. Drives the state of every bookmark button. */
export function useSavedIdsQuery() {
  const userId = useAppSelector((state) => state.session.userId);
  return useQuery({
    queryKey: libraryKeys.ids(userId ?? ""),
    queryFn: () => libraryApi.listSavedIds(userId as string),
    enabled: Boolean(userId),
  });
}

/** The saved documents themselves, newest first. */
export function useSavedResourcesQuery() {
  const userId = useAppSelector((state) => state.session.userId);
  return useQuery({
    queryKey: libraryKeys.list(userId ?? ""),
    queryFn: async () => (await libraryApi.listSaved()).map(toResourceSummary),
    enabled: Boolean(userId),
  });
}

/** Save or unsave. The bookmark changes at once and goes back if the request fails. */
export function useToggleSavedMutation() {
  const queryClient = useQueryClient();
  const userId = useAppSelector((state) => state.session.userId);
  const toast = useToast();
  const { t } = useTranslation("resources");

  return useMutation({
    mutationFn: async (input: { resourceId: string; save: boolean }) => {
      if (!userId) throw new Error("not signed in");
      if (input.save) await libraryApi.save(userId, input.resourceId);
      else await libraryApi.unsave(userId, input.resourceId);
    },
    onMutate: async ({ resourceId, save }) => {
      const idsKey = libraryKeys.ids(userId ?? "");
      const listKey = libraryKeys.list(userId ?? "");
      await queryClient.cancelQueries({ queryKey: libraryKeys.all });
      const previousIds = queryClient.getQueryData<string[]>(idsKey);
      const previousList = queryClient.getQueryData<ResourceSummary[]>(listKey);
      queryClient.setQueryData<string[]>(idsKey, (ids = []) =>
        save
          ? ids.includes(resourceId)
            ? ids
            : [...ids, resourceId]
          : ids.filter((id) => id !== resourceId),
      );
      // A saved document appears in the list once the server confirms. Removal is shown at once.
      if (!save) {
        queryClient.setQueryData<ResourceSummary[]>(listKey, (rows) =>
          rows?.filter((row) => row.id !== resourceId),
        );
      }
      return { previousIds, previousList };
    },
    onError: (_error, _input, context) => {
      queryClient.setQueryData(
        libraryKeys.ids(userId ?? ""),
        context?.previousIds,
      );
      queryClient.setQueryData(
        libraryKeys.list(userId ?? ""),
        context?.previousList,
      );
      toast.error(t("save.error"));
    },
    onSuccess: (_data, { resourceId, save }) => {
      toast.success(t(save ? "save.saved" : "save.removed"));
      track(save ? "resource_saved" : "resource_unsaved", { id: resourceId });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: libraryKeys.all });
    },
  });
}
