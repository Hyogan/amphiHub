import { useImperativeHandle, useRef, useState, type Ref } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text, View } from "react-native";

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

import { useReportResourceMutation } from "../hooks/useReport";
import { REPORT_REASONS, type ReportReason } from "../types/report";

/** The report form is trivial (one required choice), so it skips React Hook Form. */
export function ReportSheet({
  ref,
  resourceId,
}: {
  ref: Ref<SheetHandle>;
  resourceId: string;
}) {
  const colors = useThemeColors();
  const { t } = useTranslation("resources");
  const inner = useRef<SheetHandle>(null);
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [details, setDetails] = useState("");
  const report = useReportResourceMutation();
  const styles = createStyles(colors);

  useImperativeHandle(ref, () => ({
    open: () => inner.current?.open(),
    close: () => inner.current?.close(),
  }));

  function submit() {
    if (!reason) return;
    report.mutate(
      { resourceId, reason, details },
      {
        onSuccess: () => {
          inner.current?.close();
          setReason(null);
          setDetails("");
        },
      },
    );
  }

  return (
    <AppSheet ref={inner}>
      <Text style={styles.title}>{t("report.title")}</Text>
      <Text style={styles.body}>{t("report.subtitle")}</Text>
      <View style={styles.reasons}>
        {REPORT_REASONS.map((code) => (
          <Tag
            key={code}
            label={t(`report.reason.${code}`)}
            selected={reason === code}
            onPress={() => setReason(code)}
          />
        ))}
      </View>
      <SheetTextInput
        value={details}
        onChangeText={setDetails}
        placeholder={t("report.notePlaceholder")}
        placeholderTextColor={colors.text.tertiary}
        multiline
        maxLength={1000}
        style={styles.input}
      />
      <Button
        label={t("report.submit")}
        loading={report.isPending}
        disabled={!reason}
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
    reasons: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    input: {
      minHeight: 96,
      textAlignVertical: "top",
      padding: 14,
      borderRadius: 14,
      borderWidth: 1.5,
      borderColor: colors.border.default,
      fontFamily: fonts.semibold,
      fontSize: 15,
      color: colors.text.primary,
    },
  });
