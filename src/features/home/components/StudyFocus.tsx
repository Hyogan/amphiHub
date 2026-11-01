import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text, View } from "react-native";

import { useThemeColors } from "@/shared/hooks/theme";
import type { Colors } from "@/theme/colors";
import { fonts } from "@/theme/typography";

/** Static reassurance block. Nothing here is pressable. */
export function StudyFocus() {
  const colors = useThemeColors();
  const { t } = useTranslation("home");
  const styles = createStyles(colors);
  return (
    <View style={styles.card}>
      <View style={styles.text}>
        <Text style={styles.eyebrow}>{t("focus.eyebrow")}</Text>
        <Text style={styles.title}>{t("focus.title")}</Text>
        <Text style={styles.caption}>{t("focus.caption")}</Text>
      </View>
      <View style={styles.sheet}>
        <View style={styles.sheetLine} />
        <View style={[styles.sheetLine, styles.sheetLineShort]} />
        <View style={styles.sheetLine} />
        <View style={styles.check}>
          <Ionicons name="checkmark" size={16} color={colors.text.inverse} />
        </View>
      </View>
    </View>
  );
}

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    card: {
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
      padding: 18,
      borderRadius: 20,
      backgroundColor: colors.brand.primarySoft,
    },
    text: { flex: 1, gap: 4 },
    eyebrow: {
      fontFamily: fonts.extrabold,
      fontSize: 13,
      color: colors.text.link,
    },
    title: {
      fontFamily: fonts.extrabold,
      fontSize: 20,
      lineHeight: 25,
      letterSpacing: -0.3,
      color: colors.text.primary,
    },
    caption: {
      fontFamily: fonts.semibold,
      fontSize: 14,
      lineHeight: 20,
      color: colors.text.secondary,
    },
    sheet: {
      width: 64,
      height: 80,
      justifyContent: "center",
      gap: 8,
      paddingHorizontal: 10,
      borderRadius: 8,
      backgroundColor: colors.paper.surface,
    },
    sheetLine: {
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.paper.line,
    },
    sheetLineShort: { width: "60%" },
    check: {
      position: "absolute",
      right: -8,
      bottom: -8,
      width: 28,
      height: 28,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.status.success,
    },
  });
