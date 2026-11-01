import { useAppDispatch } from "@/store/hooks";

import type { DialogKey, DialogParamsMap } from "./dialogKeys";
import { closeDialog, openDialog } from "./dialogSlice";

export function useDialog() {
  const dispatch = useAppDispatch();
  return {
    open: <K extends DialogKey>(key: K, params: DialogParamsMap[K]) =>
      dispatch(openDialog({ key, params })),
    close: () => dispatch(closeDialog()),
  };
}
