import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
    useEffect,
    useImperativeHandle,
    useRef,
    useState,
    type Ref,
} from "react";
import { useTranslation } from "react-i18next";
import { FlatList, StyleSheet, Text, View } from "react-native";

import {
    AppSheet,
    SheetTextInput,
    type SheetHandle,
} from "@/shared/components/AppSheet";
import { Button } from "@/shared/components/Button";
import { EmptyState } from "@/shared/components/common/EmptyState";
import { Pressy } from "@/shared/components/Pressy";
import { SkeletonRows } from "@/shared/components/SkeletonRows";
import { useThemeColors } from "@/shared/hooks/theme";
import type { Colors } from "@/theme/colors";
import { fonts } from "@/theme/typography";

import {
    useModerationQueueQuery,
    useModerationReportsQuery,
    useModerationSuggestionsQuery,
    useResolveReportMutation,
    useReviewSuggestionMutation,
} from "../hooks/useModeration";
import type {
    ModerationReport,
    ModerationSuggestion,
} from "../types/moderation";
import { ModerationRow } from "./ModerationRow";

const LIST_PADDING = { paddingHorizontal: 20, paddingBottom: 40 };

// ── Documents ────────────────────────────────────────────────────────────────
export function DocumentsList({
  status,
}: {
  status: "submitted" | "in_review" | "restricted";
}) {
  const { t } = useTranslation("resources");
  const { t: tc } = useTranslation();
  const queue = useModerationQueueQuery();
  const items = (queue.data ?? []).filter((item) => item.status === status);

  let empty;
  if (queue.isPending) empty = <SkeletonRows count={4} />;
  else if (queue.isError) {
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
    <FlatList
      data={items}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <ModerationRow item={item} />}
      ListEmptyComponent={empty}
      refreshing={queue.isRefetching}
      onRefresh={() => queue.refetch()}
      contentContainerStyle={LIST_PADDING}
      showsVerticalScrollIndicator={false}
    />
  );
}

// ── Reports ──────────────────────────────────────────────────────────────────
function ResolveReportSheet({
  ref,
  report,
  decision,
}: {
  ref: Ref<SheetHandle>;
  report: ModerationReport | null;
  decision: "resolved" | "dismissed";
}) {
  const colors = useThemeColors();
  const { t } = useTranslation("resources");
  const inner = useRef<SheetHandle>(null);
  const [note, setNote] = useState("");
  const [tooShort, setTooShort] = useState(false);
  const resolve = useResolveReportMutation();
  const styles = createStyles(colors);
  const resolved = decision === "resolved";

  useImperativeHandle(ref, () => ({
    open: () => {
      setNote("");
      setTooShort(false);
      inner.current?.open();
    },
    close: () => inner.current?.close(),
  }));

  function submit() {
    if (!report) return;
    if (note.trim().length < 3) {
      setTooShort(true);
      return;
    }
    resolve.mutate(
      { reportId: report.id, decision, resolution: note },
      { onSuccess: () => inner.current?.close() },
    );
  }

  return (
    <AppSheet ref={inner}>
      <Text style={styles.sheetTitle}>
        {t(
          resolved
            ? "moderation.resolveSheet.resolveTitle"
            : "moderation.resolveSheet.dismissTitle",
        )}
      </Text>
      <Text style={styles.hint}>{t("moderation.resolveSheet.body")}</Text>
      <SheetTextInput
        value={note}
        onChangeText={(text) => {
          setNote(text);
          setTooShort(false);
        }}
        placeholder={t("moderation.resolveSheet.placeholder")}
        placeholderTextColor={colors.text.tertiary}
        multiline
        maxLength={500}
        style={styles.input}
      />
      {tooShort ? (
        <Text style={styles.error}>{t("moderation.reasonSheet.tooShort")}</Text>
      ) : null}
      <Button
        label={t(resolved ? "moderation.resolve" : "moderation.dismiss")}
        loading={resolve.isPending}
        onPress={submit}
      />
    </AppSheet>
  );
}

