import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { useToast } from '@/shared/toast/useToast';
import { useAppSelector } from '@/store/hooks';

/**
 * Guests may browse and search. Actions that need an account (download, save, contribute) call this first:
 *   const requireAuth = useRequireAuth();
 *   if (!requireAuth()) return;
 * Hiding a button is only UX. The database access rules are the real check.
 */
export function useRequireAuth() {
  const router = useRouter();
  const toast = useToast();
  const { t } = useTranslation('auth');
  const status = useAppSelector((state) => state.session.status);
  return (): boolean => {
    if (status === 'signedIn') return true;
    toast.info(t('required'));
    router.push('/(auth)/login');
    return false;
  };
}
