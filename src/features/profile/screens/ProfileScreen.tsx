import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useSignOutMutation } from "@/features/auth/hooks/useAuthMutations";
import { DevPanel } from "@/features/dev/DevPanel";
import { setLanguage, type Language } from "@/i18n";
import { Button } from "@/shared/components/Button";
import { Tag } from "@/shared/components/Tag";
import { useTheme, useThemeColors } from "@/shared/hooks/theme";
import { useAppSelector } from "@/store/hooks";
import type { ThemeMode } from "@/theme/ThemeProvider";
import type { Colors } from "@/theme/colors";
import { fonts } from "@/theme/typography";

import { AcademicProfileSection } from "../components/AcademicProfileSection";

const MODES: ThemeMode[] = ["system", "light", "dark"];

export function ProfileScreen() {
  const colors = useThemeColors();
  const router = useRouter();
  const { mode, setMode } = useTheme();
  const { t, i18n } = useTranslation("profile");
  const { t: tc } = useTranslation();
  const session = useAppSelector((state) => state.session);
  const signOut = useSignOutMutation();
  const styles = createStyles(colors);

  const signedIn = session.status === "signedIn";
  const initials = (session.email ?? "?").slice(0, 2).toUpperCase();

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>{tc("tabs.profile")}</Text>

        {signedIn ? (
          <View style={styles.card}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
            <View style={styles.flex}>
              <Text style={styles.caption}>{t("signedInAs")}</Text>
              <Text style={styles.email} numberOfLines={1}>
                {session.email}
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.guest}>
            <Ionicons
              name="person-circle-outline"
              size={44}
              color={colors.brand.primary}
            />
            <Text style={styles.guestTitle}>{t("guest.title")}</Text>
            <Text style={styles.body}>{t("guest.body")}</Text>
            <Button
              label={t("signUp")}
              onPress={() => router.push("/(auth)/signup")}
            />
            <Button
              label={t("signIn")}
              kind="outline"
              onPress={() => router.push("/(auth)/login")}
            />
          </View>
        )}

        {signedIn && session.userId ? (
          <AcademicProfileSection userId={session.userId} />
        ) : null}

        <Text style={styles.heading}>{t("appearance")}</Text>
        <Text style={styles.caption}>{t("language")}</Text>
        <View style={styles.row}>
          {(["fr", "en"] as Language[]).map((language) => (
            <Tag
              key={language}
              label={language === "fr" ? "Français" : "English"}
              selected={i18n.language === language}
              onPress={() => setLanguage(language)}
            />
          ))}
        </View>
        <View style={styles.row}>
          {MODES.map((m) => (
            <Tag
              key={m}
              label={t(`theme.${m}`)}
              selected={mode === m}
              onPress={() => setMode(m)}
            />
          ))}
        </View>

        {signedIn ? (
          <Button
            label={t("signOut")}
            kind="outline"
            icon="log-out-outline"
            loading={signOut.isPending}
            onPress={() => signOut.mutate()}
          />
        ) : null}

        {__DEV__ ? <DevPanel /> : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    flex: { flex: 1 },
    root: { flex: 1, backgroundColor: colors.background.primary },
    content: { padding: 20, gap: 14, paddingBottom: 32 },
    title: {
      fontFamily: fonts.extrabold,
      fontSize: 26,
      lineHeight: 32,
      color: colors.text.primary,
      letterSpacing: -0.5,
    },
    body: {
      fontFamily: fonts.semibold,
      fontSize: 15,
      lineHeight: 22,
      color: colors.text.secondary,
    },
    caption: {
      fontFamily: fonts.semibold,
      fontSize: 13,
      color: colors.text.secondary,
    },
    heading: {
      fontFamily: fonts.extrabold,
      fontSize: 19,
      color: colors.text.primary,
      marginTop: 12,
    },
    row: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    card: {
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
      padding: 16,
      borderRadius: 20,
      backgroundColor: colors.background.secondary,
      borderWidth: 1,
      borderColor: colors.border.subtle,
    },
    avatar: {
      width: 56,
      height: 56,
      borderRadius: 18,
      backgroundColor: colors.brand.primarySoft,
      alignItems: "center",
      justifyContent: "center",
    },
    avatarText: {
      fontFamily: fonts.black,
      fontSize: 20,
      color: colors.brand.primary,
    },
    email: {
      fontFamily: fonts.extrabold,
      fontSize: 16,
      color: colors.text.primary,
    },
    guest: {
      gap: 12,
      padding: 20,
      borderRadius: 22,
      backgroundColor: colors.background.secondary,
      borderWidth: 1,
      borderColor: colors.border.subtle,
    },
    guestTitle: {
      fontFamily: fonts.extrabold,
      fontSize: 20,
      color: colors.text.primary,
    },
  });
