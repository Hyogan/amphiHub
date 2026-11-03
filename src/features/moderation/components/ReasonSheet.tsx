import { useRouter } from "expo-router";
import { useImperativeHandle, useRef, useState, type Ref } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text } from "react-native";

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

export function ReasonSheet({
  ref,
  resourceId,
  action,
}: {
  ref: Ref<SheetHandle>;
  resourceId: string;
  action: "reject" | "publish";
}) {
  const colors = useThemeColors();
  const router = useRouter();
  const { t } = useTranslation("resources");
  const inner = useRef<SheetHandle>(null);
  const [reason, setReason] = useState("");
  const [tooShort, setTooShort] = useState(false);
  const moderate = useModerateMutation();
  const styles = createStyles(colors);
  const reject = action === "reject";

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
        {t(
          reject
            ? "moderation.reasonSheet.rejectTitle"
            : "moderation.reasonSheet.publishTitle",
        )}
      </Text>
      <Text style={styles.body}>
        {t(
          reject
            ? "moderation.reasonSheet.rejectBody"
            : "moderation.reasonSheet.publishBody",
        )}
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
        label={t(reject ? "moderation.reject" : "moderation.publish")}
        kind={reject ? "danger" : "primary"}
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
