import { Stack, useLocalSearchParams } from "expo-router";

import { ReviewReaderScreen } from "@/features/moderation/screens/ReviewReaderScreen";

export default function ReviewReaderRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <ReviewReaderScreen id={id} />
    </>
  );
}
