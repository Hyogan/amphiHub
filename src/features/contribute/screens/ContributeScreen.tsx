import { Ionicons } from "@expo/vector-icons";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useUniversitiesQuery } from "@/features/catalog/hooks/useCatalog";
import { useProfileQuery } from "@/features/profile/hooks/useProfile";
import {
  useResourceTypeLabel,
  useResourceTypesQuery,
} from "@/features/resources/hooks/useResources";
import { ACADEMIC_YEARS } from "@/features/resources/utils/academicYears";
import { formatFileSize } from "@/features/resources/utils/format";
import { pickPdf, type PickedPdf } from "@/services/upload/pickPdf";
import type { SheetHandle } from "@/shared/components/AppSheet";
import { Button } from "@/shared/components/Button";
import { EmptyState } from "@/shared/components/common/EmptyState";
import { ScreenHeader } from "@/shared/components/common/ScreenHeader";
import { FormTextField } from "@/shared/components/forms/FormTextField";
import { OptionSheet } from "@/shared/components/forms/OptionSheet";
import { TextField } from "@/shared/components/forms/TextField";
import { Pressy } from "@/shared/components/Pressy";
import { Tag } from "@/shared/components/Tag";
import { useThemeColors } from "@/shared/hooks/theme";
import { useAppSelector } from "@/store/hooks";
import type { Colors } from "@/theme/colors";
import { fonts } from "@/theme/typography";

import { CoursePickerSheet } from "../components/CoursePickerSheet";
import { useSubmitContribution } from "../hooks/useContribute";
import {
  createContributionSchema,
  type ContributionValues,
} from "../schemas/contribution.validation";
import {
  EXAM_SESSIONS,
  SOURCE_TYPES,
  UNKNOWN_YEAR,
  type CourseHit,
} from "../types/contribution";

function ChoiceRow({
  options,
  value,
  onChange,
}: {
  options: { id: string; label: string }[];
  value: string;
  onChange: (id: string) => void;
}) {
  const colors = useThemeColors();
  const styles = createStyles(colors);
  return (
    <View style={styles.choices}>
      {options.map((option) => (
        <Tag
          key={option.id}
          label={option.label}
          selected={value === option.id}
          onPress={() => onChange(option.id)}
        />
      ))}
    </View>
  );
}

