import UiPreviewScreen from "@/shared/components/UiPreviewScreen";
import { StyleSheet } from "react-native";

export default function Index() {
  return <UiPreviewScreen />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
