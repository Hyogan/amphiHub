import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { useThemeColors } from '@/shared/hooks/theme';
import type { Colors } from '@/theme/colors';
import { fonts } from '@/theme/typography';

import { shortYear } from '../types/resource';
import { getResourceAccent } from '../utils/accent';

/** A small sheet of paper: the year on top, a PDF badge, and a red dot when a correction exists. */
export function FileTile({ typeCode, academicYear, hasCorrection }: { typeCode: string; academicYear: string | null; hasCorrection: boolean }) {
  const colors = useThemeColors();
  const accent = getResourceAccent(typeCode, colors);
  const year = shortYear(academicYear);
  const styles = createStyles(colors);
  return (
    <View style={[styles.tile, { backgroundColor: accent.background }]}>
      {year ? (
        <Text style={[styles.year, { color: accent.foreground }]}>{year}</Text>
      ) : (
        <Ionicons name="document-text-outline" size={20} color={accent.foreground} />
      )}
      <View style={[styles.line, { backgroundColor: accent.foreground }]} />
      <View style={[styles.lineShort, { backgroundColor: accent.foreground }]} />
      <View style={styles.pdf}>
        <Text style={styles.pdfText}>PDF</Text>
      </View>
      {hasCorrection ? (
        <View style={styles.dot}>
          <Ionicons name="checkmark" size={11} color={colors.interactive.onPrimary} />
        </View>
      ) : null}
    </View>
  );
}

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    tile: { width: 62, height: 78, borderRadius: 13, padding: 9, gap: 5 },
    year: { fontFamily: fonts.black, fontSize: 15, letterSpacing: -0.3, marginBottom: 2 },
    line: { height: 3, borderRadius: 2, opacity: 0.35 },
    lineShort: { height: 3, width: '60%', borderRadius: 2, opacity: 0.35 },
    pdf: { position: 'absolute', bottom: 6, right: 6, backgroundColor: colors.paper.surface, borderRadius: 5, paddingHorizontal: 5, paddingVertical: 2 },
    pdfText: { fontFamily: fonts.black, fontSize: 9, color: colors.status.error },
    dot: {
      position: 'absolute',
      top: -6,
      right: -6,
      width: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: colors.status.error,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: colors.background.primary,
    },
  });
