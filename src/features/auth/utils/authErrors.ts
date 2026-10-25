import { isAuthError } from '@supabase/supabase-js';

export type AuthErrorKey =
  | 'invalidCredentials'
  | 'emailNotConfirmed'
  | 'userExists'
  | 'weakPassword'
  | 'rateLimited'
  | 'codeInvalid'
  | 'network'
  | 'generic';

/** An error we raise ourselves, already in the app's vocabulary. */
export class AppAuthError extends Error {
  constructor(public readonly key: AuthErrorKey) {
    super(key);
    this.name = 'AppAuthError';
  }
}

/** Turns anything thrown by sign-in, sign-up or reset into a translation key under auth:errors. */
export function toAuthErrorKey(error: unknown): AuthErrorKey {
  if (error instanceof AppAuthError) return error.key;
  if (isAuthError(error)) {
    switch (error.code) {
      case 'invalid_credentials':
        return 'invalidCredentials';
      case 'email_not_confirmed':
        return 'emailNotConfirmed';
      case 'user_already_exists':
      case 'email_exists':
        return 'userExists';
      case 'weak_password':
        return 'weakPassword';
      case 'over_email_send_rate_limit':
      case 'over_request_rate_limit':
        return 'rateLimited';
      case 'otp_expired':
      case 'otp_disabled':
        return 'codeInvalid';
      default:
        break;
    }
    // A request that never reached the server has no HTTP status.
    if (error.name === 'AuthRetryableFetchError' || error.status === 0) return 'network';
    if (error.status === 429) return 'rateLimited';
  }
  return 'generic';
}
