import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { FlatList, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ResourceRow } from "@/features/resources/components/ResourceRow";
import { formatFileSize } from "@/features/resources/utils/format";
import { Button } from "@/shared/components/Button";
import { EmptyState } from "@/shared/components/common/EmptyState";
import { SkeletonRows } from "@/shared/components/SkeletonRows";
import { Tag } from "@/shared/components/Tag";
import { useThemeColors } from "@/shared/hooks/theme";
import { useAppSelector } from "@/store/hooks";
import type { Colors } from "@/theme/colors";
import { fonts } from "@/theme/typography";

import { useDownloadsQuery } from "../hooks/useDownloads";
import { useSavedResourcesQuery } from "../hooks/useLibrary";
// imports
import { OfflineNotice, OfflineState } from "@/shared/components/Offline";
import { isOfflinePending } from "@/shared/utils/network";
type Tab = "saved" | "phone";

export function SavedScreen() {
  const colors = useThemeColors();
  const router = useRouter();
  const { t, i18n } = useTranslation("resources");
  const { t: tc } = useTranslation();
  const styles = createStyles(colors);
  const params = useLocalSearchParams<{ tab?: string }>();
  const [tab, setTab] = useState<Tab>(
    params.tab === "phone" ? "phone" : "saved",
  );
  useEffect(() => {
    if (params.tab === "phone") setTab("phone");
  }, [params.tab]);

  const userId = useAppSelector((state) => state.session.userId);
  const dockHeight = useAppSelector((state) => state.dock.height);
  const saved = useSavedResourcesQuery();
  const downloads = useDownloadsQuery();

  const phoneRecords = downloads.data ?? [];
  const phoneBytes = phoneRecords.reduce((sum, r) => sum + r.sizeBytes, 0);
  const savedItems = userId ? (saved.data ?? []) : [];
  const items =
    tab === "saved" ? savedItems : phoneRecords.map((r) => r.summary);

  const subline =
    tab === "saved"
      ? userId && saved.isSuccess && savedItems.length > 0
        ? t("saved.count", { count: savedItems.length })
        : null
      : phoneRecords.length > 0
        ? t("saved.phoneSummary", {
            count: phoneRecords.length,
            size: formatFileSize(phoneBytes, i18n.language),
          })
        : null;

  const header = (
    <View style={styles.header}>
      <Text style={styles.title}>{tc("tabs.saved")}</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabs}
      >
        <Tag
          label={t("saved.tabSaved")}
          selected={tab === "saved"}
          onPress={() => setTab("saved")}
        />
        <Tag
          label={t("saved.tabPhone")}
          selected={tab === "phone"}
          onPress={() => setTab("phone")}
        />
      </ScrollView>
      <OfflineNotice showAction={false} />

      {subline ? <Text style={styles.count}>{subline}</Text> : null}
    </View>
  );

  let empty;
  if (tab === "phone") {
    empty = downloads.isPending ? (
      <SkeletonRows count={3} />
    ) : (
      <EmptyState
        title={t("saved.phoneEmptyTitle")}
        body={t("saved.phoneEmptyBody")}
      />
    );
  } else if (!userId) {
    empty = (
      <EmptyState title={t("saved.guestTitle")} body={t("saved.guestBody")}>
        <Button
          label={t("saved.signIn")}
          onPress={() => router.navigate("/(auth)/login")}
        />
      </EmptyState>
    );
  } else if (isOfflinePending(saved)) {
    empty = (
      <OfflineState
        actionLabel={t("saved.seePhone")}
        onAction={() => setTab("phone")}
      />
    );
  } else if (saved.isPending) {
    empty = <SkeletonRows count={4} />;
  } else if (saved.isError) {
    empty = (
      <EmptyState title={t("saved.loadError")}>
        <Button
          label={tc("actions.retry")}
          kind="outline"
          onPress={() => saved.refetch()}
        />
        {phoneRecords.length > 0 ? (
          <Button
            label={t("saved.seePhone")}
            kind="text"
            onPress={() => setTab("phone")}
          />
        ) : null}
      </EmptyState>
    );
  } else {
    empty = (
      <EmptyState title={t("saved.emptyTitle")} body={t("saved.emptyBody")}>
        <Button
          label={t("saved.explore")}
          kind="outline"
          onPress={() => router.navigate("/explore")}
        />
      </EmptyState>
    );
  }

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ResourceRow item={item} />}
        ListHeaderComponent={header}
        ListEmptyComponent={empty}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: dockHeight + 24 },
        ]}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.background.primary },
    content: { paddingHorizontal: 20 },
    header: { gap: 12, paddingTop: 12, paddingBottom: 8 },
    title: {
      fontFamily: fonts.extrabold,
      fontSize: 26,
      lineHeight: 32,
      letterSpacing: -0.5,
      color: colors.text.primary,
    },
    tabs: { gap: 8, paddingRight: 20 },
    count: {
      fontFamily: fonts.semibold,
      fontSize: 14,
      color: colors.text.secondary,
    },
  });
