import { useState } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text, View } from "react-native";
import { PdfView, type PdfError } from "react-native-better-pdf";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "@/shared/components/Button";
import { EmptyState } from "@/shared/components/common/EmptyState";
import { ScreenHeader } from "@/shared/components/common/ScreenHeader";
import { SkeletonRows } from "@/shared/components/SkeletonRows";
import { useThemeColors } from "@/shared/hooks/theme";
import { pdfErrorKey } from "@/shared/utils/pdfErrorKey";
import type { Colors } from "@/theme/colors";
import { fonts } from "@/theme/typography";

import { useReviewFileQuery } from "../hooks/useModeration";

/** Reads a submitted file straight from storage. Nothing is saved on the phone. */
export function ReviewReaderScreen({ id }: { id: string }) {
  const colors = useThemeColors();
  const { t } = useTranslation("resources");
  const { t: tc } = useTranslation();
  const styles = createStyles(colors);
  const file = useReviewFileQuery(id);
  const [attempt, setAttempt] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<PdfError | null>(null);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);

  const header = (
    <View style={styles.padded}>
      <ScreenHeader
        title={t("moderation.fileTitle")}
        right={
          loaded && total > 0 ? (
            <Text style={styles.counter}>
              {t("reader.page", { page: page + 1, total })}
            </Text>
          ) : undefined
        }
      />
    </View>
  );

  if (file.isPending) {
    return (
      <SafeAreaView style={styles.root} edges={["top"]}>
        {header}
        <View style={styles.padded}>
          <SkeletonRows count={4} />
        </View>
      </SafeAreaView>
    );
  }

  if (file.isError || error) {
    return (
      <SafeAreaView style={styles.root} edges={["top"]}>
        {header}
        <View style={styles.padded}>
          <EmptyState
            title={
              error ? t(pdfErrorKey(error.code)) : t("moderation.fileError")
            }
          >
            <Button
              label={tc("actions.retry")}
              kind="outline"
              onPress={() => {
                setError(null);
                setLoaded(false);
                setAttempt((n) => n + 1);
                file.refetch();
              }}
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
          // The link changes every time, so the copy is identified by the file instead.
          source={{
            uri: file.data.url,
            cacheKey: `review-${file.data.fileId}`,
          }}
          pageAccessibilityLabel={t("reader.a11yPage")}
          onLoad={({ pageCount }) => {
            setTotal(pageCount);
            setLoaded(true);
          }}
          onPageChange={({ page: current }) => setPage(current)}
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
    counter: {
      fontFamily: fonts.extrabold,
      fontSize: 14,
      color: colors.text.secondary,
    },
    viewer: { flex: 1 },
    pdf: { flex: 1, backgroundColor: colors.border.subtle },
    loading: {
      ...StyleSheet.absoluteFill,
      padding: 20,
      backgroundColor: colors.background.primary,
      pointerEvents: "none",
    },
  });
