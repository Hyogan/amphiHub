import { Stack } from "expo-router";

import { ContributeScreen } from "@/features/contribute/screens/ContributeScreen";

export default function ContributeRoute() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <ContributeScreen />
    </>
  );
}
