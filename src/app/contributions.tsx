import { Stack } from "expo-router";

import { MyContributionsScreen } from "@/features/contribute/screens/MyContributionsScreen";

export default function ContributionsRoute() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <MyContributionsScreen />
    </>
  );
}
