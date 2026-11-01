import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Linking, StyleSheet, Text, View } from "react-native";
import { PdfView, type PdfError } from "react-native-better-pdf";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  loadReaderViewport,
  saveReaderViewport,
} from "@/services/storage/readerPosition";
import { Button } from "@/shared/components/Button";
import { EmptyState } from "@/shared/components/common/EmptyState";
import { ScreenHeader } from "@/shared/components/common/ScreenHeader";
import { Pressy } from "@/shared/components/Pressy";
import { SkeletonRows } from "@/shared/components/SkeletonRows";
import { useThemeColors } from "@/shared/hooks/theme";
import type { Colors } from "@/theme/colors";
import { fonts } from "@/theme/typography";

import { useDownloadRecord, useOpenDownload } from "../hooks/useDownloads";

const ERROR_KEYS: Record<string, string> = {
  "file-not-found": "reader.errorMissing",
  "invalid-pdf": "reader.errorInvalid",
  "unsupported-pdf": "reader.errorProtected",
  "password-required": "reader.errorProtected",
  "invalid-password": "reader.errorProtected",
  "out-of-memory": "reader.errorMemory",
};

/** Reads a downloaded PDF inside the app. Works offline: the file is on the phone. */
export function ReaderScreen({ id }: { id: string }) {
  const colors = useThemeColors();
  const { t } = useTranslation("resources");
  const { t: tc } = useTranslation();
  const styles = createStyles(colors);
  const openFile = useOpenDownload();
  const download = useDownloadRecord(id);
  const record = download.data;

  const [attempt, setAttempt] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<PdfError | null>(null);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  // Read once: where the reader left off.
  const [initialViewport] = useState(() => loadReaderViewport(id));

  if (download.isPending) {
    return (
      <SafeAreaView style={styles.root} edges={["top"]}>
        <View style={styles.padded}>
          <ScreenHeader />
          <SkeletonRows count={4} />
        </View>
      </SafeAreaView>
    );
  }

  if (!record) {
    return (
      <SafeAreaView style={styles.root} edges={["top"]}>
        <View style={styles.padded}>
          <ScreenHeader />
          <EmptyState
            title={t("reader.missingTitle")}
            body={t("reader.missingBody")}
          />
        </View>
      </SafeAreaView>
    );
  }

  const header = (
    <View style={styles.padded}>
      <ScreenHeader
        title={record.summary.courseName}
        right={
          <View style={styles.actions}>
            {loaded && total > 0 ? (
              <Text style={styles.counter}>
                {t("reader.page", { page: page + 1, total })}
              </Text>
            ) : null}
            <Pressy
              label={t("download.openWith")}
              onPress={() => openFile(record.localUri)}
              style={styles.iconButton}
            >
              <Ionicons
                name="open-outline"
                size={22}
                color={colors.icon.primary}
              />
            </Pressy>
          </View>
        }
      />
    </View>
  );

  if (error) {
    return (
      <SafeAreaView style={styles.root} edges={["top"]}>
        {header}
        <View style={styles.padded}>
          <EmptyState
            title={t(ERROR_KEYS[error.code] ?? "reader.errorGeneric")}
          >
            <Button
              label={tc("actions.retry")}
              kind="outline"
              onPress={() => {
                setError(null);
                setLoaded(false);
                setAttempt((n) => n + 1);
              }}
            />
            <Button
              label={t("download.openWith")}
              kind="text"
              onPress={() => openFile(record.localUri)}
            />
          </EmptyState>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root} edges={["top", "bottom"]}>
      {header}
      <View style={styles.viewer}>
        <PdfView
          key={attempt}
          style={styles.pdf}
          source={{ uri: record.localUri }}
          initialViewport={initialViewport}
          pageAccessibilityLabel={t("reader.a11yPage")}
          onLoad={({ pageCount }) => {
            setTotal(pageCount);
            setLoaded(true);
          }}
          onPageChange={({ page: current }) => setPage(current)}
          onViewportChange={({ viewport }) => saveReaderViewport(id, viewport)}
          onLinkPress={({ url }) => {
            // The viewer never opens links itself.
            if (url.startsWith("https://")) Linking.openURL(url);
          }}
          onError={setError}
        />
        {loaded ? null : (
          <View style={styles.loading}>
            <SkeletonRows count={5} />
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.background.primary },
    padded: { paddingHorizontal: 20 },
    actions: { flexDirection: "row", alignItems: "center", gap: 4 },
    counter: {
      fontFamily: fonts.extrabold,
      fontSize: 14,
      color: colors.text.secondary,
    },
    iconButton: {
      width: 44,
      height: 44,
      alignItems: "center",
      justifyContent: "center",
    },
    absoluteFillObject: {
      position: "absolute",
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
    },
    viewer: { flex: 1 },
    // The area around the pages. The paper itself stays white in both themes.
    pdf: { flex: 1, backgroundColor: colors.border.subtle },
    loading: {
      ...StyleSheet.absoluteFill,
      padding: 20,
      backgroundColor: colors.background.primary,
      pointerEvents: "none",
    },
  });
