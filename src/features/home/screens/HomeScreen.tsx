import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  useCourseCoverageQuery,
  useProgramsQuery,
  useUniversitiesQuery,
} from "@/features/catalog/hooks/useCatalog";
import { useProfileQuery } from "@/features/profile/hooks/useProfile";
import { isAcademicProfileComplete } from "@/features/profile/types/profile";
import { ResourceRow } from "@/features/resources/components/ResourceRow";
import {
  useRecentResourcesQuery,
  useResourceCountsQuery,
} from "@/features/resources/hooks/useResources";
import { COVERAGE_YEARS } from "@/features/resources/utils/academicYears";
import { AppTopBar } from "@/shared/components/AppTopBar";
import { Button } from "@/shared/components/Button";
import { EmptyState } from "@/shared/components/common/EmptyState";
import { Tap } from "@/shared/components/Pressy";
import { SkeletonRows } from "@/shared/components/SkeletonRows";
import { useThemeColors } from "@/shared/hooks/theme";
import { useToast } from "@/shared/toast/useToast";
import { useAppSelector } from "@/store/hooks";
import type { Colors } from "@/theme/colors";
import { fonts } from "@/theme/typography";

import { OfflineNotice, OfflineSection } from "@/shared/components/Offline";
import { isOfflinePending } from "@/shared/utils/network";
import { CampusChip, type CampusChipState } from "../components/CampusChip";
import { CoverageGrid } from "../components/CoverageGrid";
import { Hero } from "../components/Hero";
import { QuickTiles } from "../components/QuickTiles";
import { StudyFocus } from "../components/StudyFocus";
export function HomeScreen() {
  const colors = useThemeColors();
  const router = useRouter();
  const toast = useToast();
  const { t } = useTranslation("home");
  const { t: tc } = useTranslation();
  const styles = createStyles(colors);

  const userId = useAppSelector((state) => state.session.userId);
  const dockHeight = useAppSelector((state) => state.dock.height);

  const profileQuery = useProfileQuery(userId);
  const profile = profileQuery.data;
  const universities = useUniversitiesQuery();
  const programs = useProgramsQuery(profile?.universityId);
  const coverage = useCourseCoverageQuery({
    programId: profile?.programId,
    level: profile?.level,
    years: COVERAGE_YEARS,
  });
  const counts = useResourceCountsQuery();
  const recent = useRecentResourcesQuery(6, profile?.universityId);

  const chipState: CampusChipState = !userId
    ? "guest"
    : profile && isAcademicProfileComplete(profile)
      ? "complete"
      : "incomplete";
  const universityName = universities.data?.find(
    (u) => u.id === profile?.universityId,
  )?.shortName;
  const programName = programs.data?.find(
    (p) => p.id === profile?.programId,
  )?.name;

  const goExplore = (type?: string) =>
    router.navigate({ pathname: "/explore", params: type ? { type } : {} });
  const goCourse = (id: string) =>
    router.push({ pathname: "/course/[id]", params: { id } });

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          // { paddingBottom: dockHeight + 24 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <AppTopBar />
        <OfflineNotice />

        <Hero onExplore={() => goExplore()} />

        {/* // (A paused query is "pending", so the old isLoading check would show "Complete your profile" offline.) */}
        {userId && profileQuery.isPending ? null : (
          <CampusChip
            state={chipState}
            universityName={universityName}
            programName={programName}
            level={profile?.level}
            onPress={() =>
              chipState === "guest"
                ? router.navigate("/(auth)/signup")
                : router.navigate("/profile")
            }
          />
        )}

        <StudyFocus />

        {profile?.programId ? (
          <View style={styles.section}>
            <Text style={styles.heading}>{t("coverage.title")}</Text>
            {isOfflinePending(coverage) ? (
              <OfflineSection />
            ) : coverage.isPending ? (
              <SkeletonRows count={3} />
            ) : coverage.isError ? (
              <EmptyState title={t("coverage.loadError")}>
                <Button
                  label={tc("actions.retry")}
                  kind="outline"
                  onPress={() => coverage.refetch()}
                />
              </EmptyState>
            ) : coverage.data.length === 0 ? (
              <EmptyState title={t("coverage.noCourses")} />
            ) : (
              <CoverageGrid
                rows={coverage.data}
                years={COVERAGE_YEARS}
                onOpenCourse={goCourse}
                onEmptyCell={(row, year) =>
                  toast.info(t("coverage.none", { year, course: row.name }))
                }
              />
            )}
          </View>
        ) : null}

        <View style={styles.section}>
          <Text style={styles.heading}>{t("tiles.title")}</Text>
          <QuickTiles counts={counts.data} onPress={goExplore} />
        </View>

        <View style={styles.section}>
          <View style={styles.headingRow}>
            <Text style={styles.heading}>{t("recent.title")}</Text>
            <Tap label={t("recent.seeAll")} onPress={() => goExplore()}>
              <Text style={styles.seeAll}>{t("recent.seeAll")}</Text>
            </Tap>
          </View>
          {isOfflinePending(recent) ? (
            <OfflineSection />
          ) : recent.isPending ? (
            <SkeletonRows count={3} />
          ) : recent.isError ? (
            <EmptyState title={t("recent.loadError")}>
              <Button
                label={tc("actions.retry")}
                kind="outline"
                onPress={() => recent.refetch()}
              />
            </EmptyState>
          ) : recent.data.length === 0 ? (
            <EmptyState title={t("recent.empty")} />
          ) : (
            <View>
              {recent.data.map((item) => (
                <ResourceRow key={item.id} item={item} />
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.background.primary },
    content: { paddingHorizontal: 20, gap: 20 },
    section: { gap: 12 },
    headingRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    heading: {
      fontFamily: fonts.extrabold,
      fontSize: 19,
      color: colors.text.primary,
    },
    seeAll: {
      fontFamily: fonts.extrabold,
      fontSize: 14,
      color: colors.text.link,
      textDecorationLine: "underline",
    },
  });
