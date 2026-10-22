import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
  BottomSheetTextInput,
} from '@gorhom/bottom-sheet';
import { useImperativeHandle, useRef, type ReactNode, type Ref } from 'react';
import { StyleSheet } from 'react-native';

import { useThemeColors } from '@/shared/hooks/theme';

export interface SheetHandle {
  open: () => void;
  /** Close the sheet BEFORE opening a dialog from one of its actions. */
  close: () => void;
}

/**
 * The one bottom sheet for the whole app. It encodes the rules we learned:
 * the sheet's own scroll view is the direct and only child, keyboardBehavior is fillParent,
 * the backdrop is a semi-transparent overlay, and colours come from the theme.
 * Use SheetTextInput (not TextInput) for fields inside a sheet.
 * Mount the sheet next to the screen's content, never inside another ScrollView.
 */
export function AppSheet({
  ref,
  children,
  snapPoints = ['85%'],
  onDismiss,
}: {
  ref: Ref<SheetHandle>;
  children: ReactNode;
  snapPoints?: (string | number)[];
  onDismiss?: () => void;
}) {
  const colors = useThemeColors();
  const modalRef = useRef<BottomSheetModal>(null);

  useImperativeHandle(ref, () => ({
    open: () => modalRef.current?.present(),
    close: () => modalRef.current?.dismiss(),
  }));

  return (
    <BottomSheetModal
      ref={modalRef}
      snapPoints={snapPoints}
      enablePanDownToClose
      onDismiss={onDismiss}
      keyboardBehavior="fillParent"
      keyboardBlurBehavior="restore"
      android_keyboardInputMode="adjustResize"
      backdropComponent={(props) => (
        <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} opacity={0.5} pressBehavior="close" />
      )}
      handleIndicatorStyle={{ backgroundColor: colors.border.strong }}
      backgroundStyle={{ backgroundColor: colors.background.tertiary }}>
      <BottomSheetScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}>
        {children}
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
}

export { BottomSheetTextInput as SheetTextInput };

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20, paddingTop: 4, paddingBottom: 48, gap: 14 },
});
