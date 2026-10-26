import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import { StyleSheet, Text, View } from "react-native";

import { useThemeColors } from "@/shared/hooks/theme";
import type { Colors } from "@/theme/colors";
import { fonts } from "@/theme/typography";

import { Pressy } from "../Pressy";

/** A tappable row that shows a label and the current choice, and opens a sheet of options. */
export function SelectRow({
  label,
  value,
  placeholder,
  hint,
  icon,
  disabled,
  onPress,
}: {
  label: string;
  value?: string | null;
  placeholder: string;
  /** Shown instead of the placeholder when the row is disabled (why it is disabled). */
  hint?: string;
  icon: ComponentProps<typeof Ionicons>["name"];
  disabled?: boolean;
  onPress: () => void;
}) {
  const colors = useThemeColors();
  const styles = createStyles(colors);
  return (
    <Pressy
      onPress={onPress}
      disabled={disabled}
      depth={0.98}
      style={[styles.row, disabled && styles.disabled]}
    >
      <View style={styles.icon}>
        <Ionicons name={icon} size={22} color={colors.brand.primary} />
      </View>
      <View style={styles.text}>
        <Text style={styles.label}>{label}</Text>
        <Text
          style={[styles.value, !value && styles.placeholder]}
          numberOfLines={1}
        >
          {value ?? (disabled && hint ? hint : placeholder)}
        </Text>
      </View>
      <Ionicons name="chevron-down" size={20} color={colors.icon.muted} />
    </Pressy>
  );
}

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      minHeight: 68,
      paddingHorizontal: 14,
      borderRadius: 16,
      borderWidth: 1.5,
      borderColor: colors.border.default,
      backgroundColor: colors.background.secondary,
    },
    disabled: { opacity: 0.55 },
    icon: {
      width: 40,
      height: 40,
      borderRadius: 13,
      backgroundColor: colors.brand.primarySoft,
      alignItems: "center",
      justifyContent: "center",
    },
    text: { flex: 1, gap: 1 },
    label: {
      fontFamily: fonts.semibold,
      fontSize: 13,
      color: colors.text.secondary,
    },
    value: {
      fontFamily: fonts.extrabold,
      fontSize: 16,
      color: colors.text.primary,
    },
    placeholder: { fontFamily: fonts.semibold, color: colors.text.secondary },
  });
