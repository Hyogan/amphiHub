import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { ZoomIn } from "react-native-reanimated";

import { Button, type ButtonKind } from "@/shared/components/Button";
import { useThemeColors } from "@/shared/hooks/theme";
import type { Colors } from "@/theme/colors";
import { fonts } from "@/theme/typography";

import type {
    DialogActionData,
    DialogConfig,
    DialogVariant,
} from "./dialogRegistry";

const ICONS: Record<DialogVariant, ComponentProps<typeof Ionicons>["name"]> = {
  confirm: "help-circle-outline",
  destructive: "trash-outline",
  info: "information-circle-outline",
  warning: "warning-outline",
};

function variantColors(variant: DialogVariant, colors: Colors) {
  const map: Record<DialogVariant, { color: string; background: string }> = {
    confirm: {
      color: colors.brand.primary,
      background: colors.brand.primarySoft,
    },
    destructive: {
      color: colors.status.error,
      background: colors.status.errorSoft,
    },
    info: { color: colors.status.info, background: colors.status.infoSoft },
    warning: {
      color: colors.status.warning,
      background: colors.status.warningSoft,
    },
  };
  return map[variant];
}

function buttonKind(action: DialogActionData): ButtonKind {
  if (action.variant === "destructive") return "danger";
  if (action.variant === "cancel") return "outline";
  return "primary";
}

export function DialogBase({
  config,
  onClose,
}: {
  config: DialogConfig;
  onClose: () => void;
}) {
  const colors = useThemeColors();
  const { t } = useTranslation();
  const styles = createStyles(colors);
  const look = variantColors(config.variant, colors);
  const [running, setRunning] = useState<number | null>(null);
  const [failed, setFailed] = useState(false);
  const dismissible = config.dismissible !== false;

  async function run(index: number) {
    const action = config.actions[index];
    setFailed(false);
    setRunning(index);
    try {
      await action.onPress();
      if (action.closeOnAction !== false) onClose();
    } catch {
      setFailed(true); // failures never close the dialog
    } finally {
      setRunning(null);
    }
  }

  return (
    <Modal
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={() =>
        dismissible && running === null ? onClose() : undefined
      }
    >
      <View style={styles.overlay}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={() =>
            dismissible && running === null ? onClose() : undefined
          }
        />
        <Animated.View entering={ZoomIn.duration(180)} style={styles.card}>
          <View style={[styles.icon, { backgroundColor: look.background }]}>
            <Ionicons
              name={ICONS[config.variant]}
              size={28}
              color={look.color}
            />
          </View>
          <Text style={styles.title}>{config.title}</Text>
          {config.description ? (
            <Text style={styles.description}>{config.description}</Text>
          ) : null}
          {failed ? (
            <Text style={styles.error}>{t("dialog.error")}</Text>
          ) : null}
          <View style={styles.actions}>
            {config.actions.map((action, index) => (
              <Button
                key={action.label}
                label={action.label}
                kind={buttonKind(action)}
                loading={running === index}
                disabled={running !== null && running !== index}
                onPress={() => run(index)}
              />
            ))}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      padding: 24,
      backgroundColor: colors.overlay.dark,
    },
    card: {
      width: "100%",
      maxWidth: 420,
      alignItems: "center",
      gap: 12,
      padding: 24,
      borderRadius: 28,
      backgroundColor: colors.background.tertiary,
    },
    icon: {
      width: 56,
      height: 56,
      borderRadius: 28,
      alignItems: "center",
      justifyContent: "center",
    },
    title: {
      fontFamily: fonts.extrabold,
      fontSize: 20,
      lineHeight: 26,
      textAlign: "center",
      color: colors.text.primary,
    },
    description: {
      fontFamily: fonts.semibold,
      fontSize: 15,
      lineHeight: 22,
      textAlign: "center",
      color: colors.text.secondary,
    },
    error: {
      fontFamily: fonts.bold,
      fontSize: 14,
      textAlign: "center",
      color: colors.status.error,
    },
    actions: { alignSelf: "stretch", gap: 10, marginTop: 8 },
  });
