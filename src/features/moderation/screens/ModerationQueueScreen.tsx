import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { EmptyState } from "@/shared/components/common/EmptyState";
import { ScreenHeader } from "@/shared/components/common/ScreenHeader";
import { Tag } from "@/shared/components/Tag";
import { useThemeColors } from "@/shared/hooks/theme";
import type { Colors } from "@/theme/colors";

import {
  DocumentsList,
  ReportsList,
  SuggestionsList,
} from "../components/ModerationLists";
import {
  useIsModerator,
  useModerationQueueQuery,
  useModerationReportsQuery,
  useModerationSuggestionsQuery,
} from "../hooks/useModeration";

type Tab = "submitted" | "in_review" | "restricted" | "reports" | "suggestions";

export function ModerationQueueScreen() {
  const colors = useThemeColors();
  const { t } = useTranslation("resources");
  const styles = createStyles(colors);
  const isModerator = useIsModerator();
  const queue = useModerationQueueQuery();
  const reports = useModerationReportsQuery();
  const suggestions = useModerationSuggestionsQuery();
  const [tab, setTab] = useState<Tab>("submitted");

  if (!isModerator) {
    return (
      <SafeAreaView style={styles.root} edges={["top"]}>
        <View style={styles.padded}>
          <ScreenHeader title={t("moderation.title")} />
          <EmptyState title={t("moderation.notAllowed")} />
        </View>
      </SafeAreaView>
    );
  }

  const count = (status: string) =>
    (queue.data ?? []).filter((item) => item.status === status).length;
  const tabs: { id: Tab; label: string; count: number }[] = [
    {
      id: "submitted",
      label: t("moderation.tabWaiting"),
      count: count("submitted"),
    },
    {
      id: "in_review",
      label: t("moderation.tabInReview"),
      count: count("in_review"),
    },
    {
      id: "restricted",
      label: t("moderation.tabRestricted"),
      count: count("restricted"),
    },
    {
      id: "reports",
      label: t("moderation.tabReports"),
      count: reports.data?.length ?? 0,
    },
    {
      id: "suggestions",
      label: t("moderation.tabSuggestions"),
      count: suggestions.data?.length ?? 0,
    },
  ];

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      <View style={styles.padded}>
        <ScreenHeader title={t("moderation.title")} />
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabScroll}
        contentContainerStyle={styles.tabs}
      >
        {tabs.map((item) => (
          <Tag
            key={item.id}
            label={`${item.label} (${item.count})`}
            selected={tab === item.id}
            onPress={() => setTab(item.id)}
          />
        ))}
      </ScrollView>
      <View style={styles.body}>
        {tab === "reports" ? (
          <ReportsList />
        ) : tab === "suggestions" ? (
          <SuggestionsList />
        ) : (
          <DocumentsList status={tab} />
        )}
      </View>
    </SafeAreaView>
  );
}

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.background.primary },
    padded: { paddingHorizontal: 20 },
    tabScroll: { flexGrow: 0 },
    tabs: { gap: 8, paddingHorizontal: 20, paddingBottom: 8 },
    body: { flex: 1 },
  });
