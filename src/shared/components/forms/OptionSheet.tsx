import { Ionicons } from "@expo/vector-icons";
import { useImperativeHandle, useRef, type Ref } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text, View } from "react-native";

import { useThemeColors } from "@/shared/hooks/theme";
import type { Colors } from "@/theme/colors";
import { fonts } from "@/theme/typography";

import { AppSheet, type SheetHandle } from "../AppSheet";
import { Button } from "../Button";
import { Pressy } from "../Pressy";
import { SkeletonRows } from "../SkeletonRows";

export interface SheetOption {
  id: string;
  label: string;
  sublabel?: string;
}

/**
 * A bottom sheet that lists options and returns the chosen id. Handles its own loading, error and empty states.
 * Opening and closing go through the ref, like AppSheet.
 */
export function OptionSheet({
  ref,
  title,
  options,
  selectedId,
  onSelect,
  loading,
  error,
  onRetry,
  emptyText,
  errorText,
}: {
  ref: Ref<SheetHandle>;
  title: string;
  options: SheetOption[];
  selectedId?: string | null;
  onSelect: (id: string) => void;
  loading?: boolean;
  error?: boolean;
  onRetry?: () => void;
  emptyText: string;
  errorText: string;
}) {
  const colors = useThemeColors();
  const { t } = useTranslation();
  const inner = useRef<SheetHandle>(null);
  const styles = createStyles(colors);

  useImperativeHandle(ref, () => ({
    open: () => inner.current?.open(),
    close: () => inner.current?.close(),
  }));

  return (
    <AppSheet ref={inner}>
      <Text style={styles.title}>{title}</Text>
      {loading ? (
        <SkeletonRows />
      ) : error ? (
        <View style={styles.state}>
          <Text style={styles.stateText}>{errorText}</Text>
          {onRetry ? (
            <Button
              label={t("actions.retry")}
              kind="outline"
              onPress={onRetry}
            />
          ) : null}
        </View>
      ) : options.length === 0 ? (
        <Text style={styles.stateText}>{emptyText}</Text>
      ) : (
        <View>
          {options.map((option) => {
            const selected = option.id === (selectedId ?? "");
            return (
              <Pressy
                key={option.id || "none"}
                depth={0.98}
                onPress={() => {
                  onSelect(option.id);
                  inner.current?.close();
                }}
                style={styles.option}
              >
                <View style={styles.optionText}>
                  <Text
                    style={[
                      styles.optionLabel,
                      selected && styles.optionLabelSelected,
                    ]}
                  >
                    {option.label}
                  </Text>
                  {option.sublabel ? (
                    <Text style={styles.optionSub}>{option.sublabel}</Text>
                  ) : null}
                </View>
                {selected ? (
                  <Ionicons
                    name="checkmark-circle"
                    size={24}
                    color={colors.brand.primary}
                  />
                ) : null}
              </Pressy>
            );
          })}
        </View>
      )}
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
    state: { gap: 12 },
    stateText: {
      fontFamily: fonts.semibold,
      fontSize: 15,
      lineHeight: 22,
      color: colors.text.secondary,
    },
    option: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      minHeight: 60,
      paddingVertical: 10,
      borderTopWidth: 1,
      borderTopColor: colors.border.subtle,
    },
    optionText: { flex: 1, gap: 2 },
    optionLabel: {
      fontFamily: fonts.bold,
      fontSize: 16,
      color: colors.text.primary,
    },
    optionLabelSelected: {
      fontFamily: fonts.extrabold,
      color: colors.brand.primary,
    },
    optionSub: {
      fontFamily: fonts.semibold,
      fontSize: 13,
      color: colors.text.secondary,
    },
  });
