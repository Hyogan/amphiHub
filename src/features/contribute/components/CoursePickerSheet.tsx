import { useImperativeHandle, useRef, useState, type Ref } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text, View } from "react-native";

import {
    AppSheet,
    SheetTextInput,
    type SheetHandle,
} from "@/shared/components/AppSheet";
import { Button } from "@/shared/components/Button";
import { Pressy } from "@/shared/components/Pressy";
import { SkeletonRows } from "@/shared/components/SkeletonRows";
import { useThemeColors } from "@/shared/hooks/theme";
import { useDebouncedValue } from "@/shared/hooks/useDebouncedValue";
import type { Colors } from "@/theme/colors";
import { fonts } from "@/theme/typography";

import { useCourseSearchQuery } from "../hooks/useContribute";
import type { CourseHit } from "../types/contribution";

export function CoursePickerSheet({
  ref,
  universityId,
  onSelect,
}: {
  ref: Ref<SheetHandle>;
  universityId: string | null;
  onSelect: (course: CourseHit) => void;
}) {
  const colors = useThemeColors();
  const { t } = useTranslation("resources");
  const { t: tc } = useTranslation();
  const inner = useRef<SheetHandle>(null);
  const [text, setText] = useState("");
  const term = useDebouncedValue(text.trim(), 350);
  const search = useCourseSearchQuery(term, universityId);
  const styles = createStyles(colors);

  useImperativeHandle(ref, () => ({
    open: () => inner.current?.open(),
    close: () => inner.current?.close(),
  }));

  let body;
  if (term.length < 2) {
    body = <Text style={styles.hint}>{t("contribute.courseHint")}</Text>;
  } else if (search.isPending) {
    body = <SkeletonRows count={3} />;
  } else if (search.isError) {
    body = (
      <View style={styles.state}>
        <Text style={styles.hint}>{t("contribute.courseError")}</Text>
        <Button
          label={tc("actions.retry")}
          kind="outline"
          onPress={() => search.refetch()}
        />
      </View>
    );
  } else if (search.data.length === 0) {
    body = <Text style={styles.hint}>{t("contribute.courseNone")}</Text>;
  } else {
    body = (
      <View>
        {search.data.map((course) => (
          <Pressy
            key={course.id}
            depth={0.98}
            onPress={() => {
              onSelect(course);
              inner.current?.close();
            }}
            style={styles.row}
          >
            {course.code ? (
              <Text style={styles.code}>{course.code}</Text>
            ) : null}
            <Text style={styles.name}>{course.name}</Text>
          </Pressy>
        ))}
      </View>
    );
  }

  return (
    <AppSheet ref={inner}>
      <Text style={styles.title}>{t("contribute.courseSheetTitle")}</Text>
      <SheetTextInput
        value={text}
        onChangeText={setText}
        placeholder={t("contribute.courseSearchPlaceholder")}
        placeholderTextColor={colors.text.tertiary}
        autoCorrect={false}
        style={styles.input}
      />
      {body}
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
    input: {
      minHeight: 52,
      paddingHorizontal: 14,
      borderRadius: 14,
      borderWidth: 1.5,
      borderColor: colors.border.default,
      fontFamily: fonts.semibold,
      fontSize: 16,
      color: colors.text.primary,
    },
    hint: {
      fontFamily: fonts.semibold,
      fontSize: 15,
      lineHeight: 22,
      color: colors.text.secondary,
    },
    state: { gap: 12 },
    row: {
      gap: 2,
      minHeight: 60,
      paddingVertical: 10,
      borderTopWidth: 1,
      borderTopColor: colors.border.subtle,
    },
    code: {
      fontFamily: fonts.extrabold,
      fontSize: 14,
      color: colors.text.link,
    },
    name: { fontFamily: fonts.bold, fontSize: 16, color: colors.text.primary },
  });
