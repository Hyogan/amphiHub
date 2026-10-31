import type { Colors } from '@/theme/colors';

/** One colour pair per kind of document, used by file tiles and quick-access tiles. */
export function getResourceAccent(typeCode: string, colors: Colors) {
  switch (typeCode) {
    case 'correction':
      return { foreground: colors.status.error, background: colors.status.errorSoft };
    case 'lecture_notes':
      return { foreground: colors.brand.accentText, background: colors.brand.accentSoft };
    case 'td':
    case 'tp':
      return { foreground: colors.status.info, background: colors.status.infoSoft };
    default:
      return { foreground: colors.brand.primary, background: colors.brand.primarySoft };
  }
}
