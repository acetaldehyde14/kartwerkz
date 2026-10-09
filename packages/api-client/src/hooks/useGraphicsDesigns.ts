'use client';

import { useQuery } from '@tanstack/react-query';
import { getGraphicsDesign, getGraphicsDesigns } from '../graphicsDesigns';
import { queryKeys } from '../queryKeys';

export function useGraphicsDesigns(kartModelId?: string) {
  return useQuery({
    queryKey: queryKeys.graphicsDesigns(kartModelId),
    queryFn: () => getGraphicsDesigns(kartModelId),
  });
}

export function useGraphicsDesign(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.graphicsDesign(id ?? ''),
    queryFn: () => getGraphicsDesign(id as string),
    enabled: Boolean(id),
  });
}
