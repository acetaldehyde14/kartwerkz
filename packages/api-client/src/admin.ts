import { apiFetch } from './client';
import type { AdminDashboardStats } from './types';

/**
 * ASSUMPTION: `/admin/dashboard` is not yet in the documented route list.
 * Written against a plausible shape; the admin page falls back to a
 * graceful empty state if this 404s.
 */
export function getAdminDashboardStats(): Promise<AdminDashboardStats> {
  return apiFetch<AdminDashboardStats>('/admin/dashboard');
}
