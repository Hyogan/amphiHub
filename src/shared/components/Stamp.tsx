import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';

import { useThemeColors } from '@/shared/hooks/theme';
import type { Colors } from '@/theme/colors';
import { fonts } from '@/theme/typography';

export type VerificationKind = 'community' | 'metadata' | 'source' | 'official' | 'correction' | 'ai';

type IconName = ComponentProps<typeof Ionicons>['name'];

/** Separate attributes, never one status. Always icon plus text, never colour alone. */
export function getVerificationConfig(kind: VerificationKind, colors: Colors) {
  const map: Record<VerificationKind, { icon: IconName; color: string; dashed: boolean }> = {
    community: { icon: 'people-outline', color: colors.status.neutral, dashed: false },
    metadata: { icon: 'checkmark-done-outline', color: colors.status.info, dashed: false },
    source: { icon: 'link-outline', color: colors.status.info, dashed: false },
    official: { icon: 'shield-checkmark-outline', color: colors.status.success, dashed: false },
    correction: { icon: 'create-outline', color: colors.status.error, dashed: false },
    ai: { icon: 'sparkles-outline', color: colors.status.neutral, dashed: true },
  };
  return map[kind];
}

export function Stamp({ kind }: { kind: VerificationKind }) {
  const colors = useThemeColors();
  const { t } = useTranslation('verification');
  const styles = createStyles();
  const config = getVerificationConfig(kind, colors);
  return (
    <View style={[styles.stamp, { borderColor: config.color, borderStyle: config.dashed ? 'dashed' : 'solid' }]}>
      <Ionicons name={config.icon} size={14} color={config.color} />
      <Text style={[styles.text, { color: config.color }]}>{t(`${kind}.label`)}</Text>
    </View>
  );
}

const createStyles = () =>
  StyleSheet.create({
    stamp: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      gap: 5,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 7,
      borderWidth: 1.5,
    },
    text: { fontFamily: fonts.bold, fontSize: 12 },
  });
