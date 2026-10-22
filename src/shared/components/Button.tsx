import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { ActivityIndicator, StyleSheet, Text } from 'react-native';

import { useThemeColors } from '@/shared/hooks/theme';
import type { Colors } from '@/theme/colors';
import { fonts } from '@/theme/typography';

import { Pressy, Tap } from './Pressy';

export type ButtonKind = 'primary' | 'accent' | 'outline' | 'danger' | 'text';

interface ButtonProps {
  label: string;
  kind?: ButtonKind;
  icon?: ComponentProps<typeof Ionicons>['name'];
  loading?: boolean;
  disabled?: boolean;
  onPress?: () => void;
}

function getButtonLook(kind: ButtonKind, colors: Colors) {
  const map: Record<ButtonKind, { background: string; foreground: string; border: string }> = {
    primary: { background: colors.interactive.primary, foreground: colors.interactive.onPrimary, border: colors.interactive.primary },
    accent: { background: colors.brand.accent, foreground: colors.brand.onAccent, border: colors.brand.accent },
    outline: { background: 'transparent', foreground: colors.text.primary, border: colors.text.primary },
    danger: { background: colors.status.error, foreground: colors.text.inverse, border: colors.status.error },
    text: { background: 'transparent', foreground: colors.text.link, border: 'transparent' },
  };
  return map[kind];
}

export function Button({ label, kind = 'primary', icon, loading, disabled, onPress }: ButtonProps) {
  const colors = useThemeColors();
  const styles = createStyles();
  const look = getButtonLook(kind, colors);

  if (kind === 'text') {
    return (
      <Tap onPress={onPress} style={styles.textButton}>
        <Text style={[styles.label, styles.underline, { color: disabled ? colors.text.disabled : look.foreground }]}>{label}</Text>
      </Tap>
    );
  }

  const background = disabled ? colors.interactive.disabled : look.background;
  const foreground = disabled ? colors.text.disabled : look.foreground;
  return (
    <Pressy
      onPress={onPress}
      disabled={disabled || loading}
      style={[styles.button, { backgroundColor: background, borderColor: disabled ? background : look.border }]}>
      {loading ? <ActivityIndicator size="small" color={foreground} /> : icon ? <Ionicons name={icon} size={19} color={foreground} /> : null}
      <Text style={[styles.label, { color: foreground }]}>{label}</Text>
    </Pressy>
  );
}

const createStyles = () =>
  StyleSheet.create({
    button: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 9,
      minHeight: 54,
      paddingHorizontal: 20,
      borderRadius: 16,
      borderWidth: 2,
    },
    textButton: { minHeight: 46, paddingHorizontal: 8, alignItems: 'center', justifyContent: 'center' },
    label: { fontFamily: fonts.extrabold, fontSize: 16 },
    underline: { textDecorationLine: 'underline' },
  });
