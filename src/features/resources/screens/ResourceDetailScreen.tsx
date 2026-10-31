import { useRouter } from "expo-router";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { track } from "@/services/analytics";
import { Button } from "@/shared/components/Button";
import { EmptyState } from "@/shared/components/common/EmptyState";
import { ScreenHeader } from "@/shared/components/common/ScreenHeader";
import { Pressy } from "@/shared/components/Pressy";
import { SkeletonRows } from "@/shared/components/SkeletonRows";
import { Stamp } from "@/shared/components/Stamp";
import { useThemeColors } from "@/shared/hooks/theme";
import type { Colors } from "@/theme/colors";
import { fonts } from "@/theme/typography";

import { PaperPreview } from "../components/PaperPreview";
import {
  useResourceQuery,
  useResourceRelationsQuery,
  useResourceTypeLabel,
} from "../hooks/useResources";
import { getVerificationKinds, type RelatedResource } from "../types/resource";
import { formatFileSize } from "../utils/format";

function KeyValue({ label, value }: { label: string; value: string }) {
  const colors = useThemeColors();
  const styles = createStyles(colors);
  return (
    <View style={styles.kv}>
      <Text style={styles.kvKey}>{label}</Text>
      <Text style={styles.kvValue}>{value}</Text>
    </View>
  );
}

function RelatedRow({
  item,
  label,
}: {
  item: RelatedResource;
  label?: string;
}) {
  const colors = useThemeColors();
  const router = useRouter();
  const typeLabel = useResourceTypeLabel();
  const styles = createStyles(colors);
  return (
    <Pressy
      onPress={() =>
        router.push({ pathname: "/resource/[id]", params: { id: item.id } })
      }
      depth={0.98}
      style={styles.related}
    >
      <View style={styles.relatedText}>
        {label ? <Text style={styles.relatedKicker}>{label}</Text> : null}
        <Text style={styles.relatedTitle}>{item.title}</Text>
        <Text style={styles.relatedMeta}>
          {[typeLabel(item.typeCode), item.academicYear]
            .filter(Boolean)
            .join(", ")}
        </Text>
      </View>
      {item.correctionReviewed ? <Stamp kind="correction" /> : null}
    </Pressy>
  );
}

