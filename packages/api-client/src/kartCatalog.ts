import { apiFetch } from './client';
import type { KartManufacturer, KartModel } from './types';

export function getKartManufacturers(): Promise<KartManufacturer[]> {
  return apiFetch<KartManufacturer[]>('/kart-manufacturers');
}

export function getKartModels(manufacturerId?: string): Promise<KartModel[]> {
  return apiFetch<KartModel[]>('/kart-models', {
    searchParams: { manufacturerId },
  });
}

export function getKartModel(id: string): Promise<KartModel> {
  return apiFetch<KartModel>(`/kart-models/${id}`);
}
