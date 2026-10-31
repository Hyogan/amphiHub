import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text, View } from "react-native";
import Animated, {
  cancelAnimation,
  Easing,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
  ZoomIn
} from "react-native-reanimated";

import { useThemeColors } from "@/shared/hooks/theme";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import type { Colors } from "@/theme/colors";
import { fonts } from "@/theme/typography";

import { celebrationEnded } from "./celebrationSlice";

const PIECES = 10;
const CONFETTI_SIZE = 260;
const CONFETTI_RADIUS = 105;
const CELEBRATION_DURATION = 1600;

function Piece({ index, color }: { index: number; color: string }) {
  const progress = useSharedValue(0);

  const angle = (index / PIECES) * Math.PI * 2 + (index % 3) * 0.2;

  const distance = CONFETTI_RADIUS + ((index * 19) % 45);
  const size = 8 + (index % 3) * 2;

  useEffect(() => {
    progress.value = withDelay(
      (index % 3) * 15,
      withTiming(1, {
        duration: 650,
        easing: Easing.out(Easing.quad),
      }),
    );

    return () => {
      cancelAnimation(progress);
    };
  }, [progress, index]);

  const animatedStyle = useAnimatedStyle(() => {
    const t = progress.value;

    return {
      opacity: 1 - t,
      transform: [
        { translateX: Math.cos(angle) * distance * t },
        {
          translateY: Math.sin(angle) * distance * t + 45 * t * t - 25 * t,
        },
        {
          rotate: `${t * (220 + index * 20)}deg`,
        },
        { scale: 1 - t * 0.25 },
      ],
    };
  });

  return (
    <Animated.View
      style={[
        styles.piece,
        {
          width: size,
          height: size * 0.6,
          backgroundColor: color,
        },
        animatedStyle,
      ]}
    />
  );
}

function Celebration({ id, label }: { id: number; label: string }) {
  const colors = useThemeColors();
  const dispatch = useAppDispatch();
  const { t } = useTranslation();

  const styles = useMemo(() => createStyles(colors), [colors]);

  const palette = [
    colors.brand.primary,
    colors.brand.accent,
    colors.brand.primaryLight,
    colors.brand.primaryPressed,
    colors.brand.accentText,
  ];

  useEffect(() => {
    const timer = setTimeout(() => {
      dispatch(celebrationEnded(id));
    }, CELEBRATION_DURATION);

    return () => clearTimeout(timer);
  }, [dispatch, id]);

  return (
    <View style={styles.overlay} pointerEvents="none">
      <View style={styles.center}>
        {Array.from({ length: PIECES }, (_, index) => (
          <Piece
            key={index}
            index={index}
            color={palette[index % palette.length]}
          />
        ))}

        <Animated.View
          entering={ZoomIn.springify().damping(10).stiffness(220)}
          exiting={FadeOut.duration(200)}
          style={styles.badge}
        >
          <View style={styles.circle}>
            <Ionicons
              name="checkmark"
              size={28}
              color={colors.brand.onAccent}
            />
          </View>

          <Text style={styles.title}>{t("celebration.title")}</Text>

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

const styles = StyleSheet.create({
  piece: {
    position: "absolute",
    borderRadius: 2,
  },
});

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    overlay: {
      position: "absolute",
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
      alignItems: "center",
      justifyContent: "center",
      zIndex: 9999,
    },

    center: {
      width: CONFETTI_SIZE,
      height: CONFETTI_SIZE,
      alignItems: "center",
      justifyContent: "center",
    },

    badge: {
      alignItems: "center",
      gap: 3,
      paddingHorizontal: 24,
      paddingVertical: 17,
      borderRadius: 22,
      backgroundColor: colors.background.secondary,
      borderWidth: 1,
      borderColor: colors.brand.accent,
      elevation: 8,
    },

    circle: {
      width: 54,
      height: 54,
      borderRadius: 27,
      backgroundColor: colors.brand.accent,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 4,
    },

    title: {
      fontFamily: fonts.black,
      fontSize: 21,
      color: colors.text.primary,
    },

    label: {
      fontFamily: fonts.semibold,
      fontSize: 13,
      color: colors.text.secondary,
      textAlign: "center",
      maxWidth: 190,
    },
  });
