import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text, View } from "react-native";

import { DIALOG_KEYS } from "@/core/dialog/dialogKeys";
import { useDialog } from "@/core/dialog/useDialog";
import { useRequireAuth } from "@/features/auth/hooks/useRequireAuth";
import type { ResourceSummary } from "@/features/resources/types/resource";
import { formatFileSize } from "@/features/resources/utils/format";
import { Button } from "@/shared/components/Button";
import { useThemeColors } from "@/shared/hooks/theme";
import { useAppSelector } from "@/store/hooks";
import type { Colors } from "@/theme/colors";
import { fonts } from "@/theme/typography";

import { useRouter } from "expo-router";
import {
  cancelDownload,
  useDownloadRecord,
  useOpenDownload,
  useStartDownload,
} from "../hooks/useDownloads";

/** Download, progress, open and delete for one document. Nothing downloads without a tap. */
export function DownloadPanel({
  resource,
  fileReady,
}: {
  resource: ResourceSummary;
  fileReady: boolean;
}) {
  const colors = useThemeColors();
  const { t, i18n } = useTranslation("resources");
  const requireAuth = useRequireAuth();
  const dialog = useDialog();
  const styles = createStyles(colors);
  const router = useRouter();

  const record = useDownloadRecord(resource.id).data;
  const progress = useAppSelector(
    (state) => state.downloads.active[resource.id],
  );
  const start = useStartDownload();
  const openFile = useOpenDownload();

  const size =
    resource.sizeBytes !== null
      ? formatFileSize(resource.sizeBytes, i18n.language)
      : "";

  if (record) {
    return (
      <View style={styles.wrap}>
        <View style={styles.status}>
          <Ionicons
            name="checkmark-circle"
            size={20}
            color={colors.status.success}
          />
          <Text style={styles.statusText}>
            {t("download.onPhone", {
              size: formatFileSize(record.sizeBytes, i18n.language),
            })}
          </Text>
        </View>
        <Button
          label={t("download.open")}
          icon="book-outline"
          onPress={() =>
            router.push({
              pathname: "/reader/[id]",
              params: { id: resource.id },
            })
          }
        />
        <Button
          label={t("download.openWith")}
          kind="outline"
          icon="open-outline"
          onPress={() => openFile(record.localUri)}
        />
        <Button
          label={t("download.delete")}
          kind="text"
          onPress={() =>
            dialog.open(DIALOG_KEYS.CONFIRM_DELETE_DOWNLOAD, {
              resourceId: resource.id,
              title: resource.title,
            })
          }
        />
      </View>
    );
  }

  if (progress !== undefined) {
    const percent = Math.round(progress * 100);
    return (
      <View style={styles.wrap}>
        <View style={styles.track}>
          <View style={[styles.fill, { width: `${percent}%` }]} />
        </View>
        <View style={styles.progressRow}>
          <Text style={styles.statusText}>
            {t("download.percent", { value: percent })}
          </Text>
          <Button
            label={t("download.cancel")}
            kind="text"
            onPress={() => cancelDownload(resource.id)}
          />
        </View>
      </View>
    );
  }

  if (!fileReady) return null;

  return (
    <View style={styles.wrap}>
      <Button
        label={t("download.action", { size })}
        icon="download-outline"
        onPress={() => {
          if (!requireAuth()) return;
          start.mutate(resource);
        }}
      />
    </View>
  );
}

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    wrap: { gap: 10 },
    status: { flexDirection: "row", alignItems: "center", gap: 8 },
    statusText: {
      fontFamily: fonts.bold,
      fontSize: 14,
      color: colors.text.primary,
    },
    track: {
      height: 10,
      borderRadius: 5,
      overflow: "hidden",
      backgroundColor: colors.border.subtle,
    },
    fill: {
      height: 10,
      borderRadius: 5,
      backgroundColor: colors.brand.primary,
    },
    progressRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
  });
