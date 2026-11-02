import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text, View } from "react-native";

import { useResourceTypeLabel } from "@/features/resources/hooks/useResources";
import { formatFileSize } from "@/features/resources/utils/format";
import { Pressy } from "@/shared/components/Pressy";
import { useThemeColors } from "@/shared/hooks/theme";
import type { Colors } from "@/theme/colors";
import { fonts } from "@/theme/typography";

import type { Submission } from "../types/submission";
import { getSubmissionStatusConfig } from "../utils/getSubmissionStatusConfig";

/** One contribution with its status. Only a published document opens: the others are not public yet. */
export function SubmissionRow({ item }: { item: Submission }) {
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
  const course = [item.courseName, item.courseCode].filter(Boolean).join(", ");
  const sent = t("contributions.sentOn", {
    date: new Date(item.createdAt).toLocaleDateString(i18n.language),
  });
  const size =
    item.sizeBytes !== null
      ? `, ${formatFileSize(item.sizeBytes, i18n.language)}`
      : "";

  const content = (
    <View style={styles.body}>
      <Text style={styles.kicker}>{kicker}</Text>
      <Text style={styles.title} numberOfLines={2}>
        {item.title}
      </Text>
      <Text style={styles.meta} numberOfLines={1}>
        {course}
      </Text>
      <Text style={styles.meta} numberOfLines={1}>
        {item.universityName}
      </Text>
      <View style={[styles.pill, { backgroundColor: status.background }]}>
        <Ionicons name={status.icon} size={16} color={status.color} />
        <Text style={[styles.pillText, { color: status.color }]}>
          {status.label}
        </Text>
      </View>
      {item.reason ? (
        <View style={styles.margin}>
          <Text style={styles.marginLabel}>
            {t("contributions.reasonLabel")}
          </Text>
          <Text style={styles.marginText}>{item.reason}</Text>
        </View>
      ) : null}
      <Text style={styles.caption}>{`${sent}${size}`}</Text>
    </View>
  );

  if (item.status === "published") {
    return (
      <Pressy
        depth={0.98}
        onPress={() =>
          router.push({ pathname: "/resource/[id]", params: { id: item.id } })
        }
        style={styles.row}
      >
        {content}
        <Ionicons name="chevron-forward" size={20} color={colors.icon.muted} />
      </Pressy>
    );
  }
  return <View style={styles.row}>{content}</View>;
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
    pill: {
      flexDirection: "row",
      alignItems: "center",
      alignSelf: "flex-start",
      gap: 6,
      marginTop: 8,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 12,
    },
    pillText: { fontFamily: fonts.extrabold, fontSize: 13 },
    margin: {
      borderLeftWidth: 3,
      borderLeftColor: colors.status.error,
      paddingLeft: 12,
      marginTop: 8,
      gap: 2,
    },
    marginLabel: {
      fontFamily: fonts.extrabold,
      fontSize: 12,
      color: colors.text.secondary,
    },
    marginText: {
      fontFamily: fonts.semibold,
      fontSize: 14,
      lineHeight: 20,
      color: colors.text.primary,
    },
    caption: {
      fontFamily: fonts.semibold,
      fontSize: 12,
      color: colors.text.secondary,
      marginTop: 8,
    },
  });
