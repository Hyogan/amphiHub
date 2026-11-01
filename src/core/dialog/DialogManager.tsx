import { useAppSelector } from "@/store/hooks";

import { DialogBase } from "./DialogBase";
import { DIALOG_REGISTRY } from "./dialogRegistry";
import { useDialog } from "./useDialog";

/** Mounted once in the root layout. */
export function DialogManager() {
  const activeKey = useAppSelector((state) => state.dialog.activeKey);
  const params = useAppSelector((state) => state.dialog.params);
  const { close } = useDialog();
  if (!activeKey) return null;
  // The one deliberate cast: Redux params are untyped.
  const config = DIALOG_REGISTRY[activeKey](params as never);
  return <DialogBase key={activeKey} config={config} onClose={close} />;
}
