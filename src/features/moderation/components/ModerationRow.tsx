import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text, View } from "react-native";

import { getSubmissionStatusConfig } from "@/features/contribute/utils/getSubmissionStatusConfig";
import { useResourceTypeLabel } from "@/features/resources/hooks/useResources";
import { Pressy } from "@/shared/components/Pressy";
import { useThemeColors } from "@/shared/hooks/theme";
import type { Colors } from "@/theme/colors";
import { fonts } from "@/theme/typography";

import type { ModerationItem } from "../types/moderation";

export function ModerationRow({ item }: { item: ModerationItem }) {
  const colors = useThemeColors();
  const router = useRouter();
  const { t, i18n } = useTranslation("resources");
  const typeLabel = useResourceTypeLabel();
  const styles = createStyles(colors);
  const status = getSubmissionStatusConfig(item.status, colors, t);

  const kicker = [
    typeLabel(item.typeCode),
    item.academicYear ?? (item.yearUnknown ? t("detail.yearUnknown") : null),
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <Pressy
      depth={0.98}
      onPress={() =>
        router.push({ pathname: "/review/[id]", params: { id: item.id } })
      }
      style={styles.row}
    >
      <View style={styles.body}>
        <Text style={styles.kicker}>{kicker}</Text>
        <Text style={styles.title} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={styles.meta} numberOfLines={1}>
          {[item.courseName, item.courseCode].filter(Boolean).join(", ")}
        </Text>
        <Text style={styles.meta} numberOfLines={1}>
          {item.universityName}
        </Text>
        <View style={styles.pills}>
          <View style={[styles.pill, { backgroundColor: status.background }]}>
            <Ionicons name={status.icon} size={15} color={status.color} />
            <Text style={[styles.pillText, { color: status.color }]}>
              {status.label}
            </Text>
          </View>
          {item.duplicateOf ? (
            <View
              style={[
                styles.pill,
                { backgroundColor: colors.status.errorSoft },
              ]}
            >
              <Ionicons
                name="copy-outline"
                size={15}
                color={colors.status.error}
              />
              <Text style={[styles.pillText, { color: colors.status.error }]}>
                {t("moderation.possibleDuplicate")}
              </Text>
            </View>
          ) : null}
          {!item.fileReady ? (
            <View
              style={[
                styles.pill,
                { backgroundColor: colors.status.warningSoft },
              ]}
            >
              <Ionicons
                name="alert-circle-outline"
                size={15}
                color={colors.status.warning}
              />
              <Text style={[styles.pillText, { color: colors.status.warning }]}>
                {t("moderation.fileNotReady")}
              </Text>
            </View>
          ) : null}
        </View>
        <Text style={styles.caption}>
          {t("moderation.sentOn", {
            date: new Date(item.createdAt).toLocaleDateString(i18n.language),
          })}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.icon.muted} />
    </Pressy>
  );
}

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingVertical: 16,
      borderTopWidth: 1,
      borderTopColor: colors.border.subtle,
    },
    body: { flex: 1, gap: 2 },
    kicker: {
      fontFamily: fonts.extrabold,
      fontSize: 13,
      color: colors.text.link,
    },
    title: {
      fontFamily: fonts.extrabold,
      fontSize: 17,
      lineHeight: 22,
      color: colors.text.primary,
    },
    meta: {
      fontFamily: fonts.semibold,
      fontSize: 14,
      color: colors.text.secondary,
    },
    pills: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 8 },
    pill: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 12,
    },
    pillText: { fontFamily: fonts.extrabold, fontSize: 13 },
    caption: {
      fontFamily: fonts.semibold,
      fontSize: 12,
      color: colors.text.secondary,
      marginTop: 8,
    },
  });
