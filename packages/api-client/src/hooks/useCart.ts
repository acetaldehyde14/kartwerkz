'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { addCartItem, getCart, removeCartItem, updateCartItem } from '../cart';
import { queryKeys } from '../queryKeys';
import type { AddCartItemInput, UpdateCartItemInput } from '../types';

export function useCart() {
  return useQuery({
    queryKey: queryKeys.cart(),
    queryFn: getCart,
    // The cart is small and read often (nav badge) — a short stale time
    // keeps the badge responsive without hammering the API.
    staleTime: 10 * 1000,
  });
}

// The mutation endpoints return the single affected CartItem, not the full
// Cart (see cart.ts) — so success handlers invalidate the cart query to
// trigger a refetch, rather than trying to splice the response in directly.

export function useAddCartItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: AddCartItemInput) => addCartItem(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.cart() }),
  });
}

export function useUpdateCartItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ itemId, input }: { itemId: string; input: UpdateCartItemInput }) =>
      updateCartItem(itemId, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.cart() }),
  });
}

export function useRemoveCartItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (itemId: string) => removeCartItem(itemId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.cart() }),
  });
}
