'use client';

import { useQuery } from '@tanstack/react-query';
import { getAdminDashboardStats } from '../admin';
import { queryKeys } from '../queryKeys';

export function useAdminDashboardStats() {
  return useQuery({
    queryKey: queryKeys.adminDashboard(),
    queryFn: getAdminDashboardStats,
    retry: false,
  });
}
