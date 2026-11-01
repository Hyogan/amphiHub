import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { FlatList, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ResourceRow } from "@/features/resources/components/ResourceRow";
import { Button } from "@/shared/components/Button";
import { EmptyState } from "@/shared/components/common/EmptyState";
import { SkeletonRows } from "@/shared/components/SkeletonRows";
import { useThemeColors } from "@/shared/hooks/theme";
import { useAppSelector } from "@/store/hooks";
import type { Colors } from "@/theme/colors";
import { fonts } from "@/theme/typography";

import { useSavedResourcesQuery } from "../hooks/useLibrary";

export function SavedScreen() {
  const colors = useThemeColors();
  const router = useRouter();
  const { t } = useTranslation("resources");
  const { t: tc } = useTranslation();
  const styles = createStyles(colors);

  const userId = useAppSelector((state) => state.session.userId);
  const dockHeight = useAppSelector((state) => state.dock.height);
  const saved = useSavedResourcesQuery();
  const items = saved.data ?? [];

  const header = (
    <View style={styles.header}>
      <Text style={styles.title}>{tc("tabs.saved")}</Text>
      {userId && saved.isSuccess && items.length > 0 ? (
        <Text style={styles.count}>
          {t("saved.count", { count: items.length })}
        </Text>
      ) : null}
    </View>
  );

  let empty;
  if (!userId) {
    empty = (
      <EmptyState title={t("saved.guestTitle")} body={t("saved.guestBody")}>
        <Button
          label={t("saved.signIn")}
          onPress={() => router.navigate("/(auth)/login")}
        />
      </EmptyState>
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
        data={userId ? items : []}
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
    header: { gap: 4, paddingTop: 12, paddingBottom: 8 },
    title: {
      fontFamily: fonts.extrabold,
      fontSize: 26,
      lineHeight: 32,
      letterSpacing: -0.5,
      color: colors.text.primary,
    },
    count: {
      fontFamily: fonts.semibold,
      fontSize: 14,
      color: colors.text.secondary,
    },
  });
