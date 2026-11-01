import { DIALOG_KEYS } from "@/core/dialog/dialogKeys";
import type { DialogBuilder } from "@/core/dialog/dialogRegistry";
import i18n from "@/i18n";
import { deleteDownload } from "@/services/download/downloadService";
import { queryClient } from "@/services/queryClient";
import { useToast } from "@/shared/toast/useToast";
import { downloadKeys } from "../hooks/useDownloads";
// import { dispatchToast } from "@/shared/toast/dispatchToast";

export const buildConfirmDeleteDownloadDialog: DialogBuilder<
  typeof DIALOG_KEYS.CONFIRM_DELETE_DOWNLOAD
> = ({ resourceId, title }) => ({
  variant: "destructive",
  title: i18n.t("resources:download.deleteTitle"),
  description: i18n.t("resources:download.deleteBody", { title }),
  actions: [
    {
      label: i18n.t("resources:download.deleteCancel"),
      variant: "cancel",
      onPress: () => {},
    },
    {
      label: i18n.t("resources:download.deleteConfirm"),
      variant: "destructive",
      onPress: async () => {
        const toast = useToast();

        try {
          await deleteDownload(resourceId);

          await queryClient.invalidateQueries({
            queryKey: downloadKeys.all,
          });

          toast.success(i18n.t("resources:download.deleted"));
        } catch (error) {
          console.error("Failed to delete download:", error);

          toast.error(i18n.t("resources:download.deleteError"));
        }
      },
    },
  ],
});
