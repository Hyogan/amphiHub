import { onlineManager } from "@tanstack/react-query";
import { useSyncExternalStore } from "react";

export function useIsOnline(): boolean {
  return useSyncExternalStore(
    (callback) => onlineManager.subscribe(callback),
    () => onlineManager.isOnline(),
  );
}
