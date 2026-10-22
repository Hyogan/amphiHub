import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { setLanguage, type Language } from '@/i18n';
import { Button } from '@/shared/components/Button';
import { Tag } from '@/shared/components/Tag';
import { useThemeColors } from '@/shared/hooks/theme';
import { useAppDispatch } from '@/store/hooks';
import { onboardingCompleted, persistOnboardingSeen } from '@/store/preferencesSlice';
import type { Colors } from '@/theme/colors';
import { fonts } from '@/theme/typography';

export function OnboardingScreen() {
  const colors = useThemeColors();
  const dispatch = useAppDispatch();
  const { t, i18n } = useTranslation('onboarding');
  const styles = createStyles(colors);

  const start = () => {
    persistOnboardingSeen();
    // The root layout reacts to this and moves to the tabs. We do not navigate here.
    dispatch(onboardingCompleted());
  };

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <View style={styles.top}>
        <View style={styles.logoTile}>
          <Ionicons name="school" size={30} color={colors.interactive.onPrimary} />
        </View>
        <Text style={styles.wordmark}>
          <Text style={{ color: colors.brand.primary }}>amphi</Text>
          <Text style={{ color: colors.brand.accent }}>Hub</Text>
        </Text>
      </View>

      <View style={styles.middle}>
        <Text style={styles.eyebrow}>{t('eyebrow')}</Text>
        <Text style={styles.title}>{t('title')}</Text>
        <Text style={styles.body}>{t('body')}</Text>

        <Text style={styles.label}>{t('language')}</Text>
        <View style={styles.row}>
          {(['fr', 'en'] as Language[]).map((language) => (
            <Tag key={language} label={language === 'fr' ? 'Français' : 'English'} selected={i18n.language === language} onPress={() => setLanguage(language)} />
          ))}
        </View>
      </View>

      <View style={styles.bottom}>
        <Text style={styles.note}>{t('guestNote')}</Text>
        <Button label={t('actions.start', { ns: 'common' })} icon="arrow-forward" onPress={start} />
      </View>
    </SafeAreaView>
  );
}

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.background.primary, paddingHorizontal: 24 },
    top: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: 20 },
    logoTile: { width: 52, height: 52, borderRadius: 16, backgroundColor: colors.interactive.primary, alignItems: 'center', justifyContent: 'center' },
    wordmark: { fontFamily: fonts.black, fontSize: 28, letterSpacing: -0.8 },
    middle: { flex: 1, justifyContent: 'center', gap: 14 },
    eyebrow: { fontFamily: fonts.extrabold, fontSize: 15, color: colors.brand.accentText },
    title: { fontFamily: fonts.black, fontSize: 36, lineHeight: 41, color: colors.text.primary, letterSpacing: -1.2 },
    body: { fontFamily: fonts.semibold, fontSize: 16, lineHeight: 24, color: colors.text.secondary },
    label: { fontFamily: fonts.extrabold, fontSize: 15, color: colors.text.primary, marginTop: 12 },
    row: { flexDirection: 'row', gap: 8 },
    bottom: { gap: 14, paddingBottom: 12 },
    note: { fontFamily: fonts.semibold, fontSize: 13, lineHeight: 19, color: colors.text.secondary },
  });
