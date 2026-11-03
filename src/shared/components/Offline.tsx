import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text, View } from "react-native";

import { useThemeColors } from "@/shared/hooks/theme";
import { useIsOnline } from "@/shared/hooks/useIsOnline";
import type { Colors } from "@/theme/colors";
import { fonts } from "@/theme/typography";

import { Button } from "./Button";
import { EmptyState } from "./common/EmptyState";
import { Tap } from "./Pressy";

/** A slim banner, shown only while offline. The link opens what is on this phone. */
export function OfflineNotice({
  message,
  showAction = true,
}: {
  message?: string;
  showAction?: boolean;
}) {
  const colors = useThemeColors();
  const router = useRouter();
  const { t } = useTranslation();
  const online = useIsOnline();
  const styles = createStyles(colors);
  if (online) return null;
  return (
    <View style={styles.notice}>
      <Ionicons
        name="cloud-offline-outline"
        size={22}
        color={colors.status.warning}
      />
      <View style={styles.noticeText}>
        <Text style={styles.noticeMessage}>
          {message ?? t("offline.notice")}
        </Text>
        {showAction ? (
          <Tap
            label={t("offline.seeDownloads")}
            onPress={() =>
              router.navigate({ pathname: "/saved", params: { tab: "phone" } })
            }
          >
            <Text style={styles.link}>{t("offline.seeDownloads")}</Text>
          </Tap>
        ) : null}
      </View>
    </View>
  );
}

/** One line for a section of a screen that needs a connection. */
export function OfflineSection() {
  const colors = useThemeColors();
  const { t } = useTranslation();
  const styles = createStyles(colors);
  return (
    <View style={styles.section}>
      <Ionicons
        name="cloud-offline-outline"
        size={20}
        color={colors.icon.secondary}
      />
      <Text style={styles.sectionText}>{t("offline.section")}</Text>
    </View>
  );
}

/** A whole screen that needs a connection. Resumes by itself when the connection returns. */
export function OfflineState({
  title,
  body,
  actionLabel,
  onAction,
}: {
  title?: string;
  body?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  const { t } = useTranslation();
  return (
    <EmptyState
      title={title ?? t("offline.title")}
      body={body ?? t("offline.body")}
    >
      {onAction ? (
        <Button
          label={actionLabel ?? t("offline.seeDownloads")}
          kind="outline"
          onPress={onAction}
        />
      ) : null}
    </EmptyState>
  );
}

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    notice: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 12,
      padding: 14,
      borderRadius: 16,
      backgroundColor: colors.status.warningSoft,
    },
    noticeText: { flex: 1, gap: 4 },
    noticeMessage: {
      fontFamily: fonts.bold,
      fontSize: 14,
      lineHeight: 20,
      color: colors.text.primary,
    },
    link: {
      fontFamily: fonts.extrabold,
      fontSize: 14,
      color: colors.text.link,
      textDecorationLine: "underline",
    },
    section: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingVertical: 12,
    },
    sectionText: {
      fontFamily: fonts.semibold,
      fontSize: 14,
      color: colors.text.secondary,
    },
  });
