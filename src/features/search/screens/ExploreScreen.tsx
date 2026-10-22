import { useTranslation } from 'react-i18next';
import { StyleSheet, Text } from 'react-native';

import { PlaceholderScreen } from '@/shared/components/PlaceholderScreen';
import { useThemeColors } from '@/shared/hooks/theme';
import { useDebouncedValue } from '@/shared/hooks/useDebouncedValue';
import { useAppSelector } from '@/store/hooks';
import { fonts } from '@/theme/typography';

export function ExploreScreen() {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const query = useAppSelector((state) => state.dock.query);
  // The debounced value is what will reach the query key once search exists.
  const debounced = useDebouncedValue(query.trim(), 350);
  return (
    <PlaceholderScreen title={t('tabs.explore')}>
      {debounced ? (
        <Text style={[styles.query, { color: colors.text.primary }]}>{t('search.resultsFor', { query: debounced })}</Text>
      ) : null}
    </PlaceholderScreen>
  );
}

const styles = StyleSheet.create({ query: { fontFamily: fonts.bold, fontSize: 16 } });
