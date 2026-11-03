export const DIALOG_KEYS = {
  CONFIRM_DELETE_DOWNLOAD: "CONFIRM_DELETE_DOWNLOAD",
  CONFIRM_PUBLISH_RESOURCE: "CONFIRM_PUBLISH_RESOURCE",
} as const;

export type DialogKey = (typeof DIALOG_KEYS)[keyof typeof DIALOG_KEYS];

/** Params are plain serialisable data: ids and names, never functions. */
export interface DialogParamsMap {
  [DIALOG_KEYS.CONFIRM_DELETE_DOWNLOAD]: { resourceId: string; title: string };
  [DIALOG_KEYS.CONFIRM_PUBLISH_RESOURCE]: { resourceId: string; title: string };
}
