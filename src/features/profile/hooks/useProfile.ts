import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { profileApi } from '@/services/api/profileApi';
import { useToast } from '@/shared/toast/useToast';

import { toProfile, toRawAcademicUpdate, type AcademicProfileInput } from '../types/profile';

export const profileKeys = {
  all: ['profile'] as const,
  detail: (userId: string) => [...profileKeys.all, 'detail', userId] as const,
};

export function useProfileQuery(userId?: string | null) {
  return useQuery({
    queryKey: profileKeys.detail(userId ?? ''),
    queryFn: async () => toProfile(await profileApi.get(userId as string)),
    enabled: Boolean(userId),
  });
}

export function useUpdateAcademicProfileMutation(userId: string) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const { t } = useTranslation('profile');
  return useMutation({
    mutationFn: async (input: AcademicProfileInput) => toProfile(await profileApi.updateAcademic(userId, toRawAcademicUpdate(input))),
    onSuccess: (profile) => {
      queryClient.setQueryData(profileKeys.detail(userId), profile);
      toast.success(t('academic.saved'));
    },
  });
}
