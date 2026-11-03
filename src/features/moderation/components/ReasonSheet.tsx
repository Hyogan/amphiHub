import { useRouter } from "expo-router";
import { useImperativeHandle, useRef, useState, type Ref } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text } from "react-native";

import { DIALOG_KEYS } from "@/core/dialog/dialogKeys";
import { useDialog } from "@/core/dialog/useDialog";
import {
  AppSheet,
  SheetTextInput,
  type SheetHandle,
} from "@/shared/components/AppSheet";
import { Button } from "@/shared/components/Button";
import { useThemeColors } from "@/shared/hooks/theme";
import type { Colors } from "@/theme/colors";
import { fonts } from "@/theme/typography";

import { useModerateMutation } from "../hooks/useModeration";

export type ReasonAction = "reject" | "publish" | "restrict" | "remove";

/** Collects the written reason these actions require. Removal then asks for a last confirmation. */
export function ReasonSheet({
  ref,
  resourceId,
  title,
  action,
}: {
  ref: Ref<SheetHandle>;
  resourceId: string;
  title: string;
  action: ReasonAction;
}) {
  const colors = useThemeColors();
  const router = useRouter();
  const dialog = useDialog();
  const { t } = useTranslation("resources");
  const inner = useRef<SheetHandle>(null);
  const [reason, setReason] = useState("");
  const [tooShort, setTooShort] = useState(false);
  const moderate = useModerateMutation();
  const styles = createStyles(colors);

  useImperativeHandle(ref, () => ({
    open: () => {
      setReason("");
      setTooShort(false);
      inner.current?.open();
    },
    close: () => inner.current?.close(),
  }));

  function submit() {
    if (reason.trim().length < 3) {
      setTooShort(true);
      return;
    }
    if (action === "remove") {
      // Close the sheet before the dialog opens.
      inner.current?.close();
      dialog.open(DIALOG_KEYS.CONFIRM_REMOVE_RESOURCE, {
        resourceId,
        title,
        reason: reason.trim(),
      });
      return;
    }
    moderate.mutate(
      { resourceId, action, reason },
      {
        onSuccess: () => {
          inner.current?.close();
          router.back();
        },
      },
    );
  }

  return (
    <AppSheet ref={inner}>
      <Text style={styles.title}>
        {t(`moderation.reasonSheet.${action}Title`)}
      </Text>
      <Text style={styles.body}>
        {t(`moderation.reasonSheet.${action}Body`)}
      </Text>
      <SheetTextInput
        value={reason}
        onChangeText={(text) => {
          setReason(text);
          setTooShort(false);
        }}
        placeholder={t("moderation.reasonSheet.placeholder")}
        placeholderTextColor={colors.text.tertiary}
        multiline
        maxLength={500}
        style={styles.input}
      />
      {tooShort ? (
        <Text style={styles.error}>{t("moderation.reasonSheet.tooShort")}</Text>
      ) : null}
      <Button
        label={
          action === "remove"
            ? t("moderation.reasonSheet.continue")
            : t(`moderation.${action}`)
        }
        kind={action === "publish" ? "primary" : "danger"}
        loading={moderate.isPending}
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
    body: {
      fontFamily: fonts.semibold,
      fontSize: 15,
      lineHeight: 22,
      color: colors.text.secondary,
    },
    input: {
      minHeight: 110,
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
