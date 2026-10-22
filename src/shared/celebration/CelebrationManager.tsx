import { Ionicons } from '@expo/vector-icons';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  FadeOut,
  ZoomIn,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

import { useThemeColors } from '@/shared/hooks/theme';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import type { Colors } from '@/theme/colors';
import { fonts } from '@/theme/typography';

import { celebrationEnded } from './celebrationSlice';

const PIECES = 22;

function Piece({ index, color }: { index: number; color: string }) {
  const t = useSharedValue(0);
  const angle = (index / PIECES) * Math.PI * 2 + (index % 3) * 0.2;
  const distance = 90 + ((index * 37) % 90);
  const size = 7 + (index % 4) * 2;
  useEffect(() => {
    t.value = withDelay((index % 5) * 20, withTiming(1, { duration: 950, easing: Easing.out(Easing.cubic) }));
  }, [t, index]);
  const animated = useAnimatedStyle(() => ({
    opacity: 1 - t.value * t.value,
    transform: [
      { translateX: Math.cos(angle) * distance * t.value },
      { translateY: Math.sin(angle) * distance * t.value - 30 * t.value + 70 * t.value * t.value },
      { rotate: `${t.value * (180 + index * 40)}deg` },
    ],
  }));
  return (
    <Animated.View
      style={[{ position: 'absolute', width: size, height: size * 0.55, borderRadius: 2, backgroundColor: color }, animated]}
    />
  );
}

function Celebration({ id, label }: { id: number; label: string }) {
  const colors = useThemeColors();
  const dispatch = useAppDispatch();
  const { t } = useTranslation();
  const styles = createStyles(colors);
  const palette = [colors.brand.primary, colors.brand.accent, colors.brand.primaryLight, colors.brand.primaryPressed, colors.brand.accentText];

  useEffect(() => {
    const timer = setTimeout(() => dispatch(celebrationEnded(id)), 2100);
    return () => clearTimeout(timer);
  }, [dispatch, id]);

  return (
    <View style={styles.overlay}>
      <View style={styles.center}>
        {Array.from({ length: PIECES }, (_, i) => (
          <Piece key={i} index={i} color={palette[i % palette.length]} />
        ))}
        <Animated.View entering={ZoomIn.springify().damping(9)} exiting={FadeOut.duration(250)} style={styles.badge}>
          <View style={styles.circle}>
            <Ionicons name="checkmark" size={32} color={colors.brand.onAccent} />
          </View>
          <Text style={styles.title}>{t('celebration.title')}</Text>
          <Text style={styles.label}>{label}</Text>
        </Animated.View>
      </View>
    </View>
  );
}

/** Mount once in the root layout, after the ToastManager. */
export function CelebrationManager() {
  const active = useAppSelector((state) => state.celebration.active);
  if (!active) return null;
  return <Celebration key={active.id} id={active.id} label={active.label} />;
}

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    overlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' },
    center: { alignItems: 'center', justifyContent: 'center' },
    badge: {
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 30,
      paddingVertical: 22,
      borderRadius: 26,
      backgroundColor: colors.background.secondary,
      borderWidth: 2,
      borderColor: colors.brand.accent,
      elevation: 12,
    },
    circle: {
      width: 62,
      height: 62,
      borderRadius: 31,
      backgroundColor: colors.brand.accent,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 6,
    },
    title: { fontFamily: fonts.black, fontSize: 24, color: colors.text.primary },
    label: { fontFamily: fonts.semibold, fontSize: 14, color: colors.text.secondary, textAlign: 'center', maxWidth: 200 },
  });
