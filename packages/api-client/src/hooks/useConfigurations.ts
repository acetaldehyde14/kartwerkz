'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createConfiguration, getConfiguration, updateConfiguration } from '../configurations';
import { queryKeys } from '../queryKeys';
import type { CreateConfigurationInput } from '../types';

export function useConfiguration(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.configuration(id ?? ''),
    queryFn: () => getConfiguration(id as string),
    enabled: Boolean(id),
  });
}

export function useCreateConfiguration() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateConfigurationInput) => createConfiguration(input),
    onSuccess: (saved) => {
      queryClient.setQueryData(queryKeys.configuration(saved.id), saved);
    },
  });
}

export function useUpdateConfiguration(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: Partial<CreateConfigurationInput>) => updateConfiguration(id, input),
    onSuccess: (saved) => {
      queryClient.setQueryData(queryKeys.configuration(id), saved);
    },
  });
}
