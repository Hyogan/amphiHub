import { keepPreviousData, useInfiniteQuery, useMutation, useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { resourcesApi } from '@/services/api/resourcesApi';
import { useToast } from '@/shared/toast/useToast';
import { useAppSelector } from '@/store/hooks';

import {
  toResourceDetail,
  toResourceRelations,
  toResourceSummary,
  toResourceType,
  type SearchParams,
} from '../types/resource';

export const resourceKeys = {
  all: ['resources'] as const,
  types: () => [...resourceKeys.all, 'types'] as const,
  search: (params: SearchParams) => [...resourceKeys.all, 'search', params] as const,
  detail: (id: string) => [...resourceKeys.all, 'detail', id] as const,
  relations: (id: string) => [...resourceKeys.all, 'relations', id] as const,
};

const PAGE_SIZE = 20;

export function useResourceTypesQuery() {
  return useQuery({
    queryKey: resourceKeys.types(),
    queryFn: async () => (await resourcesApi.listTypes()).map(toResourceType),
    staleTime: 10 * 60 * 1000,
  });
}

/** Returns a function that turns a type code into its label in the current language. */
export function useResourceTypeLabel() {
  const types = useResourceTypesQuery();
  const { i18n } = useTranslation();
  return (code: string): string => {
    const type = types.data?.find((t) => t.code === code);
    if (!type) return code;
    return i18n.language === 'en' ? type.labelEn : type.labelFr;
  };
}

/** Search with filters. Pages are fetched by offset. Previous results stay on screen while a new search loads. */
export function useSearchResourcesQuery(params: SearchParams) {
  return useInfiniteQuery({
    queryKey: resourceKeys.search(params),
    queryFn: async ({ pageParam }) => {
      const rows = await resourcesApi.search({ ...params, limit: PAGE_SIZE, offset: pageParam });
      return { items: rows.map(toResourceSummary), total: rows.length ? Number(rows[0].total_count) : 0 };
    },
    initialPageParam: 0,
    getNextPageParam: (last, all) => {
      const loaded = all.reduce((count, page) => count + page.items.length, 0);
      return loaded < last.total ? loaded : undefined;
    },
    placeholderData: keepPreviousData,
  });
}

export function useResourceQuery(id?: string) {
  return useQuery({
    queryKey: resourceKeys.detail(id ?? ''),
    queryFn: async () => toResourceDetail(await resourcesApi.get(id as string)),
    enabled: Boolean(id),
  });
}

export function useResourceRelationsQuery(id?: string) {
  return useQuery({
    queryKey: resourceKeys.relations(id ?? ''),
    queryFn: async () => toResourceRelations(id as string, await resourcesApi.listRelations(id as string)),
    enabled: Boolean(id),
  });
}

export function useRequestResourceMutation() {
  const userId = useAppSelector((state) => state.session.userId);
  const toast = useToast();
  const { t } = useTranslation('resources');
  return useMutation({
    mutationFn: async (input: { universityId: string | null; query: string }) => {
      if (!userId) throw new Error('not signed in');
      await resourcesApi.request({ userId, universityId: input.universityId, query: input.query });
    },
    onSuccess: () => toast.success(t('explore.requested')),
  });
}
