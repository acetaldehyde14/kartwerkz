'use client';

import { useQuery } from '@tanstack/react-query';
import { getProduct, getProducts } from '../products';
import { queryKeys } from '../queryKeys';

export function useProducts() {
  return useQuery({
    queryKey: queryKeys.products(),
    queryFn: getProducts,
  });
}

export function useProduct(idOrSlug: string | undefined) {
  return useQuery({
    queryKey: queryKeys.product(idOrSlug ?? ''),
    queryFn: () => getProduct(idOrSlug as string),
    enabled: Boolean(idOrSlug),
  });
}
