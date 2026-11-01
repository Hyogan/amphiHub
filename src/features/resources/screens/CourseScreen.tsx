import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useCourseQuery } from "@/features/catalog/hooks/useCatalog";
import { Button } from "@/shared/components/Button";
import { EmptyState } from "@/shared/components/common/EmptyState";
import { ScreenHeader } from "@/shared/components/common/ScreenHeader";
import { SkeletonRows } from "@/shared/components/SkeletonRows";
import { Tag } from "@/shared/components/Tag";
import { useThemeColors } from "@/shared/hooks/theme";
import type { Colors } from "@/theme/colors";
import { fonts } from "@/theme/typography";

import { ResourceRow } from "../components/ResourceRow";
import {
  useCourseResourcesQuery,
  useResourceTypeLabel,
} from "../hooks/useResources";

function Stat({ value, label }: { value: number; label: string }) {
  const colors = useThemeColors();
  const styles = createStyles(colors);
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export function CourseScreen({ id }: { id: string }) {
  const colors = useThemeColors();
  const { t } = useTranslation("resources");
  const { t: tc } = useTranslation();
  const typeLabel = useResourceTypeLabel();
  const course = useCourseQuery(id);
  const resources = useCourseResourcesQuery(id);
  const [typeCode, setTypeCode] = useState<string | null>(null);
  const styles = createStyles(colors);

  const notFound =
    (course.error as { code?: string } | null)?.code === "PGRST116";

  if (course.isPending || resources.isPending) {
    return (
      <SafeAreaView style={styles.root} edges={["top"]}>
        <View style={styles.content}>
          <ScreenHeader />
          <SkeletonRows count={5} />
        </View>
      </SafeAreaView>
    );
  }

  if (course.isError || resources.isError || !course.data) {
    return (
      <SafeAreaView style={styles.root} edges={["top"]}>
        <View style={styles.content}>
          <ScreenHeader />
          <EmptyState
            title={notFound ? t("course.notFound") : t("course.loadError")}
          >
            {notFound ? null : (
              <Button
                label={tc("actions.retry")}
                kind="outline"
                onPress={() => {
                  course.refetch();
                  resources.refetch();
                }}
              />
            )}
          </EmptyState>
        </View>
      </SafeAreaView>
    );
  }

  const info = course.data;
  const all = resources.data;
  const types = [...new Set(all.map((r) => r.typeCode))];
  const visible = typeCode ? all.filter((r) => r.typeCode === typeCode) : all;

  const yearCount = new Set(all.map((r) => r.academicYear).filter(Boolean))
    .size;
  const correctedCount = all.filter((r) => r.hasCorrection).length;

  // Newest year first, documents without a year last.
  const groups = [...new Set(visible.map((r) => r.academicYear))].sort(
    (a, b) => (a === null ? 1 : b === null ? -1 : b.localeCompare(a)),
  );

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader />
        <View style={styles.head}>
          {info.code ? <Text style={styles.code}>{info.code}</Text> : null}
          <Text style={styles.name}>{info.name}</Text>
          <Text style={styles.university}>{info.universityName}</Text>
        </View>

        <View style={styles.stats}>
          <Stat value={all.length} label={t("course.documents")} />
          <Stat value={correctedCount} label={t("course.corrected")} />
          <Stat value={yearCount} label={t("course.years")} />
        </View>

        {types.length > 1 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabs}
          >
            <Tag
              label={t("explore.all")}
              selected={typeCode === null}
              onPress={() => setTypeCode(null)}
            />
            {types.map((code) => (
              <Tag
                key={code}
                label={typeLabel(code)}
                selected={typeCode === code}
                onPress={() => setTypeCode(code)}
              />
            ))}
          </ScrollView>
        ) : null}

        {visible.length === 0 ? (
          <EmptyState
            title={t("course.emptyTitle")}
            body={t("course.emptyBody")}
          />
        ) : (
          groups.map((year) => (
            <View key={year ?? "unknown"} style={styles.group}>
              <Text style={styles.year}>{year ?? t("detail.yearUnknown")}</Text>
              {visible
                .filter((r) => r.academicYear === year)
                .map((item) => (
                  <ResourceRow key={item.id} item={item} />
                ))}
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.background.primary },
    content: { paddingHorizontal: 20, paddingBottom: 40, gap: 16 },
    head: { gap: 2 },
    code: {
      fontFamily: fonts.extrabold,
      fontSize: 44,
      lineHeight: 50,
      letterSpacing: -1,
      color: colors.text.link,
    },
    name: {
      fontFamily: fonts.extrabold,
      fontSize: 22,
      lineHeight: 28,
      color: colors.text.primary,
    },
    university: {
      fontFamily: fonts.semibold,
      fontSize: 14,
      color: colors.text.secondary,
    },
    stats: {
      flexDirection: "row",
      borderTopWidth: 2,
      borderTopColor: colors.text.primary,
      borderBottomWidth: 1,
      borderBottomColor: colors.border.subtle,
    },
    stat: { flex: 1, paddingVertical: 12, gap: 2 },
    statValue: {
      fontFamily: fonts.extrabold,
      fontSize: 26,
      color: colors.text.primary,
    },
    statLabel: {
      fontFamily: fonts.semibold,
      fontSize: 13,
      color: colors.text.secondary,
    },
    tabs: { gap: 8, paddingRight: 20 },
    group: { gap: 0 },
    year: {
      fontFamily: fonts.extrabold,
      fontSize: 19,
      color: colors.text.primary,
      marginBottom: 2,
    },
  });
