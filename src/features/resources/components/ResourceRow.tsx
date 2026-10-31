import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';

import { Pressy } from '@/shared/components/Pressy';
import { Stamp } from '@/shared/components/Stamp';
import { useThemeColors } from '@/shared/hooks/theme';
import type { Colors } from '@/theme/colors';
import { fonts } from '@/theme/typography';

import { useResourceTypeLabel } from '../hooks/useResources';
import { getVerificationKinds, type ResourceSummary } from '../types/resource';
import { formatFileSize } from '../utils/format';
import { FileTile } from './FileTile';

/** One document in a list: file tile, title, course, university, verification stamps, size and correction. */
export function ResourceRow({ item, trailing }: { item: ResourceSummary; trailing?: ReactNode }) {
  const colors = useThemeColors();
  const router = useRouter();
  const { t, i18n } = useTranslation('resources');
  const typeLabel = useResourceTypeLabel();
  const styles = createStyles(colors);

  const session = item.examSession ? t(`session.${item.examSession}`) : null;
  const meta = [item.courseCode, session].filter(Boolean).join(', ');
  const kicker = [typeLabel(item.typeCode), item.academicYear].filter(Boolean).join(', ');
  const fileInfo =
    item.sizeBytes !== null
      ? `${formatFileSize(item.sizeBytes, i18n.language)}${item.pageCount ? `, ${item.pageCount} p.` : ''}`
      : null;

  return (
    <Pressy onPress={() => router.push({ pathname: '/resource/[id]', params: { id: item.id } })} depth={0.98} style={styles.row}>
      <FileTile typeCode={item.typeCode} academicYear={item.academicYear} hasCorrection={item.hasCorrection} />
      <View style={styles.body}>
        <Text style={styles.kicker}>{kicker}</Text>
        <Text style={styles.title} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={styles.meta} numberOfLines={1}>
          {item.courseName}
          {meta ? `, ${meta}` : ''}
        </Text>
        <Text style={styles.university} numberOfLines={1}>
          {item.universityName}
        </Text>
        <View style={styles.stamps}>
          {getVerificationKinds(item).map((kind) => (
            <Stamp key={kind} kind={kind} />
          ))}
        </View>
        <View style={styles.foot}>
          {fileInfo ? <Text style={styles.caption}>{fileInfo}</Text> : null}
          <View style={styles.spacer} />
          {item.hasCorrection ? (
            <View style={styles.corrected}>
              <Ionicons name="create-outline" size={14} color={colors.status.error} />
              <Text style={styles.correctedText}>{t('explore.corrected')}</Text>
            </View>
          ) : null}
        </View>
      </View>
      {trailing}
    </Pressy>
  );
}

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    row: { flexDirection: 'row', gap: 14, paddingVertical: 16, borderTopWidth: 1, borderTopColor: colors.border.subtle },
    body: { flex: 1, gap: 2 },
    kicker: { fontFamily: fonts.extrabold, fontSize: 13, color: colors.text.link },
    title: { fontFamily: fonts.extrabold, fontSize: 17, lineHeight: 22, color: colors.text.primary },
    meta: { fontFamily: fonts.semibold, fontSize: 14, color: colors.text.secondary },
    university: { fontFamily: fonts.semibold, fontSize: 13, color: colors.text.secondary },
    stamps: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 },
    foot: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 6 },
    caption: { fontFamily: fonts.semibold, fontSize: 13, color: colors.text.secondary },
    spacer: { flex: 1 },
    corrected: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    correctedText: { fontFamily: fonts.extrabold, fontSize: 13, color: colors.status.error },
  });
