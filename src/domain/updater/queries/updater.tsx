import { useEffect } from 'react';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { checkUpdate, getUpdateStatus, installUpdate } from '@/domain/updater/apis/updater';
import type { UpdateStatus } from '@/domain/updater/apis/updater.dto';
import type { AppError } from '@/shared/api/common.dto';
import type { QueryMutationHandle } from '@/shared/queries';

import { listen } from '@tauri-apps/api/event';

const STATUS_QUERY_KEY = ['updater', 'status'];

/** Current status, kept live by the `update://status` event (also fired by tray-initiated checks). */
export function useUpdateStatus() {
  const queryClient = useQueryClient();

  const { data } = useQuery<UpdateStatus>({
    queryKey: STATUS_QUERY_KEY,
    queryFn: getUpdateStatus,
  });

  useEffect(() => {
    const unlisten = listen<UpdateStatus>('update://status', (e) =>
      queryClient.setQueryData(STATUS_QUERY_KEY, e.payload),
    );

    return () => {
      void unlisten.then((fn) => fn());
    };
  }, [queryClient]);

  return { status: data ?? ({ status: 'idle' } as UpdateStatus) };
}

export function useUpdateCheck({ onSuccess, onError }: QueryMutationHandle<UpdateStatus> = {}) {
  const { mutate, isPending } = useMutation<UpdateStatus, AppError>({
    mutationKey: ['updater', 'check'],
    mutationFn: checkUpdate,
    onSuccess: (data) => onSuccess?.(data),
    onError: (err) => onError?.(err),
  });

  return { checkUpdate: () => mutate(), isLoading: isPending };
}

export function useUpdateInstall({ onSuccess, onError }: QueryMutationHandle<void> = {}) {
  const { mutate, isPending } = useMutation<void, AppError>({
    mutationKey: ['updater', 'install'],
    mutationFn: installUpdate,
    onSuccess: () => onSuccess?.(),
    onError: (err) => onError?.(err),
  });

  return { installUpdate: () => mutate(), isLoading: isPending };
}
