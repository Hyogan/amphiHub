import { Ionicons } from "@expo/vector-icons";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { FadeInDown, FadeOutDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useThemeColors } from "@/shared/hooks/theme";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fonts } from "@/theme/typography";

import { removeToast, type ToastItem } from "./toastSlice";

const ICONS = {
  success: "checkmark-circle",
  error: "alert-circle",
  info: "information-circle",
  warning: "warning",
} as const;

function ToastRow({ item }: { item: ToastItem }) {
  const colors = useThemeColors();
  const dispatch = useAppDispatch();
  const { t } = useTranslation();
  const styles = createStyles(colors);

  useEffect(() => {
    const timer = setTimeout(
      () => dispatch(removeToast(item.id)),
      item.duration,
    );
    return () => clearTimeout(timer);
  }, [dispatch, item.id, item.duration]);

  return (
    <Animated.View
      entering={FadeInDown.springify().damping(14)}
      exiting={FadeOutDown.duration(200)}
      style={styles.row}
    >
      <Ionicons
        name={ICONS[item.variant]}
        size={21}
        color={colors.snackbar[item.variant]}
      />
      <Text style={styles.message}>{item.message}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t("actions.close")}
        hitSlop={10}
        onPress={() => dispatch(removeToast(item.id))}
      >
        <Ionicons name="close" size={18} color={colors.snackbar.text} />
      </Pressable>
    </Animated.View>
  );
}

/**
 * Mount once in the root layout. Snackbars sit at the bottom and clear the dock when it is on screen.
 */
export function ToastManager() {
  const items = useAppSelector((state) => state.toast.items);
  const dockHeight = useAppSelector((state) => state.dock.height);
  const insets = useSafeAreaInsets();
  if (items.length === 0) return null;
  const bottom = dockHeight > 0 ? dockHeight + 12 : insets.bottom + 16;
  return (
    <View style={[hostStyle, { bottom }]}>
      {items.map((item) => (
        <ToastRow key={item.id} item={item} />
      ))}
    </View>
  );
}

const hostStyle = {
  position: "absolute" as const,
  left: 16,
  right: 16,
  gap: 8,
  pointerEvents: "box-none" as const,
};

const createStyles = (colors: ReturnType<typeof useThemeColors>) =>
  StyleSheet.create({
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      minHeight: 56,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: 14,
      backgroundColor: colors.snackbar.background,
      elevation: 8,
    },
    message: {
      flex: 1,
      fontFamily: fonts.bold,
      fontSize: 14,
      lineHeight: 19,
      color: colors.snackbar.text,
    },
  });
