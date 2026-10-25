import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrandLogo } from '@/shared/components/BrandLogo';
import { Pressy } from '@/shared/components/Pressy';
import { useThemeColors } from '@/shared/hooks/theme';
import type { Colors } from '@/theme/colors';
import { fonts } from '@/theme/typography';

/** Shared frame for the sign-in family of screens: back button, logo, title, subtitle, then the form. */
export function AuthScreenLayout({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  const colors = useThemeColors();
  const router = useRouter();
  const { t } = useTranslation();
  const styles = createStyles(colors);

  const close = () => (router.canGoBack() ? router.back() : router.replace('/(tabs)'));

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={styles.top}>
          <Pressy label={t('actions.back')} onPress={close} style={styles.back}>
            <Ionicons name="arrow-back" size={24} color={colors.icon.primary} />
          </Pressy>
          <BrandLogo layout="horizontal" width={150} />
        </View>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
        <View style={styles.form}>{children}</View>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.background.primary },
    content: { paddingHorizontal: 24, paddingBottom: 32, gap: 12 },
    top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 64, marginLeft: -12 },
    back: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
    title: { fontFamily: fonts.black, fontSize: 32, lineHeight: 38, color: colors.text.primary, letterSpacing: -1, marginTop: 8 },
    subtitle: { fontFamily: fonts.semibold, fontSize: 16, lineHeight: 24, color: colors.text.secondary },
    form: { gap: 18, marginTop: 14 },
  });
