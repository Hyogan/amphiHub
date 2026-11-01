import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text, View } from "react-native";

import { Button } from "@/shared/components/Button";
import { Tap } from "@/shared/components/Pressy";
import { useThemeColors } from "@/shared/hooks/theme";
import type { Colors } from "@/theme/colors";
import { fonts } from "@/theme/typography";

export type CampusChipState = "guest" | "incomplete" | "complete";

interface CampusChipProps {
  state: CampusChipState;
  universityName?: string;
  programName?: string;
  level?: string | null;
  /** Guest: go to sign-up. Incomplete or complete: go to the profile. */
  onPress: () => void;
}

export function CampusChip({
  state,
  universityName,
  programName,
  level,
  onPress,
}: CampusChipProps) {
  const colors = useThemeColors();
  const { t } = useTranslation("home");
  const styles = createStyles(colors);

  if (state === "complete") {
    const detail = [
      programName,
      level ? t("campus.levelValue", { level }) : null,
    ]
      .filter(Boolean)
      .join(", ");
    return (
      <View style={styles.card}>
        <View style={styles.tile}>
          <Ionicons
            name="school-outline"
            size={22}
            color={colors.brand.primary}
          />
        </View>
        <View style={styles.body}>
          <Text style={styles.label}>{t("campus.label")}</Text>
          <Text style={styles.title} numberOfLines={1}>
            {universityName}
          </Text>
          {detail ? (
            <Text style={styles.detail} numberOfLines={1}>
              {detail}
            </Text>
          ) : null}
        </View>
        <Tap label={t("campus.change")} onPress={onPress}>
          <Text style={styles.change}>{t("campus.change")}</Text>
        </Tap>
      </View>
    );
  }

  const guest = state === "guest";
  return (
    <View style={[styles.card, styles.cardStacked]}>
      <View style={styles.row}>
        <View style={styles.tile}>
          <Ionicons
            name={guest ? "person-outline" : "school-outline"}
            size={22}
            color={colors.brand.primary}
          />
        </View>
        <View style={styles.body}>
          <Text style={styles.title}>
            {guest ? t("campus.guestTitle") : t("campus.completeTitle")}
          </Text>
          <Text style={styles.detail}>
            {guest ? t("campus.guestBody") : t("campus.completeBody")}
          </Text>
        </View>
      </View>
      <Button label={t("campus.action")} onPress={onPress} />
    </View>
  );
}

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    card: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      padding: 14,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.border.subtle,
      backgroundColor: colors.background.secondary,
    },
    cardStacked: { flexDirection: "column", alignItems: "stretch", gap: 14 },
    row: { flexDirection: "row", alignItems: "center", gap: 12 },
    tile: {
      width: 44,
      height: 44,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.brand.primarySoft,
    },
    body: { flex: 1, gap: 2 },
    label: {
      fontFamily: fonts.semibold,
      fontSize: 12,
      color: colors.text.secondary,
    },
    title: {
      fontFamily: fonts.extrabold,
      fontSize: 16,
      color: colors.text.primary,
    },
    detail: {
      fontFamily: fonts.semibold,
      fontSize: 13,
      lineHeight: 19,
      color: colors.text.secondary,
    },
    change: {
      fontFamily: fonts.extrabold,
      fontSize: 14,
      color: colors.text.link,
      textDecorationLine: "underline",
    },
  });