export function ResourceDetailScreen({ id }: { id: string }) {
  const colors = useThemeColors();
  const { t, i18n } = useTranslation("resources");
  const { t: tc } = useTranslation();
  const detail = useResourceQuery(id);
  const relations = useResourceRelationsQuery(id);
  const typeLabel = useResourceTypeLabel();
  const styles = createStyles(colors);

  useEffect(() => {
    track("resource_opened", { id });
  }, [id]);

  const notFound =
    (detail.error as { code?: string } | null)?.code === "PGRST116";
  const data = detail.data;

  if (detail.isPending) {
    return (
      <SafeAreaView style={styles.root} edges={["top"]}>
        <View style={styles.content}>
          <ScreenHeader />
          <SkeletonRows count={5} />
        </View>
      </SafeAreaView>
    );
  }

  if (detail.isError || !data) {
    return (
      <SafeAreaView style={styles.root} edges={["top"]}>
        <View style={styles.content}>
          <ScreenHeader />
          <EmptyState
            title={notFound ? t("detail.notFound") : t("detail.loadError")}
          >
            {notFound ? null : (
              <Button
                label={tc("actions.retry")}
                kind="outline"
                onPress={() => detail.refetch()}
              />
            )}
          </EmptyState>
        </View>
      </SafeAreaView>
    );
  }

  const session = data.examSession ? t(`session.${data.examSession}`) : null;
  const subtitle = [
    data.courseCode,
    data.academicYear ?? t("detail.yearUnknown"),
    session,
  ]
    .filter(Boolean)
    .join(", ");
  const file = data.file;

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader title={typeLabel(data.typeCode)} />
        <PaperPreview
          university={data.universityName}
          course={data.courseName}
          title={data.title}
        />
        <View style={styles.stamps}>
          {getVerificationKinds(data).map((kind) => (
            <Stamp key={kind} kind={kind} />
          ))}
        </View>
        <Text style={styles.title}>{data.title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>

        <View style={styles.kvBox}>
          <KeyValue
            label={t("detail.university")}
            value={data.universityName}
          />
          <KeyValue
            label={t("detail.course")}
            value={`${data.courseName}${data.courseCode ? `, ${data.courseCode}` : ""}`}
          />
          <KeyValue
            label={t("detail.year")}
            value={data.academicYear ?? t("detail.yearUnknown")}
          />
          {session ? (
            <KeyValue label={t("detail.session")} value={session} />
          ) : null}
          {data.language ? (
            <KeyValue
              label={t("detail.language")}
              value={t(`language.${data.language}`)}
            />
          ) : null}
          <KeyValue
            label={t("detail.file")}
            value={
              file
                ? file.pageCount
                  ? t("detail.fileValue", {
                      size: formatFileSize(file.sizeBytes, i18n.language),
                      pages: file.pageCount,
                    })
                  : t("detail.fileValueNoPages", {
                      size: formatFileSize(file.sizeBytes, i18n.language),
                    })
                : t("detail.noFile")
            }
          />
          <KeyValue
            label={t("detail.source")}
            value={
              data.sourceStatus === "official_confirmed"
                ? t("detail.sourceOfficial")
                : t("detail.sourceCommunity")
            }
          />
        </View>

        <View style={styles.margin}>
          <Text style={styles.marginText}>{t("detail.notice")}</Text>
        </View>

        {relations.data?.paper ? (
          <RelatedRow
            item={relations.data.paper}
            label={t("detail.correctionOf")}
          />
        ) : null}
        {relations.data && relations.data.corrections.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.heading}>{t("detail.corrections")}</Text>
            {relations.data.corrections.map((c) => (
              <RelatedRow key={c.id} item={c} />
            ))}
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.background.primary },
    content: { paddingHorizontal: 20, paddingBottom: 40, gap: 14 },
    stamps: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
    title: {
      fontFamily: fonts.extrabold,
      fontSize: 26,
      lineHeight: 32,
      color: colors.text.primary,
      letterSpacing: -0.6,
    },
    subtitle: {
      fontFamily: fonts.semibold,
      fontSize: 15,
      color: colors.text.secondary,
      marginTop: -6,
    },
    kvBox: { borderTopWidth: 2, borderTopColor: colors.text.primary },
    kv: {
      flexDirection: "row",
      justifyContent: "space-between",
      gap: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border.subtle,
    },
    kvKey: {
      fontFamily: fonts.semibold,
      fontSize: 14,
      color: colors.text.secondary,
    },
    kvValue: {
      fontFamily: fonts.bold,
      fontSize: 14,
      color: colors.text.primary,
      flexShrink: 1,
      textAlign: "right",
    },
    margin: {
      borderLeftWidth: 3,
      borderLeftColor: colors.status.error,
      paddingLeft: 14,
      paddingVertical: 2,
    },
    marginText: {
      fontFamily: fonts.semibold,
      fontSize: 14,
      lineHeight: 21,
      color: colors.text.primary,
    },
    section: { gap: 4, marginTop: 6 },
    heading: {
      fontFamily: fonts.extrabold,
      fontSize: 19,
      color: colors.text.primary,
    },
    related: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingVertical: 14,
      borderTopWidth: 1,
      borderTopColor: colors.border.subtle,
    },
    relatedText: { flex: 1, gap: 2 },
    relatedKicker: {
      fontFamily: fonts.extrabold,
      fontSize: 12,
      color: colors.text.link,
    },
    relatedTitle: {
      fontFamily: fonts.bold,
      fontSize: 16,
      color: colors.text.primary,
    },
    relatedMeta: {
      fontFamily: fonts.semibold,
      fontSize: 13,
      color: colors.text.secondary,
    },
  });
