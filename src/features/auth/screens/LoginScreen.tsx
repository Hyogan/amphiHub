import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "expo-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text, View } from "react-native";

import { Button } from "@/shared/components/Button";
import { ErrorBanner } from "@/shared/components/forms/ErrorBanner";
import { FormTextField } from "@/shared/components/forms/FormTextField";
import { Tap } from "@/shared/components/Pressy";
import { useThemeColors } from "@/shared/hooks/theme";
import type { Colors } from "@/theme/colors";
import { fonts } from "@/theme/typography";

import { AuthScreenLayout } from "../components/AuthScreenLayout";
import { useSignInMutation } from "../hooks/useAuthMutations";
import {
  createSignInSchema,
  type SignInValues,
} from "../schemas/auth.validation";
import { toAuthErrorKey } from "../utils/authErrors";

export function LoginScreen() {
  const colors = useThemeColors();
  const router = useRouter();
  const { t } = useTranslation("auth");
  const signIn = useSignInMutation();
  const [formError, setFormError] = useState<string | null>(null);
  const styles = createStyles(colors);

  const { control, handleSubmit } = useForm<SignInValues>({
    resolver: zodResolver(createSignInSchema(t)),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      await signIn.mutateAsync(values);
      // Nothing to do: the root layout sees the new session and leaves this screen.
    } catch (error) {
      setFormError(t(`errors.${toAuthErrorKey(error)}`));
    }
  });

  return (
    <AuthScreenLayout title={t("login.title")} subtitle={t("login.subtitle")}>
      <FormTextField
        control={control}
        name="email"
        label={t("fields.email")}
        placeholder={t("fields.emailPlaceholder")}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        textContentType="emailAddress"
        returnKeyType="next"
      />
      <FormTextField
        control={control}
        name="password"
        label={t("fields.password")}
        secure
        autoCapitalize="none"
        autoComplete="current-password"
        textContentType="password"
        returnKeyType="done"
      />
      <View style={styles.right}>
        <Tap onPress={() => router.push("/(auth)/forgot-password")}>
          <Text style={styles.link}>{t("login.forgot")}</Text>
        </Tap>
      </View>
      <ErrorBanner message={formError} />
      <Button
        label={t("login.submit")}
        loading={signIn.isPending}
        onPress={onSubmit}
      />
      <View style={styles.row}>
        <Text style={styles.muted}>{t("login.noAccount")}</Text>
        <Tap onPress={() => router.replace("/(auth)/signup")}>
          <Text style={styles.link}>{t("login.createAccount")}</Text>
        </Tap>
      </View>
      <Button
        label={t("login.guest")}
        kind="text"
        onPress={() => router.replace("/(tabs)")}
      />
    </AuthScreenLayout>
  );
}

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    right: { alignItems: "flex-end" },
    row: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      gap: 6,
    },
    muted: {
      fontFamily: fonts.semibold,
      fontSize: 15,
      color: colors.text.secondary,
    },
    link: {
      fontFamily: fonts.extrabold,
      fontSize: 15,
      color: colors.text.link,
    },
  });
