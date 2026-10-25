import { useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { AppSheet, SheetTextInput, type SheetHandle } from '@/shared/components/AppSheet';
import { Button } from '@/shared/components/Button';
import { Stamp, type VerificationKind } from '@/shared/components/Stamp';
import { useCelebrate } from '@/shared/celebration/useCelebrate';
import { useThemeColors } from '@/shared/hooks/theme';
import { useShake } from '@/shared/motion/hooks';
import { useToast } from '@/shared/toast/useToast';
import type { Colors } from '@/theme/colors';
import { fonts } from '@/theme/typography';

const STAMPS: VerificationKind[] = ['community', 'metadata', 'source', 'official', 'correction', 'ai'];

/**
 * Developer tools, shown only in development builds. Deliberately not translated.
 * Remove this folder and its one use in ProfileScreen before release.
 */
export function DevPanel() {
  const colors = useThemeColors();
  const toast = useToast();
  const celebrate = useCelebrate();
  const shake = useShake();
  const sheet = useRef<SheetHandle>(null);
  const styles = createStyles(colors);

  return (
    <View style={styles.box}>
      <Text style={styles.heading}>Dev: retours</Text>
      <Button label="Toast de succès" onPress={() => toast.success('Document enregistré dans ta bibliothèque.')} />
      <Button label="Toast d’erreur" kind="outline" onPress={() => toast.error('Téléchargement interrompu.')} />
      <Button label="Fêter une réussite" kind="accent" icon="trophy-outline" onPress={() => celebrate('Objectif atteint')} />
      <Animated.View style={shake.style}>
        <View style={styles.shakeBox}>
          <Text style={styles.body}>Cette zone se secoue.</Text>
        </View>
      </Animated.View>
      <Button label="Secouer" kind="text" onPress={shake.shake} />

      <Text style={styles.heading}>Dev: feuille</Text>
      <Button label="Ouvrir la feuille" kind="outline" icon="layers-outline" onPress={() => sheet.current?.open()} />

      <Text style={styles.heading}>Dev: labels</Text>
      {STAMPS.map((kind) => (
        <Stamp key={kind} kind={kind} />
      ))}

      <AppSheet ref={sheet}>
        <Text style={styles.heading}>Feuille de test</Text>
        <Text style={styles.body}>Glisse vers le bas pour la réduire ou la fermer. Le champ ci-dessous teste le clavier.</Text>
        <SheetTextInput placeholder="Écris quelque chose" placeholderTextColor={colors.text.secondary} style={styles.input} cursorColor={colors.brand.primary} />
        <Button label="Fermer" onPress={() => sheet.current?.close()} />
      </AppSheet>
    </View>
  );
}

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    box: { gap: 12, marginTop: 24, paddingTop: 16, borderTopWidth: 1, borderTopColor: colors.border.default },
    heading: { fontFamily: fonts.extrabold, fontSize: 17, color: colors.text.primary, marginTop: 8 },
    body: { fontFamily: fonts.semibold, fontSize: 15, lineHeight: 22, color: colors.text.secondary },
    shakeBox: { padding: 16, borderRadius: 14, backgroundColor: colors.status.errorSoft },
    input: {
      height: 52,
      paddingHorizontal: 14,
      borderRadius: 14,
      borderWidth: 1.5,
      borderColor: colors.border.default,
      backgroundColor: colors.background.secondary,
      fontFamily: fonts.semibold,
      fontSize: 16,
      color: colors.text.primary,
    },
  });
