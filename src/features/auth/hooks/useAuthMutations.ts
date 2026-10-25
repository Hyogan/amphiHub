import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { useCelebrate } from '@/shared/celebration/useCelebrate';
import { useToast } from '@/shared/toast/useToast';

import { authApi } from '../api/authApi';
import type { SignInValues, SignUpValues } from '../schemas/auth.validation';
import { toAuthErrorKey } from '../utils/authErrors';

// Auth mutations never navigate. They change the session and the root layout reacts to it.

export function useSignInMutation() {
  return useMutation({ mutationFn: (values: SignInValues) => authApi.signIn(values.email, values.password) });
}

export function useSignUpMutation() {
  return useMutation({ mutationFn: (values: SignUpValues) => authApi.signUp(values) });
}

export function useVerifySignupMutation() {
  const celebrate = useCelebrate();
  const { t } = useTranslation('auth');
  return useMutation({
    mutationFn: (input: { email: string; code: string }) => authApi.verifySignup(input.email, input.code),
    onSuccess: () => celebrate(t('verify.success')),
  });
}

export function useResendSignupCodeMutation() {
  const toast = useToast();
  const { t } = useTranslation('auth');
  return useMutation({
    mutationFn: (email: string) => authApi.resendSignupCode(email),
    onSuccess: () => toast.success(t('verify.resent')),
  });
}

export function useRequestPasswordResetMutation() {
  const toast = useToast();
  const { t } = useTranslation('auth');
  return useMutation({
    mutationFn: (email: string) => authApi.requestPasswordReset(email),
    onSuccess: (_data, email) => toast.success(t('forgot.sent', { email })),
  });
}

export function useCompletePasswordResetMutation() {
  const celebrate = useCelebrate();
  const toast = useToast();
  const { t } = useTranslation('auth');
  return useMutation({
    mutationFn: (input: { email: string; code: string; password: string }) =>
      authApi.completePasswordReset(input.email, input.code, input.password),
    onSuccess: () => celebrate(t('reset.success')),
    // The code signs the user in before the password is updated, so the screen may already be gone
    // when the update fails. A toast makes sure the failure is never silent.
    onError: (error) => toast.error(t(`errors.${toAuthErrorKey(error)}`)),
  });
}

export function useSignOutMutation() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const { t } = useTranslation('auth');
  return useMutation({
    mutationFn: () => authApi.signOut(),
    onSuccess: () => {
      // Drop everything fetched for the previous user.
      queryClient.clear();
      toast.info(t('signedOut'));
    },
  });
}
