'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getCurrentUser, login, logout, register } from '../auth';
import { queryKeys } from '../queryKeys';
import type { LoginInput, RegisterInput } from '../types';

export function useCurrentUser() {
  return useQuery({
    queryKey: queryKeys.currentUser(),
    queryFn: getCurrentUser,
    retry: false,
  });
}

export function useLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: LoginInput) => login(input),
    onSuccess: (user) => queryClient.setQueryData(queryKeys.currentUser(), user),
  });
}

export function useRegister() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: RegisterInput) => register(input),
    onSuccess: (user) => queryClient.setQueryData(queryKeys.currentUser(), user),
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => logout(),
    onSuccess: () => {
      queryClient.setQueryData(queryKeys.currentUser(), null);
      queryClient.invalidateQueries({ queryKey: queryKeys.cart() });
    },
  });
}
