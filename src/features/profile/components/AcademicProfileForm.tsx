import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text, View } from "react-native";
import Animated from "react-native-reanimated";

import {
  useProgramLevelsQuery,
  useProgramsQuery,
  useUniversitiesQuery,
} from "@/features/catalog/hooks/useCatalog";
import { useCelebrate } from "@/shared/celebration/useCelebrate";
import type { SheetHandle } from "@/shared/components/AppSheet";
import { Button } from "@/shared/components/Button";
import { OptionSheet } from "@/shared/components/forms/OptionSheet";
import { SelectRow } from "@/shared/components/forms/SelectRow";
import { useThemeColors } from "@/shared/hooks/theme";
import { useShake } from "@/shared/motion/hooks";
import { useToast } from "@/shared/toast/useToast";
import type { Colors } from "@/theme/colors";
import { fonts } from "@/theme/typography";

import { useUpdateAcademicProfileMutation } from "../hooks/useProfile";
import { isAcademicProfileComplete, type Profile } from "../types/profile";

/**
 * University, program, level and semester. Each choice depends on the one before it, so changing
 * an earlier choice clears the later ones. Nothing is saved until the user taps Save.
 */
export function AcademicProfileForm({ profile }: { profile: Profile }) {
  const colors = useThemeColors();
  const { t } = useTranslation("profile");
  const { t: tc } = useTranslation();
  const toast = useToast();
  const celebrate = useCelebrate();
  const shake = useShake();
  const styles = createStyles(colors);

  const [universityId, setUniversityId] = useState<string | null>(
    profile.universityId,
  );
  const [programId, setProgramId] = useState<string | null>(profile.programId);
  const [level, setLevel] = useState<string | null>(profile.level);
  const [semester, setSemester] = useState<number | null>(profile.semester);

  const universities = useUniversitiesQuery();
  const programs = useProgramsQuery(universityId);
  const levels = useProgramLevelsQuery(programId);
  const update = useUpdateAcademicProfileMutation(profile.id);

  const universitySheet = useRef<SheetHandle>(null);
  const programSheet = useRef<SheetHandle>(null);
  const levelSheet = useRef<SheetHandle>(null);
  const semesterSheet = useRef<SheetHandle>(null);

  const university = universities.data?.find((u) => u.id === universityId);
  const program = programs.data?.find((p) => p.id === programId);
  const semestersForLevel =
    levels.data?.find((l) => l.level === level)?.semesters ?? [];

  const wasComplete = isAcademicProfileComplete(profile);
  const isComplete = isAcademicProfileComplete({
    universityId,
    programId,
    level,
  });
  const dirty =
    universityId !== profile.universityId ||
    programId !== profile.programId ||
    level !== profile.level ||
    semester !== profile.semester;

  const pickUniversity = (id: string) => {
    if (id === universityId) return;
    setUniversityId(id);
    setProgramId(null);
    setLevel(null);
    setSemester(null);
  };
  const pickProgram = (id: string) => {
    if (id === programId) return;
    setProgramId(id);
    setLevel(null);
    setSemester(null);
  };
  const pickLevel = (id: string) => {
    if (id === level) return;
    setLevel(id);
    setSemester(null);
  };

  const save = async () => {
  };

  return (
    <Animated.View style={[styles.card, shake.style]}>
      <View style={styles.header}>
        <Text style={styles.title}>{t("academic.title")}</Text>
        <View
          style={[
            styles.badge,
            isComplete ? styles.badgeDone : styles.badgeTodo,
          ]}
        >
          <Text
            style={[
              styles.badgeText,
              isComplete ? styles.badgeTextDone : styles.badgeTextTodo,
            ]}
          >
            {isComplete
              ? t("academic.completeStatus")
              : t("academic.incompleteStatus")}
          </Text>
        </View>
      </View>
      {!isComplete ? (
        <Text style={styles.hint}>{t("academic.hint")}</Text>
      ) : null}

      <SelectRow
        icon="school-outline"
        label={t("academic.university")}
        value={university?.name}
        placeholder={t("academic.pickUniversity")}
        onPress={() => universitySheet.current?.open()}
      />
      <SelectRow
        icon="layers-outline"
        label={t("academic.program")}
        value={program?.name}
        placeholder={t("academic.pickProgram")}
        hint={t("academic.programFirst")}
        disabled={!universityId}
        onPress={() => programSheet.current?.open()}
      />
      <SelectRow
        icon="bar-chart-outline"
        label={t("academic.level")}
        value={level}
        placeholder={t("academic.pickLevel")}
        hint={t("academic.levelFirst")}
        disabled={!programId}
        onPress={() => levelSheet.current?.open()}
      />
      {level && semestersForLevel.length > 0 ? (
        <SelectRow
          icon="calendar-outline"
          label={t("academic.semester")}
          value={
            semester !== null
              ? t("academic.semesterValue", { n: semester })
              : null
          }
          placeholder={t("academic.pickSemester")}
          onPress={() => semesterSheet.current?.open()}
        />
      ) : null}

      <Button
        label={t("academic.save")}
        disabled={!dirty || !universityId}
        loading={update.isPending}
        onPress={save}
      />

      <OptionSheet
        ref={universitySheet}
        title={t("academic.university")}
        options={(universities.data ?? []).map((u) => ({
          id: u.id,
          label: u.name,
          sublabel: u.shortName,
        }))}
        selectedId={universityId}
        onSelect={pickUniversity}
        loading={universities.isPending}
        error={universities.isError}
        onRetry={() => universities.refetch()}
        emptyText={t("academic.emptyUniversities")}
        errorText={t("academic.listError")}
      />
      <OptionSheet
        ref={programSheet}
        title={t("academic.program")}
        options={(programs.data ?? []).map((p) => ({
          id: p.id,
          label: p.name,
          sublabel: p.degreeType ?? undefined,
        }))}
        selectedId={programId}
        onSelect={pickProgram}
        loading={programs.isPending && Boolean(universityId)}
        error={programs.isError}
        onRetry={() => programs.refetch()}
        emptyText={t("academic.emptyPrograms")}
        errorText={t("academic.listError")}
      />
      <OptionSheet
        ref={levelSheet}
        title={t("academic.level")}
        options={(levels.data ?? []).map((l) => ({
          id: l.level,
          label: l.level,
        }))}
        selectedId={level}
        onSelect={pickLevel}
        loading={levels.isPending && Boolean(programId)}
        error={levels.isError}
        onRetry={() => levels.refetch()}
        emptyText={t("academic.emptyLevels")}
        errorText={t("academic.listError")}
      />
      <OptionSheet
        ref={semesterSheet}
        title={t("academic.semester")}
        options={[
          { id: "", label: t("academic.noSemester") },
          ...semestersForLevel.map((n) => ({
            id: String(n),
            label: t("academic.semesterValue", { n }),
          })),
        ]}
        selectedId={semester === null ? "" : String(semester)}
        onSelect={(id) => setSemester(id === "" ? null : Number(id))}
        emptyText={t("academic.emptyLevels")}
        errorText={t("academic.listError")}
      />
    </Animated.View>
  );
}

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    card: {
      gap: 12,
      padding: 16,
      borderRadius: 22,
      backgroundColor: colors.background.secondary,
      borderWidth: 1,
      borderColor: colors.border.subtle,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 8,
    },
    title: {
      flex: 1,
      fontFamily: fonts.extrabold,
      fontSize: 19,
      color: colors.text.primary,
    },
    hint: {
      fontFamily: fonts.semibold,
      fontSize: 14,
      lineHeight: 20,
      color: colors.text.secondary,
    },
    badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 9 },
    badgeDone: { backgroundColor: colors.status.successSoft },
    badgeTodo: { backgroundColor: colors.brand.accentSoft },
    badgeText: { fontFamily: fonts.extrabold, fontSize: 12 },
    badgeTextDone: { color: colors.status.success },
    badgeTextTodo: { color: colors.brand.accentText },
  });
