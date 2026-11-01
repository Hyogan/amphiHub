import { Stack, useLocalSearchParams } from "expo-router";

import { CourseScreen } from "@/features/resources/screens/CourseScreen";

export default function CourseRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <CourseScreen id={id} />
    </>
  );
}
