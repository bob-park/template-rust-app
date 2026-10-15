import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { getGreeting, getTheme, setTheme } from '@/domain/settings/apis/settings';
import type { ThemePref } from '@/domain/settings/apis/settings.dto';
import type { AppError } from '@/shared/api/common.dto';
import type { QueryMutationHandle } from '@/shared/queries';

export const THEME_QUERY_KEY = ['settings', 'theme'];

export function useGreeting() {
  const { data, isLoading } = useQuery<string>({
    queryKey: ['settings', 'greeting'],
    queryFn: getGreeting,
  });

  return { greeting: data, isLoading };
}

export function useThemePref() {
  const { data, isLoading } = useQuery<ThemePref>({
    queryKey: THEME_QUERY_KEY,
    queryFn: getTheme,
  });

  return { theme: data ?? 'system', isLoading };
}

export function useThemeUpdate({ onSuccess, onError }: QueryMutationHandle<ThemePref> = {}) {
  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation<ThemePref, AppError, ThemePref>({
    mutationKey: ['settings', 'theme', 'update'],
    mutationFn: setTheme,
    onSuccess: (data) => {
      queryClient.setQueryData(THEME_QUERY_KEY, data);

      onSuccess?.(data);
    },
    onError: (err) => {
      onError?.(err);
    },
  });

  return { updateTheme: mutate, isLoading: isPending };
}