export function ReportsList() {
  const colors = useThemeColors();
  const router = useRouter();
  const { t, i18n } = useTranslation("resources");
  const { t: tc } = useTranslation();
  const reports = useModerationReportsQuery();
  const sheet = useRef<SheetHandle>(null);
  const [target, setTarget] = useState<ModerationReport | null>(null);
  const [decision, setDecision] = useState<"resolved" | "dismissed">(
    "resolved",
  );
  const styles = createStyles(colors);

  function start(report: ModerationReport, next: "resolved" | "dismissed") {
    setTarget(report);
    setDecision(next);
    sheet.current?.open();
  }

  let empty;
  if (reports.isPending) empty = <SkeletonRows count={3} />;
  else if (reports.isError) {
    empty = (
      <EmptyState title={t("moderation.reportsLoadError")}>
        <Button
          label={tc("actions.retry")}
          kind="outline"
          onPress={() => reports.refetch()}
        />
      </EmptyState>
    );
  } else {
    empty = (
      <EmptyState
        title={t("moderation.reportsEmptyTitle")}
        body={t("moderation.reportsEmptyBody")}
      />
    );
  }

  return (
    <View style={styles.flex}>
      <FlatList
        data={reports.data ?? []}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Text style={styles.kicker}>
              {t(`report.reason.${item.reason}`)}
            </Text>
            <Text style={styles.title} numberOfLines={2}>
              {item.resourceTitle}
            </Text>
            <Text style={styles.meta} numberOfLines={1}>
              {`${item.courseName}, ${item.universityName}`}
            </Text>
            {item.details ? (
              <View style={styles.margin}>
                <Text style={styles.marginText}>{item.details}</Text>
              </View>
            ) : null}
            <Text style={styles.caption}>
              {[
                t("moderation.sentOn", {
                  date: new Date(item.createdAt).toLocaleDateString(
                    i18n.language,
                  ),
                }),
                item.openOnResource > 1
                  ? t("moderation.openOnResource", {
                      count: item.openOnResource,
                    })
                  : null,
              ]
                .filter(Boolean)
                .join(", ")}
            </Text>
            <Button
              label={t("moderation.openDocument")}
              kind="text"
              onPress={() =>
                router.push({
                  pathname: "/review/[id]",
                  params: { id: item.resourceId },
                })
              }
            />
            <View style={styles.buttons}>
              <View style={styles.flex}>
                <Button
                  label={t("moderation.resolve")}
                  onPress={() => start(item, "resolved")}
                />
              </View>
              <View style={styles.flex}>
                <Button
                  label={t("moderation.dismiss")}
                  kind="outline"
                  onPress={() => start(item, "dismissed")}
                />
              </View>
            </View>
          </View>
        )}
        ListEmptyComponent={empty}
        refreshing={reports.isRefetching}
        onRefresh={() => reports.refetch()}
        contentContainerStyle={LIST_PADDING}
        showsVerticalScrollIndicator={false}
      />
      <ResolveReportSheet ref={sheet} report={target} decision={decision} />
    </View>
  );
}

// ── Course suggestions ───────────────────────────────────────────────────────
function SuggestionSheet({
  ref,
  suggestion,
}: {
  ref: Ref<SheetHandle>;
  suggestion: ModerationSuggestion | null;
}) {
  const colors = useThemeColors();
  const { t } = useTranslation("resources");
  const inner = useRef<SheetHandle>(null);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [nameError, setNameError] = useState(false);
  const review = useReviewSuggestionMutation();
  const styles = createStyles(colors);

  // The moderator may fix a typo before accepting.
  useEffect(() => {
    setName(suggestion?.name ?? "");
    setCode(suggestion?.code ?? "");
    setNameError(false);
  }, [suggestion?.id, suggestion?.name, suggestion?.code]);

  useImperativeHandle(ref, () => ({
    open: () => inner.current?.open(),
    close: () => inner.current?.close(),
  }));

  function decide(decision: "accept" | "reject") {
    if (!suggestion) return;
    if (decision === "accept" && name.trim().length < 3) {
      setNameError(true);
      return;
    }
    review.mutate(
      { suggestionId: suggestion.id, decision, name, code },
      { onSuccess: () => inner.current?.close() },
    );
  }

  return (
    <AppSheet ref={inner}>
      <Text style={styles.sheetTitle}>
        {t("moderation.suggestionSheet.title")}
      </Text>
      <Text style={styles.hint}>{suggestion?.universityName}</Text>
      {suggestion && !suggestion.acceptable ? (
        <View style={styles.margin}>
          <Text style={styles.marginText}>
            {t("moderation.suggestionSheet.studioOnly")}
          </Text>
        </View>
      ) : null}
      <Text style={styles.label}>{t("contribute.suggest.name")}</Text>
      <SheetTextInput
        value={name}
        onChangeText={(value) => {
          setName(value);
          setNameError(false);
        }}
        maxLength={200}
        style={styles.fieldInput}
      />
      {nameError ? (
        <Text style={styles.error}>{t("contribute.suggest.errorName")}</Text>
      ) : null}
      <Text style={styles.label}>{t("contribute.suggest.code")}</Text>
      <SheetTextInput
        value={code}
        onChangeText={setCode}
        maxLength={40}
        autoCapitalize="characters"
        autoCorrect={false}
        style={styles.fieldInput}
      />
      <Button
        label={t("moderation.suggestionSheet.accept")}
        disabled={!suggestion?.acceptable}
        loading={review.isPending && review.variables?.decision === "accept"}
        onPress={() => decide("accept")}
      />
      <Button
        label={t("moderation.suggestionSheet.reject")}
        kind="danger"
        loading={review.isPending && review.variables?.decision === "reject"}
        onPress={() => decide("reject")}
      />
    </AppSheet>
  );
}

