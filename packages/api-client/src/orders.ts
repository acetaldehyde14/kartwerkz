import { apiFetch } from './client';
import type { ArtworkProof, Order, RequestRevisionInput } from './types';

export function getOrders(): Promise<Order[]> {
  return apiFetch<Order[]>('/orders');
}

export function getOrder(id: string): Promise<Order> {
  return apiFetch<Order>(`/orders/${id}`);
}

export function getOrderProofs(orderId: string): Promise<ArtworkProof[]> {
  return apiFetch<ArtworkProof[]>(`/orders/${orderId}/proofs`);
}

/** Returns the created ArtworkApproval record — callers should refetch the order/proofs query rather than rely on its shape. */
export function approveProof(
  orderId: string,
  proofId: string,
): Promise<{ id: string; status: string }> {
  return apiFetch(`/orders/${orderId}/proofs/${proofId}/approve`, {
    method: 'POST',
  });
}

export function requestProofRevision(
  orderId: string,
  proofId: string,
  input: RequestRevisionInput,
): Promise<{ id: string; status: string }> {
  return apiFetch(`/orders/${orderId}/proofs/${proofId}/request-revision`, {
    method: 'POST',
    body: input,
  });
}
