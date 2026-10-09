import { apiFetch } from './client';
import type { LoginInput, RegisterInput, User } from './types';

export function login(input: LoginInput): Promise<User> {
  return apiFetch<User>('/auth/login', {
    method: 'POST',
    body: input,
  });
}

export function register(input: RegisterInput): Promise<User> {
  return apiFetch<User>('/auth/register', {
    method: 'POST',
    body: input,
  });
}

export function logout(): Promise<void> {
  return apiFetch<void>('/auth/logout', {
    method: 'POST',
  });
}

export function getCurrentUser(): Promise<User> {
  return apiFetch<User>('/auth/me');
}

export function getCurrentCustomer(): Promise<User> {
  return apiFetch<User>('/customers/me');
}
