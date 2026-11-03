import { Stack } from "expo-router";

import { ModerationQueueScreen } from "@/features/moderation/screens/ModerationQueueScreen";

export default function ModerationRoute() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <ModerationQueueScreen />
    </>
  );
}
