import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text, View } from "react-native";
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSequence,
    withTiming,
} from "react-native-reanimated";

import { Pressy } from "@/shared/components/Pressy";
import { useThemeColors } from "@/shared/hooks/theme";
import { heroGradient, type Colors } from "@/theme/colors";
import { fonts } from "@/theme/typography";

/** The one thing on the home screen that moves on its own: a gently bobbing book. */
function BookArt({ colors }: { colors: Colors }) {
  const styles = createStyles(colors);
  const lift = useSharedValue(0);
  useEffect(() => {
    lift.value = withRepeat(
      withSequence(
        withTiming(-6, { duration: 1400, easing: Easing.inOut(Easing.quad) }),
        withTiming(0, { duration: 1400, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
    );
  }, [lift]);
  const bob = useAnimatedStyle(() => ({
    transform: [{ translateY: lift.value }],
  }));
  return (
    <Animated.View style={[styles.art, bob]}>
      <View style={styles.pages} />
      <View style={styles.cover}>
        <View style={styles.spine} />
        <View style={styles.lines}>
          <View style={styles.line} />
          <View style={[styles.line, styles.lineShort]} />
        </View>
      </View>
      <View style={styles.check}>
        <Ionicons name="checkmark" size={18} color={colors.brand.primary} />
      </View>
    </Animated.View>
  );
}

export function Hero({ onExplore }: { onExplore: () => void }) {
  const colors = useThemeColors();
  const { t } = useTranslation("home");
  const styles = createStyles(colors);
  return (
    <LinearGradient
      colors={heroGradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.hero}
    >
      <View style={styles.text}>
        <Text style={styles.eyebrow}>{t("hero.eyebrow")}</Text>
        <Text style={styles.title}>{t("hero.title")}</Text>
        <Text style={styles.description}>{t("hero.description")}</Text>
        <Pressy label={t("hero.cta")} onPress={onExplore} style={styles.button}>
          <Text style={styles.buttonLabel}>{t("hero.cta")}</Text>
          <Ionicons name="arrow-forward" size={18} color={colors.paper.ink} />
        </Pressy>
      </View>
      <BookArt colors={colors} />
    </LinearGradient>
  );
}

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    hero: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      borderRadius: 28,
      padding: 20,
      overflow: "hidden",
    },
    text: { flex: 1, gap: 8 },
    eyebrow: {
      fontFamily: fonts.extrabold,
      fontSize: 13,
      color: colors.brand.accent,
    },
    title: {
      fontFamily: fonts.extrabold,
      fontSize: 30,
      lineHeight: 34,
      letterSpacing: -0.6,
      color: colors.chrome.text,
    },
    description: {
      fontFamily: fonts.semibold,
      fontSize: 14,
      lineHeight: 20,
      color: colors.chrome.textMuted,
    },
    button: {
      flexDirection: "row",
      alignItems: "center",
      alignSelf: "flex-start",
      gap: 8,
      minHeight: 50,
      marginTop: 8,
      paddingHorizontal: 18,
      borderRadius: 16,
      backgroundColor: colors.paper.surface,
    },
    buttonLabel: {
      fontFamily: fonts.extrabold,
      fontSize: 15,
      color: colors.paper.ink,
    },
    art: { width: 84, height: 104 },
    pages: {
      position: "absolute",
      top: 6,
      left: 8,
      width: 72,
      height: 94,
      borderRadius: 10,
      backgroundColor: colors.paper.surface,
    },
    cover: {
      position: "absolute",
      top: 0,
      left: 0,
      width: 72,
      height: 94,
      flexDirection: "row",
      borderRadius: 10,
      overflow: "hidden",
      backgroundColor: colors.brand.accent,
    },
    spine: { width: 10, backgroundColor: colors.brand.accentText },
    lines: { flex: 1, justifyContent: "center", gap: 8, paddingHorizontal: 10 },
    line: {
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.brand.onAccent,
    },
    lineShort: { width: "60%" },
    check: {
      position: "absolute",
      right: 0,
      bottom: 0,
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.paper.surface,
    },
  });
