'use client';

import { useMutation } from '@tanstack/react-query';
import { confirmDevPayment, createCheckoutSession } from '../checkout';
import type { CreateCheckoutSessionInput } from '../types';

export function useCreateCheckoutSession() {
  return useMutation({
    mutationFn: (input: CreateCheckoutSessionInput) => createCheckoutSession(input),
  });
}

export function useConfirmDevPayment() {
  return useMutation({
    mutationFn: (orderId: string) => confirmDevPayment(orderId),
  });
}
