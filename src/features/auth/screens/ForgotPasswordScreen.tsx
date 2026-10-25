import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "expo-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";

import { Button } from "@/shared/components/Button";
import { ErrorBanner } from "@/shared/components/forms/ErrorBanner";
import { FormTextField } from "@/shared/components/forms/FormTextField";

import { AuthScreenLayout } from "../components/AuthScreenLayout";
import { useRequestPasswordResetMutation } from "../hooks/useAuthMutations";
import {
  createForgotSchema,
  type ForgotValues,
} from "../schemas/auth.validation";
import { toAuthErrorKey } from "../utils/authErrors";

export function ForgotPasswordScreen() {
  const router = useRouter();
  const { t } = useTranslation("auth");
  const request = useRequestPasswordResetMutation();
  const [formError, setFormError] = useState<string | null>(null);

  const { control, handleSubmit } = useForm<ForgotValues>({
    resolver: zodResolver(createForgotSchema(t)),
    defaultValues: { email: "" },
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      const email = values.email.trim();
      await request.mutateAsync(email);
      router.push({ pathname: "/(auth)/reset-password", params: { email } });
    } catch (error) {
      setFormError(t(`errors.${toAuthErrorKey(error)}`));
    }
  });

  return (
    <AuthScreenLayout title={t("forgot.title")} subtitle={t("forgot.subtitle")}>
      <FormTextField
        control={control}
        name="email"
        label={t("fields.email")}
        placeholder={t("fields.emailPlaceholder")}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        textContentType="emailAddress"
        returnKeyType="done"
      />
      <ErrorBanner message={formError} />
      <Button
        label={t("forgot.submit")}
        loading={request.isPending}
        onPress={onSubmit}
      />
      <Button
        label={t("forgot.back")}
        kind="text"
        onPress={() => router.back()}
      />
    </AuthScreenLayout>
  );
}
