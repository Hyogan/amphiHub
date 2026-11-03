import { StyleSheet, Text, View } from "react-native";

import { useThemeColors } from "@/shared/hooks/theme";
import type { Colors } from "@/theme/colors";
import { fonts } from "@/theme/typography";

export function KeyValue({ label, value }: { label: string; value: string }) {
  const colors = useThemeColors();
  const styles = createStyles(colors);
  return (
    <View style={styles.kv}>
      <Text style={styles.key}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    kv: {
      flexDirection: "row",
      justifyContent: "space-between",
      gap: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border.subtle,
    },
    key: {
      fontFamily: fonts.semibold,
      fontSize: 14,
      color: colors.text.secondary,
    },
    value: {
      fontFamily: fonts.bold,
      fontSize: 14,
      color: colors.text.primary,
      flexShrink: 1,
      textAlign: "right",
    },
  });
