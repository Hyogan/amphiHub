import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text, View } from "react-native";

import { useThemeColors } from "@/shared/hooks/theme";
import type { Colors } from "@/theme/colors";
import { fonts } from "@/theme/typography";

import { Pressy } from "../Pressy";

/** Back button, optional title, optional right-hand actions. For screens that sit above the tabs. */
export function ScreenHeader({
  title,
  right,
}: {
  title?: string;
  right?: ReactNode;
}) {
  const colors = useThemeColors();
  const router = useRouter();
  const { t } = useTranslation();
  const styles = createStyles(colors);
  return (
    <View style={styles.row}>
      <Pressy
        label={t("actions.back")}
        onPress={() =>
          router.canGoBack() ? router.back() : router.replace("/(tabs)")
        }
        style={styles.button}
      >
        <Ionicons name="arrow-back" size={24} color={colors.icon.primary} />
      </Pressy>
      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>
      {right}
    </View>
  );
}

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    row: {
      flexDirection: "row",
      alignItems: "center",
      minHeight: 56,
      marginLeft: -12,
      marginRight: -4,
    },
    button: {
      width: 48,
      height: 48,
      alignItems: "center",
      justifyContent: "center",
    },
    title: {
      flex: 1,
      fontFamily: fonts.extrabold,
      fontSize: 18,
      color: colors.text.primary,
    },
  });
