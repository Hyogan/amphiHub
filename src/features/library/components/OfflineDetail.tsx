import { useTranslation } from "react-i18next";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useResourceTypeLabel } from "@/features/resources/hooks/useResources";
import { getVerificationKinds } from "@/features/resources/types/resource";
import { ScreenHeader } from "@/shared/components/common/ScreenHeader";
import { Stamp } from "@/shared/components/Stamp";
import { useThemeColors } from "@/shared/hooks/theme";
import type { Colors } from "@/theme/colors";
import { fonts } from "@/theme/typography";

import type { DownloadRecord } from "../types/download";
import { DownloadPanel } from "./DownloadPanel";

/** The detail screen when the server can't be reached but the file is on this phone. */
export function OfflineDetail({ record }: { record: DownloadRecord }) {
  const colors = useThemeColors();
  const { t } = useTranslation("resources");
  const typeLabel = useResourceTypeLabel();
  const styles = createStyles(colors);
  const r = record.summary;
  const session = r.examSession ? t(`session.${r.examSession}`) : null;
  const subtitle = [
    r.courseCode,
    r.academicYear ?? t("detail.yearUnknown"),
    session,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader title={typeLabel(r.typeCode)} />
        <View style={styles.margin}>
          <Text style={styles.marginText}>{t("download.offlineNotice")}</Text>
        </View>
        <View style={styles.stamps}>
          {getVerificationKinds(r).map((kind) => (
            <Stamp key={kind} kind={kind} />
          ))}
        </View>
        <Text style={styles.title}>{r.title}</Text>
        <Text style={styles.subtitle}>{r.courseName}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
        <DownloadPanel resource={r} fileReady />
        <View style={styles.margin}>
          <Text style={styles.marginText}>{t("detail.notice")}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.background.primary },
    content: { paddingHorizontal: 20, paddingBottom: 40, gap: 14 },
    stamps: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
    title: {
      fontFamily: fonts.extrabold,
      fontSize: 26,
      lineHeight: 32,
      letterSpacing: -0.6,
      color: colors.text.primary,
    },
    subtitle: {
      fontFamily: fonts.semibold,
      fontSize: 15,
      color: colors.text.secondary,
      marginTop: -8,
    },
    margin: {
      borderLeftWidth: 3,
      borderLeftColor: colors.status.error,
      paddingLeft: 14,
      paddingVertical: 2,
    },
    marginText: {
      fontFamily: fonts.semibold,
      fontSize: 14,
      lineHeight: 21,
      color: colors.text.primary,
    },
  });
