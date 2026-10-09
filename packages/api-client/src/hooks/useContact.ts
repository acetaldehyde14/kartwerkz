'use client';

import { useMutation } from '@tanstack/react-query';
import { sendContactMessage } from '../contact';
import type { ContactMessageInput } from '../types';

export function useSendContactMessage() {
  return useMutation({
    mutationFn: (input: ContactMessageInput) => sendContactMessage(input),
  });
}
