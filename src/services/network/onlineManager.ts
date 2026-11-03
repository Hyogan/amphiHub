import NetInfo from "@react-native-community/netinfo";
import { onlineManager } from "@tanstack/react-query";

// Tells TanStack Query whether the phone is online, so queries pause instead of failing after retries.
// Connected to a network is not enough: "no internet" counts as offline too. Import once, for the side effect.
onlineManager.setEventListener((setOnline) =>
  NetInfo.addEventListener((state) => {
    setOnline(
      Boolean(state.isConnected) && state.isInternetReachable !== false,
    );
  }),
);
