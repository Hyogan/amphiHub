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

import {
  useCourseSearchQuery,
  useSuggestCourseMutation,
} from "../hooks/useContribute";
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
  const [mode, setMode] = useState<"search" | "suggest">("search");
  const [text, setText] = useState("");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [nameError, setNameError] = useState(false);
  const term = useDebouncedValue(text.trim(), 350);
  const search = useCourseSearchQuery(term, universityId);
  const suggest = useSuggestCourseMutation();
  const styles = createStyles(colors);

  useImperativeHandle(ref, () => ({
    open: () => {
      setMode("search");
      inner.current?.open();
    },
    close: () => inner.current?.close(),
  }));

  function openSuggest() {
    setName(text.trim());
    setCode("");
    setNameError(false);
    setMode("suggest");
  }

  function sendSuggestion() {
    if (!universityId) return;
    if (name.trim().length < 3) {
      setNameError(true);
      return;
    }
    suggest.mutate(
      { universityId, name, code },
      {
        onSuccess: () => {
          setMode("search");
          inner.current?.close();
        },
      },
    );
  }

  if (mode === "suggest") {
    return (
      <AppSheet ref={inner}>
        <Text style={styles.title}>{t("contribute.suggest.title")}</Text>
        <Text style={styles.hint}>{t("contribute.suggest.body")}</Text>
        <Text style={styles.label}>{t("contribute.suggest.name")}</Text>
        <SheetTextInput
          value={name}
          onChangeText={(value) => {
            setName(value);
            setNameError(false);
          }}
          maxLength={200}
          style={styles.input}
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
          style={styles.input}
        />
        <Button
          label={t("contribute.suggest.submit")}
          loading={suggest.isPending}
          onPress={sendSuggestion}
        />
        <Button
          label={t("contribute.suggest.back")}
          kind="text"
          onPress={() => setMode("search")}
        />
      </AppSheet>
    );
  }

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
      <Button
        label={t("contribute.suggest.link")}
        kind="text"
        onPress={openSuggest}
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
    label: {
      fontFamily: fonts.extrabold,
      fontSize: 15,
      color: colors.text.primary,
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
    error: { fontFamily: fonts.bold, fontSize: 13, color: colors.status.error },
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
