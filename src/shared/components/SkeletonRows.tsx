import { StyleSheet, View } from 'react-native';

import { useThemeColors } from '@/shared/hooks/theme';
import type { Colors } from '@/theme/colors';

/** Placeholder rows while a list loads. Static: no animation on loading states. */
export function SkeletonRows({ count = 4 }: { count?: number }) {
  const colors = useThemeColors();
  const styles = createStyles(colors);
  return (
    <View style={styles.wrap}>
      {Array.from({ length: count }, (_, i) => (
        <View key={i} style={styles.row}>
          <View style={styles.long} />
          <View style={styles.short} />
        </View>
      ))}
    </View>
  );
}

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    wrap: { gap: 6 },
    row: { gap: 8, paddingVertical: 14, borderTopWidth: 1, borderTopColor: colors.border.subtle },
    long: { height: 14, width: '70%', borderRadius: 6, backgroundColor: colors.border.subtle },
    short: { height: 10, width: '35%', borderRadius: 5, backgroundColor: colors.border.subtle },
  });
