import { Ionicons } from '@expo/vector-icons';
import { useEffect } from 'react';
import { StyleSheet, Text } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { useThemeColors } from '@/shared/hooks/theme';
import { useShake } from '@/shared/motion/hooks';
import type { Colors } from '@/theme/colors';
import { fonts } from '@/theme/typography';

/**
 * A message the whole form failed with (not one field). A new message shakes it.
 * The entering animation and the shake live on separate views, so they never fight over transform.
 */
export function ErrorBanner({ message }: { message: string | null }) {
  const colors = useThemeColors();
  const shake = useShake();
  const styles = createStyles(colors);

  useEffect(() => {
    if (message) shake.shake();
    // Only a new message should shake the banner.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [message]);

  if (!message) return null;
  return (
    <Animated.View entering={FadeIn.duration(180)}>
      <Animated.View style={[styles.banner, shake.style]}>
        <Ionicons name="alert-circle" size={20} color={colors.status.error} />
        <Text style={styles.text}>{message}</Text>
      </Animated.View>
    </Animated.View>
  );
}

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    banner: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 14, borderRadius: 14, backgroundColor: colors.status.errorSoft },
    text: { flex: 1, fontFamily: fonts.bold, fontSize: 14, lineHeight: 20, color: colors.text.primary },
  });
