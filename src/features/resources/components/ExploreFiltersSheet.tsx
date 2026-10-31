import type { Ref } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Switch, Text, View } from 'react-native';

import { AppSheet, type SheetHandle } from '@/shared/components/AppSheet';
import { Button } from '@/shared/components/Button';
import { Tag } from '@/shared/components/Tag';
import { useThemeColors } from '@/shared/hooks/theme';
import type { Colors } from '@/theme/colors';
import { fonts } from '@/theme/typography';

import { ACADEMIC_YEARS, FILTER_LEVELS } from '../utils/academicYears';

export interface ExploreFilters {
  level: string | null;
  year: string | null;
  hasCorrection: boolean;
  mine: boolean;
}

export const EMPTY_FILTERS: ExploreFilters = { level: null, year: null, hasCorrection: false, mine: false };

export function countActiveFilters(f: ExploreFilters): number {
  return [f.level, f.year, f.hasCorrection || null, f.mine || null].filter(Boolean).length;
}

/** Filters apply as you change them. "Voir les résultats" only closes the sheet. */
export function ExploreFiltersSheet({
  ref,
  filters,
  onChange,
  canFilterMine,
  total,
  onApply,
}: {
  ref: Ref<SheetHandle>;
  filters: ExploreFilters;
  onChange: (next: ExploreFilters) => void;
  /** The "my university" filter needs a signed-in user with a university in their profile. */
  canFilterMine: boolean;
  total: number;
  onApply: () => void;
}) {
  const colors = useThemeColors();
  const { t } = useTranslation('resources');
  const styles = createStyles(colors);
  const switchColors = { false: colors.border.default, true: colors.interactive.primary };

  return (
    <AppSheet ref={ref}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('explore.filters')}</Text>
        <Button label={t('explore.reset')} kind="text" onPress={() => onChange(EMPTY_FILTERS)} />
      </View>

      <Text style={styles.label}>{t('explore.level')}</Text>
      <View style={styles.row}>
        {FILTER_LEVELS.map((level) => (
          <Tag key={level} label={level} selected={filters.level === level} onPress={() => onChange({ ...filters, level: filters.level === level ? null : level })} />
        ))}
      </View>

      <Text style={styles.label}>{t('explore.year')}</Text>
      <View style={styles.row}>
        {ACADEMIC_YEARS.map((year) => (
          <Tag key={year} label={year} selected={filters.year === year} onPress={() => onChange({ ...filters, year: filters.year === year ? null : year })} />
        ))}
      </View>

      <View style={styles.switchRow}>
        <View style={styles.flex}>
          <Text style={styles.switchTitle}>{t('explore.onlyCorrected')}</Text>
          <Text style={styles.hint}>{t('explore.onlyCorrectedHint')}</Text>
        </View>
        <Switch value={filters.hasCorrection} onValueChange={(value) => onChange({ ...filters, hasCorrection: value })} trackColor={switchColors} thumbColor={colors.background.secondary} />
      </View>

      {canFilterMine ? (
        <View style={styles.switchRow}>
          <Text style={[styles.switchTitle, styles.flex]}>{t('explore.mine')}</Text>
          <Switch value={filters.mine} onValueChange={(value) => onChange({ ...filters, mine: value })} trackColor={switchColors} thumbColor={colors.background.secondary} />
        </View>
      ) : null}

      <Button label={`${t('explore.apply')} (${total})`} onPress={onApply} />
    </AppSheet>
  );
}

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    flex: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    title: { fontFamily: fonts.extrabold, fontSize: 22, color: colors.text.primary, letterSpacing: -0.3 },
    label: { fontFamily: fonts.extrabold, fontSize: 15, color: colors.text.primary, marginTop: 6 },
    row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    switchRow: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 56 },
    switchTitle: { fontFamily: fonts.bold, fontSize: 16, color: colors.text.primary },
    hint: { fontFamily: fonts.semibold, fontSize: 13, color: colors.text.secondary },
  });
