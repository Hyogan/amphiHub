import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/shared/components/Button';
import { SkeletonRows } from '@/shared/components/SkeletonRows';
import { useThemeColors } from '@/shared/hooks/theme';
import type { Colors } from '@/theme/colors';
import { fonts } from '@/theme/typography';

import { useProfileQuery } from '../hooks/useProfile';
import { AcademicProfileForm } from './AcademicProfileForm';

/** Loads the signed-in user's profile and shows the academic form, with loading and error states. */
export function AcademicProfileSection({ userId }: { userId: string }) {
  const colors = useThemeColors();
  const { t } = useTranslation('profile');
  const { t: tc } = useTranslation();
  const profile = useProfileQuery(userId);
  const styles = createStyles(colors);

  if (profile.isPending) return <SkeletonRows count={3} />;
  if (profile.isError || !profile.data) {
    return (
      <View style={styles.error}>
        <Text style={styles.errorText}>{t('academic.loadError')}</Text>
        <Button label={tc('actions.retry')} kind="outline" onPress={() => profile.refetch()} />
      </View>
    );
  }
  // The key resets the form's draft if the account changes.
  return <AcademicProfileForm key={profile.data.id} profile={profile.data} />;
}

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    error: { gap: 12, padding: 16, borderRadius: 18, backgroundColor: colors.status.errorSoft },
    errorText: { fontFamily: fonts.bold, fontSize: 15, color: colors.text.primary },
  });
