import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text, View } from "react-native";

import { Pressy } from "@/shared/components/Pressy";
import { useThemeColors } from "@/shared/hooks/theme";
import type { Colors } from "@/theme/colors";
import { fonts } from "@/theme/typography";

type TileKey = "exam" | "correction" | "td" | "notes";

const TILES: {
  key: TileKey;
  typeCode: string;
  icon: ComponentProps<typeof Ionicons>["name"];
}[] = [
  { key: "exam", typeCode: "exam", icon: "document-text-outline" },
  { key: "correction", typeCode: "correction", icon: "create-outline" },
  { key: "td", typeCode: "td", icon: "reader-outline" },
  { key: "notes", typeCode: "lecture_notes", icon: "book-outline" },
];

interface QuickTilesProps {
  /** Published documents by type code. Undefined while loading. */
  counts?: Record<string, number>;
  onPress: (typeCode: string) => void;
}

export function QuickTiles({ counts, onPress }: QuickTilesProps) {
  const colors = useThemeColors();
  const { t } = useTranslation("home");
  const styles = createStyles(colors);
  return (
    <View style={styles.grid}>
      {TILES.map(({ key, typeCode, icon }) => {
        const isCorrection = key === "correction";
        const count = counts ? (counts[typeCode] ?? 0) : null;
        return (
          <Pressy
            key={key}
            label={t(`tiles.${key}`)}
            onPress={() => onPress(typeCode)}
            style={styles.tile}
          >
            <View
              style={[
                styles.icon,
                {
                  backgroundColor: isCorrection
                    ? colors.status.errorSoft
                    : colors.brand.primarySoft,
                },
              ]}
            >
              <Ionicons
                name={icon}
                size={22}
                color={
                  isCorrection ? colors.status.error : colors.brand.primary
                }
              />
            </View>
            <Text style={styles.title}>{t(`tiles.${key}`)}</Text>
            <Text style={styles.sub} numberOfLines={2}>
              {t(`tiles.${key}Sub`)}
            </Text>
            {count !== null ? (
              <Text style={styles.count}>{t("tiles.count", { count })}</Text>
            ) : null}
          </Pressy>
        );
      })}
    </View>
  );
}

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
    tile: {
      flexGrow: 1,
      flexBasis: "45%",
      gap: 4,
      padding: 14,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.border.subtle,
      backgroundColor: colors.background.secondary,
    },
    icon: {
      width: 44,
      height: 44,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 6,
    },
    title: {
      fontFamily: fonts.extrabold,
      fontSize: 16,
      color: colors.text.primary,
    },
    sub: {
      fontFamily: fonts.semibold,
      fontSize: 12,
      lineHeight: 17,
      color: colors.text.secondary,
    },
    count: {
      fontFamily: fonts.extrabold,
      fontSize: 12,
      color: colors.text.link,
      marginTop: 4,
    },
  });
