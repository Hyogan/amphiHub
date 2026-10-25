import { zodResolver } from "@hookform/resolvers/zod";
import { useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";

import { Button } from "@/shared/components/Button";
import { ErrorBanner } from "@/shared/components/forms/ErrorBanner";
import { FormTextField } from "@/shared/components/forms/FormTextField";

import { AuthScreenLayout } from "../components/AuthScreenLayout";
import { useCompletePasswordResetMutation } from "../hooks/useAuthMutations";
import {
  createResetSchema,
  type ResetValues,
} from "../schemas/auth.validation";
import { toAuthErrorKey } from "../utils/authErrors";

export function ResetPasswordScreen() {
  const { email = "" } = useLocalSearchParams<{ email?: string }>();
  const { t } = useTranslation("auth");
  const complete = useCompletePasswordResetMutation();
  const [formError, setFormError] = useState<string | null>(null);

  const { control, handleSubmit, setError } = useForm<ResetValues>({
    resolver: zodResolver(createResetSchema(t)),
    defaultValues: { code: "", password: "" },
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      await complete.mutateAsync({
        email,
        code: values.code.trim(),
        password: values.password,
      });
      // The code signs the user in and the password is updated. The root layout leaves this screen.
    } catch (error) {
      const key = toAuthErrorKey(error);
      if (key === "weakPassword")
        setError("password", { message: t("errors.weakPassword") });
      else if (key === "codeInvalid")
        setError("code", { message: t("errors.codeInvalid") });
      else setFormError(t(`errors.${key}`));
    }
  });

  return (
    <AuthScreenLayout title={t("reset.title")} subtitle={t("reset.subtitle")}>
      <FormTextField
        control={control}
        name="code"
        label={t("fields.code")}
        code
        keyboardType="number-pad"
        maxLength={10}
        autoComplete="one-time-code"
        textContentType="oneTimeCode"
        autoFocus
      />
      <FormTextField
        control={control}
        name="password"
        label={t("fields.newPassword")}
        helper={t("fields.passwordHint")}
        secure
        autoCapitalize="none"
        autoComplete="new-password"
        textContentType="newPassword"
        returnKeyType="done"
      />
      <ErrorBanner message={formError} />
      <Button
        label={t("reset.submit")}
        loading={complete.isPending}
        onPress={onSubmit}
      />
    </AuthScreenLayout>
  );
}
