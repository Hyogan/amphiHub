import { useState } from "react";
import { useTranslation } from "react-i18next";
import { FlatList, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "@/shared/components/Button";
import { EmptyState } from "@/shared/components/common/EmptyState";
import { ScreenHeader } from "@/shared/components/common/ScreenHeader";
import { SkeletonRows } from "@/shared/components/SkeletonRows";
import { Tag } from "@/shared/components/Tag";
import { useThemeColors } from "@/shared/hooks/theme";
import type { Colors } from "@/theme/colors";

import { ModerationRow } from "../components/ModerationRow";
import {
    useIsModerator,
    useModerationQueueQuery,
} from "../hooks/useModeration";

type Tab = "submitted" | "in_review";

export function ModerationQueueScreen() {
  const colors = useThemeColors();
  const { t } = useTranslation("resources");
  const { t: tc } = useTranslation();
  const styles = createStyles(colors);
  const isModerator = useIsModerator();
  const queue = useModerationQueueQuery();
  const [tab, setTab] = useState<Tab>("submitted");

  const all = queue.data ?? [];
  const waiting = all.filter((item) => item.status === "submitted");
  const inReview = all.filter((item) => item.status === "in_review");
  const items = tab === "submitted" ? waiting : inReview;

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

  let empty;
  if (queue.isPending) {
    empty = <SkeletonRows count={4} />;
  } else if (queue.isError) {
    empty = (
      <EmptyState title={t("moderation.loadError")}>
        <Button
          label={tc("actions.retry")}
          kind="outline"
          onPress={() => queue.refetch()}
        />
      </EmptyState>
    );
  } else {
    empty = (
      <EmptyState
        title={t("moderation.emptyTitle")}
        body={t("moderation.emptyBody")}
      />
    );
  }

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ModerationRow item={item} />}
        ListHeaderComponent={
          <View style={styles.header}>
            <ScreenHeader title={t("moderation.title")} />
            <View style={styles.tabs}>
              <Tag
                label={`${t("moderation.tabWaiting")} (${waiting.length})`}
                selected={tab === "submitted"}
                onPress={() => setTab("submitted")}
              />
              <Tag
                label={`${t("moderation.tabInReview")} (${inReview.length})`}
                selected={tab === "in_review"}
                onPress={() => setTab("in_review")}
              />
            </View>
          </View>
        }
        ListEmptyComponent={empty}
        refreshing={queue.isRefetching}
        onRefresh={() => queue.refetch()}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.background.primary },
    padded: { paddingHorizontal: 20 },
    content: { paddingHorizontal: 20, paddingBottom: 40 },
    header: { gap: 12, paddingBottom: 8 },
    tabs: { flexDirection: "row", gap: 8 },
  });
