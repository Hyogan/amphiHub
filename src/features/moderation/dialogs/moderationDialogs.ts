import { router } from "expo-router";

import { DIALOG_KEYS } from "@/core/dialog/dialogKeys";
import type { DialogBuilder } from "@/core/dialog/dialogRegistry";
import i18n from "@/i18n";
import { moderationApi } from "@/services/api/moderationApi";
import { queryClient } from "@/services/queryClient";
// import { dispatchToast } from "@/shared/toast/dispatchToast";
import { useToast } from "@/shared/toast/useToast";

import { invalidateAfterModeration } from "../hooks/useModeration";
import { toRawModerateArgs, type ModerationAction } from "../types/moderation";

async function run(
  resourceId: string,
  action: ModerationAction,
  reason: string | null,
  toastKey: string,
) {
  const toast = useToast();
  await moderationApi.moderate(
    toRawModerateArgs({ resourceId, action, reason }),
  );
  invalidateAfterModeration(queryClient);
  toast.success(i18n.t(toastKey));
  router.back();
}

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
      onPress: () =>
        run(resourceId, "publish", null, "resources:moderation.published"),
    },
  ],
});

export const buildConfirmRestoreResourceDialog: DialogBuilder<
  typeof DIALOG_KEYS.CONFIRM_RESTORE_RESOURCE
> = ({ resourceId, title }) => ({
  variant: "confirm",
  title: i18n.t("resources:moderation.restoreDialog.title"),
  description: i18n.t("resources:moderation.restoreDialog.body", { title }),
  actions: [
    {
      label: i18n.t("resources:moderation.restoreDialog.cancel"),
      variant: "cancel",
      onPress: () => {},
    },
    {
      label: i18n.t("resources:moderation.restoreDialog.confirm"),
      onPress: () =>
        run(resourceId, "restore", null, "resources:moderation.restored"),
    },
  ],
});

/** Removal is final: nothing in the database moves a removed document back. */
export const buildConfirmRemoveResourceDialog: DialogBuilder<
  typeof DIALOG_KEYS.CONFIRM_REMOVE_RESOURCE
> = ({ resourceId, title, reason }) => ({
  variant: "destructive",
  dismissible: false,
  title: i18n.t("resources:moderation.removeDialog.title"),
  description: i18n.t("resources:moderation.removeDialog.body", { title }),
  actions: [
    {
      label: i18n.t("resources:moderation.removeDialog.cancel"),
      variant: "cancel",
      onPress: () => {},
    },
    {
      label: i18n.t("resources:moderation.removeDialog.confirm"),
      variant: "destructive",
      onPress: () =>
        run(resourceId, "remove", reason, "resources:moderation.removed"),
    },
  ],
});
