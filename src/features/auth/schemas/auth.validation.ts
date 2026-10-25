import type { TFunction } from 'i18next';
import { z } from 'zod';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CODE = /^\d{6,10}$/;

// Factories take `t` so every message is translated. Keys live in the auth namespace.
const email = (t: TFunction) => z.string().trim().min(1, t('validation.emailRequired')).regex(EMAIL, t('validation.emailInvalid'));
const newPassword = (t: TFunction) => z.string().min(8, t('validation.passwordMin'));
const code = (t: TFunction) => z.string().trim().regex(CODE, t('validation.codeInvalid'));

export const createSignInSchema = (t: TFunction) =>
  z.object({ email: email(t), password: z.string().min(1, t('validation.passwordRequired')) });
export type SignInValues = z.infer<ReturnType<typeof createSignInSchema>>;

export const createSignUpSchema = (t: TFunction) =>
  z.object({ displayName: z.string().trim().min(1, t('validation.nameRequired')).max(60), email: email(t), password: newPassword(t) });
export type SignUpValues = z.infer<ReturnType<typeof createSignUpSchema>>;

export const createVerifySchema = (t: TFunction) => z.object({ code: code(t) });
export type VerifyValues = z.infer<ReturnType<typeof createVerifySchema>>;

export const createForgotSchema = (t: TFunction) => z.object({ email: email(t) });
export type ForgotValues = z.infer<ReturnType<typeof createForgotSchema>>;

export const createResetSchema = (t: TFunction) => z.object({ code: code(t), password: newPassword(t) });
export type ResetValues = z.infer<ReturnType<typeof createResetSchema>>;
