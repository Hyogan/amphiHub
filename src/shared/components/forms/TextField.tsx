import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from "react-native";
import Animated from "react-native-reanimated";

import { useThemeColors } from "@/shared/hooks/theme";
import { useShake } from "@/shared/motion/hooks";
import type { Colors } from "@/theme/colors";
import { fonts } from "@/theme/typography";

import { Pressy } from "../Pressy";

export interface TextFieldProps extends Omit<
  TextInputProps,
  "style" | "value" | "onChangeText" | "onBlur"
> {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  onBlur?: () => void;
  error?: string;
  helper?: string;
  /** Password field with a show / hide toggle. */
  secure?: boolean;
  /** Large centred digits, for one-time codes. */
  code?: boolean;
}

/** Underline field. Ink at rest, green when focused, red with a thicker line on error. A new error shakes it. */
export function TextField({
  label,
  value,
  onChangeText,
  onBlur,
  error,
  helper,
  secure,
  code,
  ...rest
}: TextFieldProps) {
  const colors = useThemeColors();
  const { t } = useTranslation("auth");
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(true);
  const shake = useShake();
  const styles = createStyles(colors);

  useEffect(() => {
    if (error) shake.shake();
    // Only a new error message should shake the field.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [error]);

  const lineColor = error
    ? colors.status.error
    : focused
      ? colors.border.focus
      : colors.text.primary;
  return (
    <Animated.View style={[styles.wrap, shake.style]}>
      <Text style={styles.label}>{label}</Text>
      <View
        style={[
          styles.line,
          {
            borderBottomColor: lineColor,
            borderBottomWidth: focused || error ? 3 : 2,
          },
        ]}
      >
        <TextInput
          {...rest}
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setFocused(true)}
          onBlur={() => {
            setFocused(false);
            onBlur?.();
          }}
          secureTextEntry={secure && hidden}
          underlineColorAndroid="transparent"
          placeholderTextColor={colors.text.secondary}
          cursorColor={colors.brand.primary}
          accessibilityLabel={label}
          style={[styles.input, code && styles.code]}
        />
        {secure ? (
          <Pressy
            label={hidden ? t("fields.showPassword") : t("fields.hidePassword")}
            onPress={() => setHidden(!hidden)}
            style={styles.eye}
          >
            <Ionicons
              name={hidden ? "eye-outline" : "eye-off-outline"}
              size={22}
              color={colors.icon.secondary}
            />
          </Pressy>
        ) : null}
      </View>
      {error ? (
        <Text style={styles.error}>{error}</Text>
      ) : helper ? (
        <Text style={styles.helper}>{helper}</Text>
      ) : null}
    </Animated.View>
  );
}

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    wrap: { gap: 6 },
    label: {
      fontFamily: fonts.extrabold,
      fontSize: 15,
      color: colors.text.primary,
    },
    line: { flexDirection: "row", alignItems: "center" },
    input: {
      flex: 1,
      height: 50,
      fontFamily: fonts.semibold,
      fontSize: 16,
      color: colors.text.primary,
      paddingVertical: 0,
    },
    code: {
      fontFamily: fonts.black,
      fontSize: 28,
      letterSpacing: 8,
      textAlign: "center",
      height: 60,
    },
    eye: {
      width: 44,
      height: 44,
      alignItems: "center",
      justifyContent: "center",
    },
    error: { fontFamily: fonts.bold, fontSize: 13, color: colors.status.error },
    helper: {
      fontFamily: fonts.semibold,
      fontSize: 13,
      color: colors.text.secondary,
    },
  });
