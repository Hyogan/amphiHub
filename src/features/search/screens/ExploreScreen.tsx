import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { FlatList, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useRequireAuth } from "@/features/auth/hooks/useRequireAuth";
import { useDownloadsQuery } from "@/features/library/hooks/useDownloads";
import { useProfileQuery } from "@/features/profile/hooks/useProfile";
import {
  countActiveFilters,
  EMPTY_FILTERS,
  ExploreFiltersSheet,
  type ExploreFilters,
} from "@/features/resources/components/ExploreFiltersSheet";
import { ResourceRow } from "@/features/resources/components/ResourceRow";
import {
  useRequestResourceMutation,
  useResourceTypeLabel,
  useResourceTypesQuery,
  useSearchResourcesQuery,
} from "@/features/resources/hooks/useResources";
import type { SearchParams } from "@/features/resources/types/resource";
import { matchesSearch } from "@/features/resources/utils/localSearch";
import { track } from "@/services/analytics";
import type { SheetHandle } from "@/shared/components/AppSheet";
import { Button } from "@/shared/components/Button";
import { EmptyState } from "@/shared/components/common/EmptyState";
import { OfflineNotice } from "@/shared/components/Offline";
import { Pressy } from "@/shared/components/Pressy";
import { SkeletonRows } from "@/shared/components/SkeletonRows";
import { Tag } from "@/shared/components/Tag";
import { useThemeColors } from "@/shared/hooks/theme";
import { useDebouncedValue } from "@/shared/hooks/useDebouncedValue";
import { useIsOnline } from "@/shared/hooks/useIsOnline";
import { useAppSelector } from "@/store/hooks";
import type { Colors } from "@/theme/colors";
import { fonts } from "@/theme/typography";
import { useRouter } from "expo-router";

