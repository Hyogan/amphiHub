import { buildConfirmDeleteDownloadDialog } from "@/features/library/dialogs/downloadDialogs";
import { buildConfirmPublishResourceDialog } from "@/features/moderation/dialogs/moderationDialogs";

import {
  DIALOG_KEYS,
  type DialogKey,
  type DialogParamsMap,
} from "./dialogKeys";

export type DialogVariant = "confirm" | "destructive" | "info" | "warning";

export interface DialogActionData {
  label: string;
  onPress: () => void | Promise<void>;
  variant?: "default" | "destructive" | "cancel";
  /** Default true. Ignored when the action fails: failures never close the dialog. */
  closeOnAction?: boolean;
}

export interface DialogConfig {
  variant: DialogVariant;
  title: string;
  description?: string;
  dismissible?: boolean;
  actions: DialogActionData[];
}

export type DialogBuilder<K extends DialogKey> = (
  params: DialogParamsMap[K],
) => DialogConfig;

export const DIALOG_REGISTRY: { [K in DialogKey]: DialogBuilder<K> } = {
  [DIALOG_KEYS.CONFIRM_DELETE_DOWNLOAD]: buildConfirmDeleteDownloadDialog,
  [DIALOG_KEYS.CONFIRM_PUBLISH_RESOURCE]: buildConfirmPublishResourceDialog,
};
