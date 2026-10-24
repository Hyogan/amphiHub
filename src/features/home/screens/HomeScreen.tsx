import { useTranslation } from "react-i18next";
import { ScrollView, StyleSheet, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppTopBar } from "@/shared/components/AppTopBar";
import { useThemeColors } from "@/shared/hooks/theme";
import type { Colors } from "@/theme/colors";
import { fonts } from "@/theme/typography";

export function HomeScreen() {
  const colors = useThemeColors();
  const { t } = useTranslation();
  const styles = createStyles(colors);
  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content}>
        <AppTopBar />
        <Text style={styles.title}>{t("tabs.home")}</Text>
        <Text style={styles.body}>{t("state.comingSoon")}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.background.primary },
    content: { padding: 20, gap: 14 },
    title: {
      fontFamily: fonts.extrabold,
      fontSize: 26,
      lineHeight: 32,
      color: colors.text.primary,
      letterSpacing: -0.5,
    },
    body: {
      fontFamily: fonts.semibold,
      fontSize: 15,
      lineHeight: 22,
      color: colors.text.secondary,
    },
  });
