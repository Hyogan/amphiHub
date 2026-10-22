import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useThemeColors } from '@/shared/hooks/theme';
import type { Colors } from '@/theme/colors';
import { fonts } from '@/theme/typography';

/** Temporary screen body for tabs that are built in later milestones. */
export function PlaceholderScreen({ title, children }: { title: string; children?: ReactNode }) {
  const colors = useThemeColors();
  const { t } = useTranslation();
  const styles = createStyles(colors);
  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.body}>{t('state.comingSoon')}</Text>
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.background.primary },
    content: { padding: 20, gap: 14 },
    title: { fontFamily: fonts.extrabold, fontSize: 26, lineHeight: 32, color: colors.text.primary, letterSpacing: -0.5 },
    body: { fontFamily: fonts.semibold, fontSize: 15, lineHeight: 22, color: colors.text.secondary },
  });
