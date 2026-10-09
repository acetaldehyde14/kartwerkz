'use client';

import { useQuery } from '@tanstack/react-query';
import { getKartManufacturers, getKartModel, getKartModels } from '../kartCatalog';
import { queryKeys } from '../queryKeys';

export function useKartManufacturers() {
  return useQuery({
    queryKey: queryKeys.kartManufacturers(),
    queryFn: getKartManufacturers,
  });
}

export function useKartModels(manufacturerId?: string) {
  return useQuery({
    queryKey: queryKeys.kartModels(manufacturerId),
    queryFn: () => getKartModels(manufacturerId),
  });
}

export function useKartModel(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.kartModel(id ?? ''),
    queryFn: () => getKartModel(id as string),
    enabled: Boolean(id),
  });
}
