import { Stack, useLocalSearchParams } from "expo-router";

import { ReaderScreen } from "@/features/library/screens/ReaderScreen";

export default function ReaderRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <ReaderScreen id={id} />
    </>
  );
}
