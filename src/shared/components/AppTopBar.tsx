import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';

import { useThemeColors } from '@/shared/hooks/theme';
import type { Colors } from '@/theme/colors';
import { fonts } from '@/theme/typography';

import { BrandMark } from './BrandMark';
import { Pressy } from './Pressy';
import { Wordmark } from './Wordmark';

/** The branded header for tab screens: mark, name, tagline, and a shortcut to the profile. */
export function AppTopBar() {
  const colors = useThemeColors();
  const router = useRouter();
  const { t } = useTranslation();
  const styles = createStyles(colors);
  return (
    <View style={styles.row}>
      <BrandMark size={46} />
      <View style={styles.names}>
        <Wordmark height={24} />
        <Text style={styles.tagline}>{t('app.tagline')}</Text>
      </View>
      <Pressy label={t('tabs.profile')} onPress={() => router.navigate('/profile')} style={styles.avatar}>
        <Ionicons name="person-outline" size={22} color={colors.brand.primary} />
      </Pressy>
    </View>
  );
}

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    row: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 64 },
    names: { flex: 1, gap: 2 },
    tagline: { fontFamily: fonts.semibold, fontSize: 12, color: colors.text.secondary },
    avatar: {
      width: 44,
      height: 44,
      borderRadius: 14,
      backgroundColor: colors.brand.primarySoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