function FieldButton({
  label,
  value,
  placeholder,
  error,
  onPress,
}: {
  label: string;
  value?: string;
  placeholder: string;
  error?: string;
  onPress: () => void;
}) {
  const colors = useThemeColors();
  const styles = createStyles(colors);
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <Pressy
        label={label}
        depth={0.98}
        onPress={onPress}
        style={styles.fieldButton}
      >
        <Text
          style={value ? styles.fieldValue : styles.fieldPlaceholder}
          numberOfLines={2}
        >
          {value || placeholder}
        </Text>
        <Ionicons name="chevron-down" size={20} color={colors.icon.secondary} />
      </Pressy>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

export function ContributeScreen() {
  const colors = useThemeColors();
  const router = useRouter();
  const { t, i18n } = useTranslation("resources");
  const { t: tc } = useTranslation();
  const typeLabel = useResourceTypeLabel();
  const styles = createStyles(colors);

  const userId = useAppSelector((state) => state.session.userId);
  const profile = useProfileQuery(userId).data;
  const universities = useUniversitiesQuery();
  const types = useResourceTypesQuery();
  const submit = useSubmitContribution();
  const universitySheet = useRef<SheetHandle>(null);
  const courseSheet = useRef<SheetHandle>(null);

  const [file, setFile] = useState<PickedPdf | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  // Pickers keep the id in the form and the display object here.
  const [course, setCourse] = useState<CourseHit | null>(null);
  const [titleEdited, setTitleEdited] = useState(false);

  const form = useForm<ContributionValues>({
    resolver: zodResolver(createContributionSchema(t)),
    defaultValues: {
      universityId: "",
      courseId: "",
      typeCode: "",
      yearChoice: "",
      examSession: "",
      language: "",
      sourceType: "community_upload",
      sourceNote: "",
      title: "",
      rightsDeclared: false,
    },
  });
  const { control } = form;
  const universityId = useWatch({ control, name: "universityId" });
  const typeCode = useWatch({ control, name: "typeCode" });
  const yearChoice = useWatch({ control, name: "yearChoice" });
  const examSession = useWatch({ control, name: "examSession" });
  const sourceType = useWatch({ control, name: "sourceType" });

  // Start from the university in the profile.
  useEffect(() => {
    if (profile?.universityId && !form.getValues("universityId")) {
      form.setValue("universityId", profile.universityId);
    }
  }, [profile?.universityId, form]);

  // The title is built from the choices until the contributor edits it.
  const autoTitle = [
    typeCode ? typeLabel(typeCode) : null,
    course?.name,
    yearChoice && yearChoice !== UNKNOWN_YEAR ? yearChoice : null,
    examSession ? t(`session.${examSession}`) : null,
  ]
    .filter(Boolean)
    .join(", ");
  useEffect(() => {
    if (!titleEdited) form.setValue("title", autoTitle);
  }, [autoTitle, titleEdited, form]);

  const universityName = universities.data?.find(
    (u) => u.id === universityId,
  )?.name;
  const showSession = typeCode === "exam" || typeCode === "correction";

  async function onPickFile() {
    const result = await pickPdf();
    if (result.status === "picked") {
      setFile(result.file);
      setFileError(null);
    } else if (result.status === "error") {
      setFileError(
        t(
          result.error === "type"
            ? "contribute.errors.fileType"
            : result.error === "size"
              ? "contribute.errors.fileSize"
              : "contribute.errors.fileEmpty",
        ),
      );
    }
  }

  const onSubmit = form.handleSubmit((values) => {
    if (!file) return;
    submit.mutate(
      { file, values },
      {
        onSuccess: () =>
          // router.canGoBack() ? router.back() : router.replace("/(tabs)"),
          router.replace("/contributions"),
      },
    );
  });

  if (!userId) {
    return (
      <SafeAreaView style={styles.root} edges={["top"]}>
        <View style={styles.padded}>
          <ScreenHeader title={t("contribute.title")} />
          <EmptyState
            title={t("contribute.guestTitle")}
            body={t("contribute.guestBody")}
          >
            <Button
              label={t("saved.signIn")}
              onPress={() => router.navigate("/(auth)/login")}
            />
          </EmptyState>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader title={t("contribute.title")} />
        <Text style={styles.intro}>{t("contribute.intro")}</Text>

        <View style={styles.field}>
          <Text style={styles.label}>{t("contribute.file.label")}</Text>
          {file ? (
            <View style={styles.fileCard}>
              <Ionicons
                name="document-text-outline"
                size={24}
                color={colors.brand.primary}
              />
              <Text style={styles.fileName} numberOfLines={2}>
                {t("contribute.file.info", {
                  name: file.name,
                  size: formatFileSize(file.sizeBytes, i18n.language),
                })}
              </Text>
            </View>
          ) : null}
          <Button
            label={
              file ? t("contribute.file.change") : t("contribute.file.choose")
            }
            kind="outline"
            icon="document-attach-outline"
            onPress={onPickFile}
          />
          {fileError ? <Text style={styles.error}>{fileError}</Text> : null}
        </View>

        <Controller
          control={control}
          name="universityId"
          render={({ field, fieldState }) => (
            <FieldButton
              label={t("contribute.university")}
              value={universityName}
              placeholder={t("contribute.universityPlaceholder")}
              error={fieldState.error?.message}
              onPress={() => universitySheet.current?.open()}
            />
          )}
        />
        <Controller
          control={control}
          name="courseId"
          render={({ fieldState }) => (
            <FieldButton
              label={t("contribute.course")}
              value={
                course
                  ? [course.code, course.name].filter(Boolean).join(", ")
                  : undefined
              }
              placeholder={t("contribute.coursePlaceholder")}
              error={fieldState.error?.message}
              onPress={() => {
                if (!universityId) {
                  form.setError("universityId", {
                    message: t("contribute.errors.university"),
                  });
                  return;
                }
                courseSheet.current?.open();
              }}
            />
          )}
        />

        <Controller
          control={control}
          name="typeCode"
          render={({ field, fieldState }) => (
            <View style={styles.field}>
              <Text style={styles.label}>{t("contribute.type")}</Text>
              <ChoiceRow
                options={(types.data ?? []).map((type) => ({
                  id: type.code,
                  label: typeLabel(type.code),
                }))}
                value={field.value}
                onChange={field.onChange}
              />
              {fieldState.error ? (
                <Text style={styles.error}>{fieldState.error.message}</Text>
              ) : null}
            </View>
          )}
        />

        <Controller
          control={control}
          name="yearChoice"
          render={({ field, fieldState }) => (
            <View style={styles.field}>
              <Text style={styles.label}>{t("contribute.year")}</Text>
              <ChoiceRow
                options={[
                  ...ACADEMIC_YEARS.map((year) => ({ id: year, label: year })),
                  { id: UNKNOWN_YEAR, label: t("contribute.yearUnknown") },
                ]}
                value={field.value}
                onChange={field.onChange}
              />
              {fieldState.error ? (
                <Text style={styles.error}>{fieldState.error.message}</Text>
              ) : null}
            </View>
          )}
        />

        {showSession ? (
          <Controller
            control={control}
            name="examSession"
            render={({ field }) => (
              <View style={styles.field}>
                <Text style={styles.label}>{t("contribute.session")}</Text>
                <ChoiceRow
                  options={EXAM_SESSIONS.map((code) => ({
                    id: code,
                    label: t(`session.${code}`),
                  }))}
                  value={field.value}
                  onChange={(id) =>
                    field.onChange(field.value === id ? "" : id)
                  }
                />
              </View>
            )}
          />
        ) : null}

        <Controller
          control={control}
          name="language"
          render={({ field }) => (
            <View style={styles.field}>
              <Text style={styles.label}>{t("contribute.language")}</Text>
              <ChoiceRow
                options={[
                  { id: "fr", label: t("language.fr") },
                  { id: "en", label: t("language.en") },
                ]}
                value={field.value}
                onChange={(id) => field.onChange(field.value === id ? "" : id)}
              />
            </View>
          )}
        />

        <Controller
          control={control}
          name="sourceType"
          render={({ field }) => (
            <View style={styles.field}>
              <Text style={styles.label}>{t("contribute.source")}</Text>
              <ChoiceRow
                options={SOURCE_TYPES.map((code) => ({
                  id: code,
                  label: t(`contribute.sourceType.${code}`),
                }))}
                value={field.value}
                onChange={field.onChange}
              />
            </View>
          )}
        />
        <FormTextField
          control={control}
          name="sourceNote"
          label={t("contribute.sourceNote")}
          helper={
            sourceType === "community_upload"
              ? t("contribute.sourceNoteOptional")
              : t("contribute.sourceNoteRequired")
          }
        />

        <Controller
          control={control}
          name="title"
          render={({ field, fieldState }) => (
            <TextField
              label={t("contribute.titleField")}
              helper={t("contribute.titleHelper")}
              value={field.value}
              onChangeText={(text) => {
                setTitleEdited(true);
                field.onChange(text);
              }}
              onBlur={field.onBlur}
              error={fieldState.error?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="rightsDeclared"
          render={({ field, fieldState }) => (
            <View style={styles.field}>
              <Pressy
                label={t("contribute.rights")}
                depth={0.98}
                onPress={() => field.onChange(!field.value)}
                style={styles.rights}
              >
                <Ionicons
                  name={field.value ? "checkbox" : "square-outline"}
                  size={26}
                  color={
                    field.value ? colors.brand.primary : colors.icon.secondary
                  }
                />
                <Text style={styles.rightsText}>{t("contribute.rights")}</Text>
              </Pressy>
              {fieldState.error ? (
                <Text style={styles.error}>{fieldState.error.message}</Text>
              ) : null}
            </View>
          )}
        />

        <Button
          label={t("contribute.submit")}
          loading={submit.isPending}
          onPress={() => {
            if (!file) setFileError(t("contribute.errors.file"));
            onSubmit();
          }}
        />
      </ScrollView>

      {/* Sheets are siblings of the scroll content, never inside it. */}
      <OptionSheet
        ref={universitySheet}
        title={t("contribute.university")}
        options={(universities.data ?? []).map((u) => ({
          id: u.id,
          label: u.name,
          sublabel: u.shortName,
        }))}
        selectedId={universityId}
        onSelect={(id) => {
          if (id !== universityId) {
            form.setValue("courseId", "");
            setCourse(null);
          }
          form.setValue("universityId", id, {
            shouldValidate: form.formState.isSubmitted,
          });
        }}
        loading={universities.isPending}
        error={universities.isError}
        onRetry={() => universities.refetch()}
        emptyText={t("contribute.universityEmpty")}
        errorText={t("contribute.universityError")}
      />
      <CoursePickerSheet
        ref={courseSheet}
        universityId={universityId || null}
        onSelect={(picked) => {
          setCourse(picked);
          form.setValue("courseId", picked.id, {
            shouldValidate: form.formState.isSubmitted,
          });
        }}
      />
    </SafeAreaView>
  );
}

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.background.primary },
    padded: { paddingHorizontal: 20 },
    content: { paddingHorizontal: 20, paddingBottom: 48, gap: 20 },
    intro: {
      fontFamily: fonts.semibold,
      fontSize: 15,
      lineHeight: 22,
      color: colors.text.secondary,
    },
    field: { gap: 8 },
    label: {
      fontFamily: fonts.extrabold,
      fontSize: 15,
      color: colors.text.primary,
    },
    choices: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    error: {
      fontFamily: fonts.bold,
      fontSize: 13,
      color: colors.status.error,
    },
    fileCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      padding: 14,
      borderRadius: 16,
      backgroundColor: colors.brand.primarySoft,
    },
    fileName: {
      flex: 1,
      fontFamily: fonts.bold,
      fontSize: 14,
      color: colors.text.primary,
    },
    fieldButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      minHeight: 54,
      paddingHorizontal: 16,
      borderRadius: 16,
      borderWidth: 1.5,
      borderColor: colors.border.default,
      backgroundColor: colors.background.secondary,
    },
    fieldValue: {
      flex: 1,
      fontFamily: fonts.bold,
      fontSize: 16,
      color: colors.text.primary,
    },
    fieldPlaceholder: {
      flex: 1,
      fontFamily: fonts.semibold,
      fontSize: 16,
      color: colors.text.tertiary,
    },
    rights: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
    rightsText: {
      flex: 1,
      fontFamily: fonts.semibold,
      fontSize: 14,
      lineHeight: 21,
      color: colors.text.primary,
    },
  });
