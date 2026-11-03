import { Stack, useLocalSearchParams } from "expo-router";

import { ReviewScreen } from "@/features/moderation/screens/ReviewScreen";

export default function ReviewRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <ReviewScreen id={id} />
    </>
  );
}
