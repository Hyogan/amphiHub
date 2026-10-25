import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "expo-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text, View } from "react-native";

import { useCelebrate } from "@/shared/celebration/useCelebrate";
import { Button } from "@/shared/components/Button";
import { ErrorBanner } from "@/shared/components/forms/ErrorBanner";
import { FormTextField } from "@/shared/components/forms/FormTextField";
import { Tap } from "@/shared/components/Pressy";
import { useThemeColors } from "@/shared/hooks/theme";
import type { Colors } from "@/theme/colors";
import { fonts } from "@/theme/typography";

import { AuthScreenLayout } from "../components/AuthScreenLayout";
import { useSignUpMutation } from "../hooks/useAuthMutations";
import {
  createSignUpSchema,
  type SignUpValues,
} from "../schemas/auth.validation";
import { toAuthErrorKey } from "../utils/authErrors";

export function SignUpScreen() {
  const colors = useThemeColors();
  const router = useRouter();
  const celebrate = useCelebrate();
  const { t } = useTranslation("auth");
  const signUp = useSignUpMutation();
  const [formError, setFormError] = useState<string | null>(null);
  const styles = createStyles(colors);

  const { control, handleSubmit, setError } = useForm<SignUpValues>({
    resolver: zodResolver(createSignUpSchema(t)),
    defaultValues: { displayName: "", email: "", password: "" },
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      const { needsVerification } = await signUp.mutateAsync(values);
      if (needsVerification) {
        router.push({
          pathname: "/(auth)/verify",
          params: { email: values.email.trim() },
        });
      } else {
        // E-mail confirmation is switched off: we are already signed in and the root layout moves on.
        celebrate(t("signup.welcome"));
      }
    } catch (error) {
      const key = toAuthErrorKey(error);
      // Put the message next to the field that caused it when we can.
      if (key === "userExists")
        setError("email", { message: t("errors.userExists") });
      else if (key === "weakPassword")
        setError("password", { message: t("errors.weakPassword") });
      else setFormError(t(`errors.${key}`));
    }
  });

  return (
    <AuthScreenLayout title={t("signup.title")} subtitle={t("signup.subtitle")}>
      <FormTextField
        control={control}
        name="displayName"
        label={t("fields.displayName")}
        autoCapitalize="words"
        autoComplete="name"
        returnKeyType="next"
      />
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
        helper={t("fields.passwordHint")}
        secure
        autoCapitalize="none"
        autoComplete="new-password"
        textContentType="newPassword"
        returnKeyType="done"
      />
      <ErrorBanner message={formError} />
      <Button
        label={t("signup.submit")}
        loading={signUp.isPending}
        onPress={onSubmit}
      />
      <View style={styles.row}>
        <Text style={styles.muted}>{t("signup.haveAccount")}</Text>
        <Tap onPress={() => router.replace("/(auth)/login")}>
          <Text style={styles.link}>{t("signup.signIn")}</Text>
        </Tap>
      </View>
    </AuthScreenLayout>
  );
}

const createStyles = (colors: Colors) =>
  StyleSheet.create({
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
