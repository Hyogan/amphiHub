import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useThemeColors } from '@/shared/hooks/theme';
import type { Colors } from '@/theme/colors';
import { fonts } from '@/theme/typography';

/** Never a blank screen: a sheet of paper with a red-pen circle, a title, a hint and the next step. */
export function EmptyState({ title, body, children }: { title: string; body?: string; children?: ReactNode }) {
  const colors = useThemeColors();
  const styles = createStyles(colors);
  return (
    <View style={styles.wrap}>
      <View style={styles.sheet}>
        {[0, 1, 2, 3, 4].map((i) => (
          <View key={i} style={styles.line} />
        ))}
        <View style={styles.circle} />
      </View>
      <Text style={styles.title}>{title}</Text>
      {body ? <Text style={styles.body}>{body}</Text> : null}
      {children ? <View style={styles.actions}>{children}</View> : null}
    </View>
  );
}

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    wrap: { alignItems: 'center', gap: 12, paddingVertical: 28, paddingHorizontal: 8 },
    sheet: { width: 112, height: 140, borderRadius: 8, backgroundColor: colors.paper.surface, borderWidth: 1, borderColor: colors.paper.line, paddingTop: 22, paddingHorizontal: 14, gap: 14, marginBottom: 6 },
    line: { height: 1, backgroundColor: colors.paper.line },
    circle: { position: 'absolute', right: -14, top: 38, width: 62, height: 62, borderRadius: 31, borderWidth: 3, borderColor: colors.status.error },
    title: { fontFamily: fonts.extrabold, fontSize: 20, lineHeight: 26, color: colors.text.primary, textAlign: 'center' },
    body: { fontFamily: fonts.semibold, fontSize: 15, lineHeight: 22, color: colors.text.secondary, textAlign: 'center' },
    actions: { alignSelf: 'stretch', gap: 8, marginTop: 6 },
  });
