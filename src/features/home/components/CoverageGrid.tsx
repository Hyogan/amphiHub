import { useTranslation } from "react-i18next";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import type {
    CoverageRow,
    CoverageState,
} from "@/features/catalog/types/catalog";
import { shortYear } from "@/features/resources/types/resource";
import { Pressy } from "@/shared/components/Pressy";
import { useThemeColors } from "@/shared/hooks/theme";
import type { Colors } from "@/theme/colors";
import { fonts } from "@/theme/typography";

const NAME_WIDTH = 128;
const CELL_WIDTH = 52;

/** dot: a paper exists. ring: a paper and its correction exist. dash: nothing yet. */
function CoverageMark({ state }: { state: CoverageState }) {
  const colors = useThemeColors();
  const styles = createStyles(colors);
  if (state === "both") {
    return (
      <View style={styles.ring}>
        <View style={styles.dot} />
      </View>
    );
  }
  if (state === "paper") return <View style={styles.dot} />;
  return <View style={styles.dash} />;
}

interface CoverageGridProps {
  rows: CoverageRow[];
  years: string[];
  onOpenCourse: (courseId: string) => void;
  onEmptyCell: (row: CoverageRow, year: string) => void;
}

export function CoverageGrid({
  rows,
  years,
  onOpenCourse,
  onEmptyCell,
}: CoverageGridProps) {
  const colors = useThemeColors();
  const { t } = useTranslation("home");
  const styles = createStyles(colors);
  return (
    <View style={styles.wrap}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View>
          <View style={styles.row}>
            <View style={{ width: NAME_WIDTH }} />
            {years.map((year) => (
              <Text key={year} style={styles.year}>
                {shortYear(year)}
              </Text>
            ))}
          </View>
          {rows.map((row) => (
            <View key={row.courseId} style={[styles.row, styles.rowRuled]}>
              <Pressy
                label={row.name}
                depth={0.98}
                onPress={() => onOpenCourse(row.courseId)}
                style={styles.name}
              >
                {row.code ? <Text style={styles.code}>{row.code}</Text> : null}
                <Text style={styles.courseName} numberOfLines={1}>
                  {row.name}
                </Text>
              </Pressy>
              {row.cells.map((cell) => (
                <Pressy
                  key={cell.year}
                  label={`${row.name}, ${cell.year}`}
                  depth={0.9}
                  onPress={() =>
                    cell.state === "none"
                      ? onEmptyCell(row, cell.year)
                      : onOpenCourse(row.courseId)
                  }
                  style={styles.cell}
                >
                  <CoverageMark state={cell.state} />
                </Pressy>
              ))}
            </View>
          ))}
        </View>
      </ScrollView>
      <View style={styles.legend}>
        {(
          [
            ["paper", t("coverage.legendPaper")],
            ["both", t("coverage.legendBoth")],
            ["none", t("coverage.legendNone")],
          ] as const
        ).map(([state, label]) => (
          <View key={state} style={styles.legendItem}>
            <CoverageMark state={state} />
            <Text style={styles.legendText}>{label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    wrap: { gap: 12 },
    row: { flexDirection: "row", alignItems: "center", minHeight: 52 },
    rowRuled: { borderTopWidth: 1, borderTopColor: colors.border.subtle },
    year: {
      width: CELL_WIDTH,
      textAlign: "center",
      fontFamily: fonts.extrabold,
      fontSize: 12,
      color: colors.text.secondary,
    },
    name: { width: NAME_WIDTH, paddingRight: 10, gap: 1 },
    code: {
      fontFamily: fonts.extrabold,
      fontSize: 14,
      color: colors.text.link,
    },
    courseName: {
      fontFamily: fonts.semibold,
      fontSize: 12,
      color: colors.text.secondary,
    },
    cell: {
      width: CELL_WIDTH,
      height: 52,
      alignItems: "center",
      justifyContent: "center",
    },
    dot: {
      width: 12,
      height: 12,
      borderRadius: 6,
      backgroundColor: colors.brand.primary,
    },
    ring: {
      width: 22,
      height: 22,
      borderRadius: 11,
      borderWidth: 2,
      borderColor: colors.status.error,
      alignItems: "center",
      justifyContent: "center",
    },
    dash: {
      width: 12,
      height: 2,
      borderRadius: 1,
      backgroundColor: colors.border.strong,
    },
    legend: { flexDirection: "row", flexWrap: "wrap", gap: 16 },
    legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
    legendText: {
      fontFamily: fonts.semibold,
      fontSize: 12,
      color: colors.text.secondary,
    },
  });
