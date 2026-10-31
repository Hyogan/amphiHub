import { StyleSheet, Text, View } from 'react-native';

import { useThemeColors } from '@/shared/hooks/theme';
import type { Colors } from '@/theme/colors';
import { fonts } from '@/theme/typography';

/**
 * An illustration of the document's first page, built from its details. It is not a real preview:
 * the PDF itself opens in M4. A sheet of paper stays white in dark mode too.
 */
export function PaperPreview({ university, course, title }: { university: string; course: string; title: string }) {
  const colors = useThemeColors();
  const styles = createStyles(colors);
  return (
    <View style={styles.frame}>
      <View style={styles.sheet}>
        <View style={styles.top} />
        <Text style={styles.small} numberOfLines={1}>
          {university}
        </Text>
        <Text style={styles.small} numberOfLines={1}>
          {course}
        </Text>
        <View style={styles.rule} />
        <Text style={styles.heading} numberOfLines={3}>
          {title}
        </Text>
        <View style={styles.long} />
        <View style={styles.short} />
        <View style={styles.long} />
        <View style={styles.short} />
      </View>
    </View>
  );
}

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    frame: { minHeight: 240, borderRadius: 24, backgroundColor: colors.brand.primarySoft, alignItems: 'center', justifyContent: 'center', padding: 22 },
    sheet: { width: '74%', minHeight: 200, backgroundColor: colors.paper.surface, padding: 16, borderRadius: 4, elevation: 5, gap: 6 },
    top: { height: 4, width: '35%', backgroundColor: colors.brand.primary, marginBottom: 8 },
    small: { fontFamily: fonts.bold, fontSize: 9, color: colors.paper.inkMuted, textAlign: 'center' },
    rule: { height: 1, backgroundColor: colors.paper.line, marginVertical: 6 },
    heading: { fontFamily: fonts.extrabold, fontSize: 12, lineHeight: 16, color: colors.paper.ink, marginBottom: 6 },
    long: { height: 3, borderRadius: 2, backgroundColor: colors.paper.line },
    short: { height: 3, width: '66%', borderRadius: 2, backgroundColor: colors.paper.line },
  });