export function SuggestionsList() {
  const colors = useThemeColors();
  const { t, i18n } = useTranslation("resources");
  const { t: tc } = useTranslation();
  const suggestions = useModerationSuggestionsQuery();
  const sheet = useRef<SheetHandle>(null);
  const [target, setTarget] = useState<ModerationSuggestion | null>(null);
  const styles = createStyles(colors);

  let empty;
  if (suggestions.isPending) empty = <SkeletonRows count={3} />;
  else if (suggestions.isError) {
    empty = (
      <EmptyState title={t("moderation.suggestionsLoadError")}>
        <Button
          label={tc("actions.retry")}
          kind="outline"
          onPress={() => suggestions.refetch()}
        />
      </EmptyState>
    );
  } else {
    empty = (
      <EmptyState
        title={t("moderation.suggestionsEmptyTitle")}
        body={t("moderation.suggestionsEmptyBody")}
      />
    );
  }

  return (
    <View style={styles.flex}>
      <FlatList
        data={suggestions.data ?? []}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Pressy
            depth={0.98}
            onPress={() => {
              setTarget(item);
              sheet.current?.open();
            }}
            style={styles.suggestionRow}
          >
            <View style={styles.flex}>
              <Text style={styles.kicker}>
                {t(`moderation.suggestionKind.${item.kind}`)}
              </Text>
              <Text style={styles.title} numberOfLines={2}>
                {[item.code, item.name].filter(Boolean).join(", ")}
              </Text>
              <Text style={styles.meta} numberOfLines={1}>
                {item.universityName}
              </Text>
              <Text style={styles.caption}>
                {t("moderation.sentOn", {
                  date: new Date(item.createdAt).toLocaleDateString(
                    i18n.language,
                  ),
                })}
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={colors.icon.muted}
            />
          </Pressy>
        )}
        ListEmptyComponent={empty}
        refreshing={suggestions.isRefetching}
        onRefresh={() => suggestions.refetch()}
        contentContainerStyle={LIST_PADDING}
        showsVerticalScrollIndicator={false}
      />
      <SuggestionSheet ref={sheet} suggestion={target} />
    </View>
  );
}

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    flex: { flex: 1 },
    row: {
      gap: 2,
      paddingVertical: 16,
      borderTopWidth: 1,
      borderTopColor: colors.border.subtle,
    },
    suggestionRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingVertical: 16,
      borderTopWidth: 1,
      borderTopColor: colors.border.subtle,
    },
    kicker: {
      fontFamily: fonts.extrabold,
      fontSize: 13,
      color: colors.text.link,
    },
    title: {
      fontFamily: fonts.extrabold,
      fontSize: 17,
      lineHeight: 22,
      color: colors.text.primary,
    },
    meta: {
      fontFamily: fonts.semibold,
      fontSize: 14,
      color: colors.text.secondary,
    },
    caption: {
      fontFamily: fonts.semibold,
      fontSize: 12,
      color: colors.text.secondary,
      marginTop: 4,
    },
    margin: {
      borderLeftWidth: 3,
      borderLeftColor: colors.status.error,
      paddingLeft: 12,
      marginTop: 6,
    },
    marginText: {
      fontFamily: fonts.semibold,
      fontSize: 14,
      lineHeight: 20,
      color: colors.text.primary,
    },
    buttons: { flexDirection: "row", gap: 10, marginTop: 4 },
    sheetTitle: {
      fontFamily: fonts.extrabold,
      fontSize: 22,
      color: colors.text.primary,
      letterSpacing: -0.3,
    },
    hint: {
      fontFamily: fonts.semibold,
      fontSize: 15,
      lineHeight: 22,
      color: colors.text.secondary,
    },
    label: {
      fontFamily: fonts.extrabold,
      fontSize: 15,
      color: colors.text.primary,
    },
    input: {
      minHeight: 100,
      textAlignVertical: "top",
      padding: 14,
      borderRadius: 14,
      borderWidth: 1.5,
      borderColor: colors.border.default,
      fontFamily: fonts.semibold,
      fontSize: 15,
      color: colors.text.primary,
    },
    fieldInput: {
      minHeight: 52,
      paddingHorizontal: 14,
      borderRadius: 14,
      borderWidth: 1.5,
      borderColor: colors.border.default,
      fontFamily: fonts.semibold,
      fontSize: 16,
      color: colors.text.primary,
    },
    error: { fontFamily: fonts.bold, fontSize: 13, color: colors.status.error },
  });
