import { Ionicons } from '@expo/vector-icons';
import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useThemeColors } from '@/shared/hooks/theme';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fonts } from '@/theme/typography';

import { removeToast, type ToastItem } from './toastSlice';

const ICONS = {
  success: 'checkmark-circle',
  error: 'alert-circle',
  info: 'information-circle',
  warning: 'warning',
} as const;

function ToastRow({ item }: { item: ToastItem }) {
  const colors = useThemeColors();
  const dispatch = useAppDispatch();
  const styles = createStyles(colors);

  useEffect(() => {
    const timer = setTimeout(() => dispatch(removeToast(item.id)), item.duration);
    return () => clearTimeout(timer);
  }, [dispatch, item.id, item.duration]);

  return (
    <Animated.View entering={FadeInDown.springify().damping(14)} exiting={FadeOutDown.duration(200)} style={styles.row}>
      <Ionicons name={ICONS[item.variant]} size={21} color={colors.snackbar[item.variant]} />
      <Text style={styles.message}>{item.message}</Text>
      <Pressable accessibilityRole="button" accessibilityLabel="Fermer" hitSlop={10} onPress={() => dispatch(removeToast(item.id))}>
        <Ionicons name="close" size={18} color={colors.snackbar.text} />
      </Pressable>
    </Animated.View>
  );
}

/**
 * Mount once in the root layout. Snackbars sit at the bottom.
 * Screens with a dock pass bottomOffset so toasts clear it.
 */
export function ToastManager({ bottomOffset = 16 }: { bottomOffset?: number }) {
  const items = useAppSelector((state) => state.toast.items);
  const insets = useSafeAreaInsets();
  if (items.length === 0) return null;
  return (
    <View style={[hostStyle, { bottom: insets.bottom + bottomOffset }]}>
      {items.map((item) => (
        <ToastRow key={item.id} item={item} />
      ))}
    </View>
  );
}

const hostStyle = {
  position: 'absolute' as const,
  left: 16,
  right: 16,
  gap: 8,
  pointerEvents: 'box-none' as const,
};

const createStyles = (colors: ReturnType<typeof useThemeColors>) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      minHeight: 56,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: 14,
      backgroundColor: colors.snackbar.background,
      elevation: 8,
    },
    message: { flex: 1, fontFamily: fonts.bold, fontSize: 14, lineHeight: 19, color: colors.snackbar.text },
  });
