import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { FlatList, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "@/shared/components/Button";
import { EmptyState } from "@/shared/components/common/EmptyState";
import { ScreenHeader } from "@/shared/components/common/ScreenHeader";
import { SkeletonRows } from "@/shared/components/SkeletonRows";
import { useThemeColors } from "@/shared/hooks/theme";
import { useAppSelector } from "@/store/hooks";
import type { Colors } from "@/theme/colors";
import { fonts } from "@/theme/typography";

import { SubmissionRow } from "../components/SubmissionRow";
import { useMySubmissionsQuery } from "../hooks/useSubmissions";

export function MyContributionsScreen() {
  const colors = useThemeColors();
  const router = useRouter();
  const { t } = useTranslation("resources");
  const { t: tc } = useTranslation();
  const styles = createStyles(colors);
  const userId = useAppSelector((state) => state.session.userId);
  const submissions = useMySubmissionsQuery();
  const items = userId ? (submissions.data ?? []) : [];

  let empty;
  if (!userId) {
    empty = (
      <EmptyState
        title={t("contribute.guestTitle")}
        body={t("contribute.guestBody")}
      >
        <Button
          label={t("saved.signIn")}
          onPress={() => router.navigate("/(auth)/login")}
        />
      </EmptyState>
    );
  } else if (submissions.isPending) {
    empty = <SkeletonRows count={4} />;
  } else if (submissions.isError) {
    empty = (
      <EmptyState title={t("contributions.loadError")}>
        <Button
          label={tc("actions.retry")}
          kind="outline"
          onPress={() => submissions.refetch()}
        />
      </EmptyState>
    );
  } else {
    empty = (
      <EmptyState
        title={t("contributions.emptyTitle")}
        body={t("contributions.emptyBody")}
      >
        <Button
          label={t("contributions.contribute")}
          onPress={() => router.push("/contribute")}
        />
      </EmptyState>
    );
  }

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <SubmissionRow item={item} />}
        ListHeaderComponent={
          <View style={styles.header}>
            <ScreenHeader title={t("contributions.title")} />
            {items.length > 0 ? (
              <Text style={styles.count}>
                {t("contributions.count", { count: items.length })}
              </Text>
            ) : null}
          </View>
        }
        ListEmptyComponent={empty}
        // Pull down to see a moderator's decision without leaving the screen.
        refreshing={submissions.isRefetching}
        onRefresh={() => submissions.refetch()}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.background.primary },
    content: { paddingHorizontal: 20, paddingBottom: 40 },
    header: { gap: 4, paddingBottom: 8 },
    count: {
      fontFamily: fonts.semibold,
      fontSize: 14,
      color: colors.text.secondary,
    },
  });
