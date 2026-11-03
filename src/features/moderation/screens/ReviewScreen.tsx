import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { DIALOG_KEYS } from "@/core/dialog/dialogKeys";
import { useDialog } from "@/core/dialog/useDialog";
import { getSubmissionStatusConfig } from "@/features/contribute/utils/getSubmissionStatusConfig";
import { useResourceTypeLabel } from "@/features/resources/hooks/useResources";
import { formatFileSize } from "@/features/resources/utils/format";
import type { SheetHandle } from "@/shared/components/AppSheet";
import { Button } from "@/shared/components/Button";
import { EmptyState } from "@/shared/components/common/EmptyState";
import { KeyValue } from "@/shared/components/common/KeyValue";
import { ScreenHeader } from "@/shared/components/common/ScreenHeader";
import { SkeletonRows } from "@/shared/components/SkeletonRows";
import { useThemeColors } from "@/shared/hooks/theme";
import type { Colors } from "@/theme/colors";
import { fonts } from "@/theme/typography";

import { ReasonSheet } from "../components/ReasonSheet";
import {
    useIsModerator,
    useModerateMutation,
    useModerationItemQuery,
} from "../hooks/useModeration";

export function ReviewScreen({ id }: { id: string }) {
  const colors = useThemeColors();
  const router = useRouter();
  const dialog = useDialog();
  const { t, i18n } = useTranslation("resources");
  const { t: tc } = useTranslation();
  const typeLabel = useResourceTypeLabel();
  const styles = createStyles(colors);
  const isModerator = useIsModerator();
  const item = useModerationItemQuery(id);
  const moderate = useModerateMutation();
  const reasonSheet = useRef<SheetHandle>(null);
  const [reasonAction, setReasonAction] = useState<"reject" | "publish">(
    "reject",
  );

  if (!isModerator) {
    return (
      <SafeAreaView style={styles.root} edges={["top"]}>
        <View style={styles.padded}>
          <ScreenHeader />
          <EmptyState title={t("moderation.notAllowed")} />
        </View>
      </SafeAreaView>
    );
  }
  if (item.isPending) {
    return (
      <SafeAreaView style={styles.root} edges={["top"]}>
        <View style={styles.padded}>
          <ScreenHeader />
          <SkeletonRows count={5} />
        </View>
      </SafeAreaView>
    );
  }
  if (item.isError || !item.data) {
    return (
      <SafeAreaView style={styles.root} edges={["top"]}>
        <View style={styles.padded}>
          <ScreenHeader />
          <EmptyState title={t("moderation.loadError")}>
            <Button
              label={tc("actions.retry")}
              kind="outline"
              onPress={() => item.refetch()}
            />
          </EmptyState>
        </View>
      </SafeAreaView>
    );
  }

  const data = item.data;
  const status = getSubmissionStatusConfig(data.status, colors, t);
  const open = data.status === "submitted" || data.status === "in_review";
  const session = data.examSession ? t(`session.${data.examSession}`) : null;

  function openReason(action: "reject" | "publish") {
    setReasonAction(action);
    reasonSheet.current?.open();
  }

  function onPublish() {
    // A flagged duplicate needs a written reason, so it goes through the reason sheet.
    if (data.duplicateOf) openReason("publish");
    else
      dialog.open(DIALOG_KEYS.CONFIRM_PUBLISH_RESOURCE, {
        resourceId: id,
        title: data.title,
      });
  }

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader title={t("moderation.reviewTitle")} />

        <View style={[styles.pill, { backgroundColor: status.background }]}>
          <Ionicons name={status.icon} size={16} color={status.color} />
          <Text style={[styles.pillText, { color: status.color }]}>
            {status.label}
          </Text>
        </View>
        <Text style={styles.title}>{data.title}</Text>

        <Button
          label={t("moderation.readFile")}
          kind="outline"
          icon="book-outline"
          disabled={!data.fileId}
          onPress={() =>
            router.push({ pathname: "/review/[id]/read", params: { id } })
          }
        />

        {data.duplicateOf ? (
          <View style={styles.margin}>
            <Text style={styles.marginText}>
              {t("moderation.duplicateNote", {
                title: data.duplicateTitle ?? "",
              })}
            </Text>
            <Button
              label={t("moderation.openDuplicate")}
              kind="text"
              onPress={() =>
                router.push({
                  pathname: "/review/[id]",
                  params: { id: data.duplicateOf as string },
                })
              }
            />
          </View>
        ) : null}
        {!data.fileReady ? (
          <View style={styles.margin}>
            <Text style={styles.marginText}>
              {t("moderation.fileNotReadyNote")}
            </Text>
          </View>
        ) : null}
        {data.moderationNote ? (
          <View style={styles.margin}>
            <Text style={styles.marginLabel}>
              {t("moderation.previousNote")}
            </Text>
            <Text style={styles.marginText}>{data.moderationNote}</Text>
          </View>
        ) : null}

        <View style={styles.kvBox}>
          <KeyValue
            label={t("detail.university")}
            value={data.universityName}
          />
          <KeyValue
            label={t("detail.course")}
            value={[data.courseName, data.courseCode]
              .filter(Boolean)
              .join(", ")}
          />
          <KeyValue
            label={t("moderation.type")}
            value={typeLabel(data.typeCode)}
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
            label={t("moderation.source")}
            value={t(`contribute.sourceType.${data.sourceType}`)}
          />
          {data.sourceNote ? (
            <KeyValue
              label={t("moderation.sourceNote")}
              value={data.sourceNote}
            />
          ) : null}
          <KeyValue
            label={t("moderation.rights")}
            value={t("moderation.rightsDeclared")}
          />
          <KeyValue
            label={t("detail.file")}
            value={
              data.sizeBytes !== null
                ? data.pageCount
                  ? t("detail.fileValue", {
                      size: formatFileSize(data.sizeBytes, i18n.language),
                      pages: data.pageCount,
                    })
                  : t("detail.fileValueNoPages", {
                      size: formatFileSize(data.sizeBytes, i18n.language),
                    })
                : t("detail.noFile")
            }
          />
          <KeyValue
            label={t("moderation.submitted")}
            value={new Date(data.createdAt).toLocaleDateString(i18n.language)}
          />
        </View>

        {open ? (
          <View style={styles.actions}>
            {data.status === "submitted" ? (
              <Button
                label={t("moderation.startReview")}
                icon="play-outline"
                loading={moderate.isPending}
                onPress={() =>
                  moderate.mutate({
                    resourceId: id,
                    action: "start_review",
                    reason: null,
                  })
                }
              />
            ) : (
              <Button
                label={t("moderation.publish")}
                icon="checkmark-circle-outline"
                disabled={!data.fileReady}
                onPress={onPublish}
              />
            )}
            <Button
              label={t("moderation.reject")}
              kind="danger"
              icon="close-circle-outline"
              onPress={() => openReason("reject")}
            />
          </View>
        ) : null}
      </ScrollView>

      {/* Sheets are siblings of the scroll content, never inside it. */}
      <ReasonSheet ref={reasonSheet} resourceId={id} action={reasonAction} />
    </SafeAreaView>
  );
}

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.background.primary },
    padded: { paddingHorizontal: 20 },
    content: { paddingHorizontal: 20, paddingBottom: 40, gap: 14 },
    pill: {
      flexDirection: "row",
      alignItems: "center",
      alignSelf: "flex-start",
      gap: 6,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 12,
    },
    pillText: { fontFamily: fonts.extrabold, fontSize: 13 },
    title: {
      fontFamily: fonts.extrabold,
      fontSize: 24,
      lineHeight: 30,
      letterSpacing: -0.5,
      color: colors.text.primary,
    },
    kvBox: { borderTopWidth: 2, borderTopColor: colors.text.primary },
    margin: {
      borderLeftWidth: 3,
      borderLeftColor: colors.status.error,
      paddingLeft: 14,
      paddingVertical: 2,
      gap: 2,
    },
    marginLabel: {
      fontFamily: fonts.extrabold,
      fontSize: 12,
      color: colors.text.secondary,
    },
    marginText: {
      fontFamily: fonts.semibold,
      fontSize: 14,
      lineHeight: 21,
      color: colors.text.primary,
    },
    actions: { gap: 10, marginTop: 6 },
  });
