import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  getAutoUpdate,
  getAutostart,
  getGreeting,
  getLocale,
  getTheme,
  setAutoUpdate,
  setAutostart,
  setLocale,
  setTheme,
} from '@/domain/settings/apis/settings';
import type { LocalePref, ThemePref } from '@/domain/settings/apis/settings.dto';
import type { AppError } from '@/shared/api/common.dto';
import type { QueryMutationHandle } from '@/shared/queries';

export const THEME_QUERY_KEY = ['settings', 'theme'];
export const LOCALE_QUERY_KEY = ['settings', 'locale'];

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

export function useAutoUpdate() {
  const { data, isLoading } = useQuery<boolean>({
    queryKey: ['settings', 'autoUpdate'],
    queryFn: getAutoUpdate,
  });

  return { autoUpdate: data ?? true, isLoading };
}

export function useAutoUpdateUpdate({ onSuccess, onError }: QueryMutationHandle<boolean> = {}) {
  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation<boolean, AppError, boolean>({
    mutationKey: ['settings', 'autoUpdate', 'update'],
    mutationFn: setAutoUpdate,
    onSuccess: (data) => {
      queryClient.setQueryData(['settings', 'autoUpdate'], data);

      onSuccess?.(data);
    },
    onError: (err) => {
      onError?.(err);
    },
  });

  return { updateAutoUpdate: mutate, isLoading: isPending };
}

export function useLocalePref() {
  const { data, isLoading } = useQuery<LocalePref>({
    queryKey: LOCALE_QUERY_KEY,
    queryFn: getLocale,
  });

  return { locale: data ?? 'system', isLoading };
}

export function useLocaleUpdate({ onSuccess, onError }: QueryMutationHandle<LocalePref> = {}) {
  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation<LocalePref, AppError, LocalePref>({
    mutationKey: ['settings', 'locale', 'update'],
    mutationFn: setLocale,
    onSuccess: (data) => {
      queryClient.setQueryData(LOCALE_QUERY_KEY, data);

      onSuccess?.(data);
    },
    onError: (err) => {
      onError?.(err);
    },
  });

  return { updateLocale: mutate, isLoading: isPending };
}

export function useAutostart() {
  const { data, isLoading } = useQuery<boolean>({
    queryKey: ['settings', 'autostart'],
    queryFn: getAutostart,
  });

  return { autostart: data ?? false, isLoading };
}

export function useAutostartUpdate({ onSuccess, onError }: QueryMutationHandle<boolean> = {}) {
  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation<boolean, AppError, boolean>({
    mutationKey: ['settings', 'autostart', 'update'],
    mutationFn: setAutostart,
    onSuccess: (data) => {
      queryClient.setQueryData(['settings', 'autostart'], data);

      onSuccess?.(data);
    },
    onError: (err) => {
      onError?.(err);
    },
  });

  return { updateAutostart: mutate, isLoading: isPending };
}
