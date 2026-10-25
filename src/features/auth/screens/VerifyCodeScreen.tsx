import { zodResolver } from "@hookform/resolvers/zod";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";

import { Button } from "@/shared/components/Button";
import { ErrorBanner } from "@/shared/components/forms/ErrorBanner";
import { FormTextField } from "@/shared/components/forms/FormTextField";

import { AuthScreenLayout } from "../components/AuthScreenLayout";
import {
  useResendSignupCodeMutation,
  useVerifySignupMutation,
} from "../hooks/useAuthMutations";
import {
  createVerifySchema,
  type VerifyValues,
} from "../schemas/auth.validation";
import { toAuthErrorKey } from "../utils/authErrors";

const RESEND_SECONDS = 30;

export function VerifyCodeScreen() {
  const { email = "" } = useLocalSearchParams<{ email?: string }>();
  const { t } = useTranslation("auth");
  const verify = useVerifySignupMutation();
  const resend = useResendSignupCodeMutation();
  const [formError, setFormError] = useState<string | null>(null);
  const [seconds, setSeconds] = useState(RESEND_SECONDS);

  const { control, handleSubmit } = useForm<VerifyValues>({
    resolver: zodResolver(createVerifySchema(t)),
    defaultValues: { code: "" },
  });

  useEffect(() => {
    if (seconds <= 0) return;
    const timer = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [seconds]);

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      await verify.mutateAsync({ email, code: values.code.trim() });
      // The code signs the user in. The root layout sees the session and leaves this screen.
    } catch (error) {
      setFormError(t(`errors.${toAuthErrorKey(error)}`));
    }
  });

  const onResend = async () => {
    setFormError(null);
    try {
      await resend.mutateAsync(email);
      setSeconds(RESEND_SECONDS);
    } catch (error) {
      setFormError(t(`errors.${toAuthErrorKey(error)}`));
    }
  };

  return (
    <AuthScreenLayout
      title={t("verify.title")}
      subtitle={t("verify.subtitle", { email })}
    >
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
      <ErrorBanner message={formError} />
      <Button
        label={t("verify.submit")}
        loading={verify.isPending}
        onPress={onSubmit}
      />
      <Button
        label={
          seconds > 0 ? t("verify.resendIn", { seconds }) : t("verify.resend")
        }
        kind="text"
        disabled={seconds > 0 || resend.isPending}
        onPress={onResend}
      />
    </AuthScreenLayout>
  );
}
