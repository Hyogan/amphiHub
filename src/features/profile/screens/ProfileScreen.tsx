import { useRef } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import Animated from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import { setLanguage, type Language } from "@/i18n";
import { useCelebrate } from "@/shared/celebration/useCelebrate";
import {
  AppSheet,
  SheetTextInput,
  type SheetHandle,
} from "@/shared/components/AppSheet";
import { Button } from "@/shared/components/Button";
import { Stamp, type VerificationKind } from "@/shared/components/Stamp";
import { Tag } from "@/shared/components/Tag";
import { useTheme, useThemeColors } from "@/shared/hooks/theme";
import { useShake } from "@/shared/motion/hooks";
import { useToast } from "@/shared/toast/useToast";
import type { ThemeMode } from "@/theme/ThemeProvider";
import type { Colors } from "@/theme/colors";
import { fonts } from "@/theme/typography";

const STAMPS: VerificationKind[] = [
  "community",
  "metadata",
  "source",
  "official",
  "correction",
  "ai",
];
const MODES: ThemeMode[] = ["system", "light", "dark"];

/**
 * Temporary: the real profile arrives in M2. The block below is a developer panel that proves the
 * shared pieces work on a device (language, theme, toast, shake, celebration, sheet, stamps).
 * It is deliberately not translated and must be removed before release.
 */
export function ProfileScreen() {
  const colors = useThemeColors();
  const { mode, setMode } = useTheme();
  const { t, i18n } = useTranslation();
  const toast = useToast();
  const celebrate = useCelebrate();
  const shake = useShake();
  const sheet = useRef<SheetHandle>(null);
  const styles = createStyles(colors);

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>{t("tabs.profile")}</Text>
        <Text style={styles.body}>{t("state.comingSoon")}</Text>

        <Text style={styles.heading}>Dev: langue</Text>
        <View style={styles.row}>
          {(["fr", "en"] as Language[]).map((language) => (
            <Tag
              key={language}
              label={language.toUpperCase()}
              selected={i18n.language === language}
              onPress={() => setLanguage(language)}
            />
          ))}
        </View>

        <Text style={styles.heading}>Dev: thème</Text>
        <View style={styles.row}>
          {MODES.map((m) => (
            <Tag
              key={m}
              label={m}
              selected={mode === m}
              onPress={() => setMode(m)}
            />
          ))}
        </View>

        <Text style={styles.heading}>Dev: retours</Text>
        <Button
          label="Toast de succès"
          onPress={() =>
            toast.success("Document enregistré dans ta bibliothèque.")
          }
        />
        <Button
          label="Toast d’erreur"
          kind="outline"
          onPress={() => toast.error("Téléchargement interrompu.")}
        />
        <Button
          label="Fêter une réussite"
          kind="accent"
          icon="trophy-outline"
          onPress={() => celebrate("Objectif atteint")}
        />
        <Animated.View style={shake.style}>
          <View style={styles.shakeBox}>
            <Text style={styles.body}>Cette zone se secoue.</Text>
          </View>
        </Animated.View>
        <Button label="Secouer" kind="text" onPress={shake.shake} />

        <Text style={styles.heading}>Dev: feuille</Text>
        <Button
          label="Ouvrir la feuille"
          kind="outline"
          icon="layers-outline"
          onPress={() => sheet.current?.open()}
        />

        <Text style={styles.heading}>Dev: labels</Text>
        {STAMPS.map((kind) => (
          <Stamp key={kind} kind={kind} />
        ))}
      </ScrollView>

      <AppSheet ref={sheet}>
        <Text style={styles.heading}>Feuille de test</Text>
        <Text style={styles.body}>
          Glisse vers le bas pour la réduire ou la fermer. Le champ ci-dessous
          teste le clavier.
        </Text>
        <SheetTextInput
          placeholder="Écris quelque chose"
          placeholderTextColor={colors.text.secondary}
          style={styles.input}
          cursorColor={colors.brand.primary}
        />
        <Button label="Fermer" onPress={() => sheet.current?.close()} />
      </AppSheet>
    </SafeAreaView>
  );
}

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.background.primary },
    content: { padding: 20, gap: 12 },
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
    heading: {
      fontFamily: fonts.extrabold,
      fontSize: 17,
      color: colors.text.primary,
      marginTop: 12,
    },
    row: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    shakeBox: {
      padding: 16,
      borderRadius: 14,
      backgroundColor: colors.status.errorSoft,
    },
    input: {
      height: 52,
      paddingHorizontal: 14,
      borderRadius: 14,
      borderWidth: 1.5,
      borderColor: colors.border.default,
      backgroundColor: colors.background.secondary,
      fontFamily: fonts.semibold,
      fontSize: 16,
      color: colors.text.primary,
    },
  });
