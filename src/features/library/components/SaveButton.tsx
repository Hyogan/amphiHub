import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { StyleSheet } from "react-native";

import { useRequireAuth } from "@/features/auth/hooks/useRequireAuth";
import { Pressy } from "@/shared/components/Pressy";
import { useThemeColors } from "@/shared/hooks/theme";

import { useSavedIdsQuery, useToggleSavedMutation } from "../hooks/useLibrary";

/** Bookmark for one document. Guests are sent to sign in first. */
export function SaveButton({ resourceId }: { resourceId: string }) {
  const colors = useThemeColors();
  const { t } = useTranslation("resources");
  const requireAuth = useRequireAuth();
  const savedIds = useSavedIdsQuery();
  const toggle = useToggleSavedMutation();
  const saved = savedIds.data?.includes(resourceId) ?? false;

  return (
    <Pressy
      label={saved ? t("save.remove") : t("save.add")}
      depth={0.88}
      onPress={() => {
        if (!requireAuth()) return;
        toggle.mutate({ resourceId, save: !saved });
      }}
      style={styles.button}
    >
      <Ionicons
        name={saved ? "bookmark" : "bookmark-outline"}
        size={24}
        color={saved ? colors.brand.accent : colors.icon.secondary}
      />
    </Pressy>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
});