export function ExploreScreen() {
  const colors = useThemeColors();
  const { t } = useTranslation("resources");
  const { t: tc } = useTranslation();
  const typeLabel = useResourceTypeLabel();
  const requireAuth = useRequireAuth();
  const styles = createStyles(colors);
  const sheetRef = useRef<SheetHandle>(null);
  const router = useRouter();
  const params = useLocalSearchParams<{ type?: string }>();
  const userId = useAppSelector((state) => state.session.userId);
  const dockHeight = useAppSelector((state) => state.dock.height);
  const query = useAppSelector((state) => state.dock.query);
  const debounced = useDebouncedValue(query.trim(), 350);
  const profile = useProfileQuery(userId).data;

  // A type chosen on this screen wins over the route param, until the param changes again.
  const [picked, setPicked] = useState<string | null | undefined>(undefined);
  useEffect(() => {
    setPicked(undefined);
  }, [params.type]);
  const typeCode = picked !== undefined ? picked : (params.type ?? null);

  const [filters, setFilters] = useState<ExploreFilters>(EMPTY_FILTERS);
  const activeFilters = countActiveFilters(filters);
  const canFilterMine = Boolean(profile?.universityId);

  const types = useResourceTypesQuery();
  const searchParams: SearchParams = {
    query: debounced,
    universityId: filters.mine ? (profile?.universityId ?? null) : null,
    level: filters.level,
    typeCode,
    academicYear: filters.year,
    hasCorrection: filters.hasCorrection ? true : null,
  };
  const search = useSearchResourcesQuery(searchParams);
  const request = useRequestResourceMutation();
  const online = useIsOnline();
  const downloads = useDownloadsQuery();
  const localItems = (downloads.data ?? [])
    .map((record) => record.summary)
    .filter((summary) => matchesSearch(summary, debounced, typeCode));

  const onlineItems = search.data?.pages.flatMap((page) => page.items) ?? [];
  const items = online ? onlineItems : localItems;
  const total = online
    ? (search.data?.pages[0]?.total ?? 0)
    : localItems.length;

  useEffect(() => {
    if (debounced) {
      track("search_submitted", {
        query: debounced.slice(0, 60),
        type: typeCode,
      });
    }
  }, [debounced, typeCode]);

  const settled = search.isSuccess && !search.isPlaceholderData;
  useEffect(() => {
    if (settled && debounced && items.length === 0) {
      track("search_no_results", {
        query: debounced.slice(0, 60),
        type: typeCode,
      });
    }
    // Only when a new search settles, not on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settled, debounced, typeCode]);

  const onRequest = () => {
    if (!requireAuth()) return;
    request.mutate({
      universityId: profile?.universityId ?? null,
      query: debounced,
    });
  };

  const header = (
    <View style={styles.header}>
      <View style={styles.titleRow}>
        <Text style={styles.title}>{t("explore.title")}</Text>
        <Pressy
          label={t("explore.filters")}
          onPress={() => sheetRef.current?.open()}
          style={styles.filterButton}
        >
          <Ionicons
            name="options-outline"
            size={22}
            color={colors.brand.primary}
          />
          {activeFilters > 0 ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{activeFilters}</Text>
            </View>
          ) : null}
        </Pressy>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tags}
      >
        <Tag
          label={t("explore.all")}
          selected={typeCode === null}
          onPress={() => setPicked(null)}
        />
        {types.data?.map((type) => (
          <Tag
            key={type.code}
            label={typeLabel(type.code)}
            selected={typeCode === type.code}
            onPress={() => setPicked(type.code)}
          />
        ))}
      </ScrollView>
      <OfflineNotice message={tc("offline.localSearch")} showAction={false} />

      {(online ? search.isSuccess : true) && items.length > 0 ? (
        <Text style={styles.count}>
          {t("explore.resultCount", { count: total })}
          {debounced ? ` ${t("explore.resultsFor", { query: debounced })}` : ""}
        </Text>
      ) : null}
    </View>
  );

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ResourceRow item={item} />}
        ListHeaderComponent={header}
        ListEmptyComponent={
          !online ? (
            <EmptyState
              title={tc("offline.localEmptyTitle")}
              body={tc("offline.localEmptyBody")}
            />
          ) : search.isPending ? (
            <SkeletonRows count={5} />
          ) : search.isError ? (
            <EmptyState title={t("explore.loadError")}>
              <Button
                label={tc("actions.retry")}
                kind="outline"
                onPress={() => search.refetch()}
              />
            </EmptyState>
          ) : (
            <EmptyState
              title={t("explore.emptyTitle")}
              body={t("explore.emptyBody")}
            >
              {debounced ? (
                <Button
                  label={t("explore.request")}
                  kind="outline"
                  loading={request.isPending}
                  onPress={onRequest}
                />
              ) : null}
              <Button
                label={t("contribute.entry")}
                kind="text"
                onPress={() => {
                  if (requireAuth()) router.push("/contribute");
                }}
              />
            </EmptyState>
          )
        }
        ListFooterComponent={
          search.isFetchingNextPage ? <SkeletonRows count={2} /> : null
        }
        onEndReached={() => {
          if (online && search.hasNextPage && !search.isFetchingNextPage) {
            search.fetchNextPage();
          }
        }}
        onEndReachedThreshold={0.4}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: dockHeight + 24 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      />
      <ExploreFiltersSheet
        ref={sheetRef}
        filters={filters}
        onChange={setFilters}
        canFilterMine={canFilterMine}
        total={total}
        onApply={() => sheetRef.current?.close()}
      />
    </SafeAreaView>
  );
}

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.background.primary },
    content: { paddingHorizontal: 20 },
    header: { gap: 14, paddingBottom: 8 },
    titleRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginTop: 12,
    },
    title: {
      fontFamily: fonts.extrabold,
      fontSize: 26,
      lineHeight: 32,
      letterSpacing: -0.5,
      color: colors.text.primary,
    },
    filterButton: {
      width: 48,
      height: 48,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.brand.primarySoft,
    },
    badge: {
      position: "absolute",
      top: 4,
      right: 4,
      minWidth: 18,
      height: 18,
      borderRadius: 9,
      paddingHorizontal: 4,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.brand.accent,
    },
    badgeText: {
      fontFamily: fonts.extrabold,
      fontSize: 11,
      color: colors.brand.onAccent,
    },
    tags: { gap: 8, paddingRight: 20 },
    count: {
      fontFamily: fonts.semibold,
      fontSize: 14,
      color: colors.text.secondary,
    },
  });
