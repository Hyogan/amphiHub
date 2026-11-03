import { router } from "expo-router";

import { DIALOG_KEYS } from "@/core/dialog/dialogKeys";
import type { DialogBuilder } from "@/core/dialog/dialogRegistry";
import i18n from "@/i18n";
import { moderationApi } from "@/services/api/moderationApi";
import { queryClient } from "@/services/queryClient";
import { useToast } from "@/shared/toast/useToast";

import { invalidateAfterModeration } from "../hooks/useModeration";
import { toRawModerateArgs } from "../types/moderation";

/** Publishing makes a document visible to everyone, so it is never a single tap. */
export const buildConfirmPublishResourceDialog: DialogBuilder<
  typeof DIALOG_KEYS.CONFIRM_PUBLISH_RESOURCE
> = ({ resourceId, title }) => ({
  variant: "warning",
  dismissible: false,
  title: i18n.t("resources:moderation.publishDialog.title"),
  description: i18n.t("resources:moderation.publishDialog.body", { title }),
  actions: [
    {
      label: i18n.t("resources:moderation.publishDialog.cancel"),
      variant: "cancel",
      onPress: () => {},
    },
    {
      label: i18n.t("resources:moderation.publishDialog.confirm"),
      onPress: async () => {
        const toast = useToast();
        await moderationApi.moderate(
          toRawModerateArgs({ resourceId, action: "publish", reason: null }),
        );
        invalidateAfterModeration(queryClient);
        toast.success(i18n.t("resources:moderation.published"));
        router.back();
      },
    },
  ],
});
