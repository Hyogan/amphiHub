import { StyleSheet, Text } from 'react-native';

import { useThemeColors } from '@/shared/hooks/theme';
import type { Colors } from '@/theme/colors';
import { fonts } from '@/theme/typography';

import { Pressy } from './Pressy';

/** Filter chip. Selected means orange, the colour of "you are here". */
export function Tag({ label, selected, onPress }: { label: string; selected?: boolean; onPress?: () => void }) {
  const colors = useThemeColors();
  const styles = createStyles(colors);
  return (
    <Pressy onPress={onPress} depth={0.93} style={[styles.tag, selected && styles.tagSelected]}>
      <Text style={[styles.text, selected && styles.textSelected]}>{label}</Text>
    </Pressy>
  );
}

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    tag: {
      minHeight: 42,
      paddingHorizontal: 15,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 21,
      borderWidth: 1.5,
      borderColor: colors.border.subtle,
      backgroundColor: colors.background.secondary,
    },
    tagSelected: { backgroundColor: colors.brand.accent, borderColor: colors.brand.accent },
    text: { fontFamily: fonts.bold, fontSize: 14, color: colors.text.primary },
    textSelected: { fontFamily: fonts.extrabold, color: colors.brand.onAccent },
  });
