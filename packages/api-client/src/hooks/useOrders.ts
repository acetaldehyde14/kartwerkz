'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { approveProof, getOrder, getOrderProofs, getOrders, requestProofRevision } from '../orders';
import { queryKeys } from '../queryKeys';
import type { RequestRevisionInput } from '../types';

export function useOrders() {
  return useQuery({
    queryKey: queryKeys.orders(),
    queryFn: getOrders,
  });
}

export function useOrder(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.order(id ?? ''),
    queryFn: () => getOrder(id as string),
    enabled: Boolean(id),
  });
}

export function useOrderProofs(orderId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.orderProofs(orderId ?? ''),
    queryFn: () => getOrderProofs(orderId as string),
    enabled: Boolean(orderId),
  });
}

export function useApproveProof(orderId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (proofId: string) => approveProof(orderId, proofId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.order(orderId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.orderProofs(orderId) });
    },
  });
}

export function useRequestProofRevision(orderId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ proofId, input }: { proofId: string; input: RequestRevisionInput }) =>
      requestProofRevision(orderId, proofId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.order(orderId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.orderProofs(orderId) });
    },
  });
}
