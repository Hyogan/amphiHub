import {
    useEffect,
    useImperativeHandle,
    useRef,
    useState,
    type Ref,
} from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, Switch, Text, View } from "react-native";

import {
    AppSheet,
    SheetTextInput,
    type SheetHandle,
} from "@/shared/components/AppSheet";
import { Button } from "@/shared/components/Button";
import { Tag } from "@/shared/components/Tag";
import { useThemeColors } from "@/shared/hooks/theme";
import type { Colors } from "@/theme/colors";
import { fonts } from "@/theme/typography";

import { useSetVerificationMutation } from "../hooks/useModeration";
import type { ModerationItem, SourceStatus } from "../types/moderation";

const SOURCE_STATUSES: SourceStatus[] = [
  "unverified",
  "confirmed",
  "official_confirmed",
];

/** Verification labels are separate attributes. None of them says the content is academically correct. */
export function VerificationSheet({
  ref,
  item,
}: {
  ref: Ref<SheetHandle>;
  item: ModerationItem;
}) {
  const colors = useThemeColors();
  const { t } = useTranslation("resources");
  const inner = useRef<SheetHandle>(null);
  const [metadata, setMetadata] = useState(item.metadataReviewed);
  const [source, setSource] = useState<SourceStatus>(item.sourceStatus);
  const [correction, setCorrection] = useState(item.correctionReviewed);
  const [note, setNote] = useState("");
  const [noteMissing, setNoteMissing] = useState(false);
  const save = useSetVerificationMutation();
  const styles = createStyles(colors);
  const switchColors = {
    false: colors.border.default,
    true: colors.interactive.primary,
  };

  // Start from what is stored whenever the document changes.
  useEffect(() => {
    setMetadata(item.metadataReviewed);
    setSource(item.sourceStatus);
    setCorrection(item.correctionReviewed);
    setNote("");
    setNoteMissing(false);
  }, [
    item.id,
    item.metadataReviewed,
    item.sourceStatus,
    item.correctionReviewed,
  ]);

  useImperativeHandle(ref, () => ({
    open: () => inner.current?.open(),
    close: () => inner.current?.close(),
  }));

  const isCorrection = item.typeCode === "correction";
  const sourceChanged = source !== item.sourceStatus;
  const changed =
    metadata !== item.metadataReviewed ||
    sourceChanged ||
    (isCorrection && correction !== item.correctionReviewed);

  function submit() {
    if (
      source === "official_confirmed" &&
      sourceChanged &&
      note.trim().length < 3
    ) {
      setNoteMissing(true);
      return;
    }
    // Only what changed is sent. The database keeps the rest, and only an official source needs a note.
    save.mutate(
      {
        resourceId: item.id,
        metadataReviewed: metadata !== item.metadataReviewed ? metadata : null,
        sourceStatus: sourceChanged ? source : null,
        correctionReviewed:
          isCorrection && correction !== item.correctionReviewed
            ? correction
            : null,
        note,
      },
      { onSuccess: () => inner.current?.close() },
    );
  }

  return (
    <AppSheet ref={inner}>
      <Text style={styles.title}>{t("moderation.verification.title")}</Text>
      <View style={styles.margin}>
        <Text style={styles.marginText}>
          {t("moderation.verification.caution")}
        </Text>
      </View>

      <View style={styles.switchRow}>
        <Text style={styles.switchTitle}>
          {t("moderation.verification.metadata")}
        </Text>
        <Switch
          value={metadata}
          onValueChange={setMetadata}
          trackColor={switchColors}
          thumbColor={colors.background.secondary}
        />
      </View>

      <Text style={styles.label}>{t("moderation.verification.source")}</Text>
      <View style={styles.choices}>
        {SOURCE_STATUSES.map((status) => (
          <Tag
            key={status}
            label={t(`moderation.verification.sourceStatus.${status}`)}
            selected={source === status}
            onPress={() => {
              setSource(status);
              setNoteMissing(false);
            }}
          />
        ))}
      </View>

      {source === "official_confirmed" && sourceChanged ? (
        <>
          <Text style={styles.label}>
            {t("moderation.verification.noteLabel")}
          </Text>
          <Text style={styles.hint}>
            {t("moderation.verification.noteHelp")}
          </Text>
          <SheetTextInput
            value={note}
            onChangeText={(text) => {
              setNote(text);
              setNoteMissing(false);
            }}
            multiline
            maxLength={500}
            style={styles.input}
          />
          {noteMissing ? (
            <Text style={styles.error}>
              {t("moderation.verification.noteMissing")}
            </Text>
          ) : null}
        </>
      ) : null}

      {isCorrection ? (
        <View style={styles.switchRow}>
          <Text style={styles.switchTitle}>
            {t("moderation.verification.correction")}
          </Text>
          <Switch
            value={correction}
            onValueChange={setCorrection}
            trackColor={switchColors}
            thumbColor={colors.background.secondary}
          />
        </View>
      ) : null}

      <Button
        label={t("moderation.verification.save")}
        disabled={!changed}
        loading={save.isPending}
        onPress={submit}
      />
    </AppSheet>
  );
}

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    title: {
      fontFamily: fonts.extrabold,
      fontSize: 22,
      color: colors.text.primary,
      letterSpacing: -0.3,
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
    label: {
      fontFamily: fonts.extrabold,
      fontSize: 15,
      color: colors.text.primary,
    },
    hint: {
      fontFamily: fonts.semibold,
      fontSize: 13,
      color: colors.text.secondary,
    },
    choices: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    switchRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      minHeight: 56,
    },
    switchTitle: {
      flex: 1,
      fontFamily: fonts.bold,
      fontSize: 16,
      color: colors.text.primary,
    },
    input: {
      minHeight: 90,
      textAlignVertical: "top",
      padding: 14,
      borderRadius: 14,
      borderWidth: 1.5,
      borderColor: colors.border.default,
      fontFamily: fonts.semibold,
      fontSize: 15,
      color: colors.text.primary,
    },
    error: { fontFamily: fonts.bold, fontSize: 13, color: colors.status.error },
  });
