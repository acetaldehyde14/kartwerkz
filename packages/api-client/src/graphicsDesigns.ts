import { apiFetch } from './client';
import type { GraphicsDesign } from './types';

export function getGraphicsDesigns(kartModelId?: string): Promise<GraphicsDesign[]> {
  return apiFetch<GraphicsDesign[]>('/graphics-designs', {
    searchParams: { kartModelId },
  });
}

export function getGraphicsDesign(id: string): Promise<GraphicsDesign> {
  return apiFetch<GraphicsDesign>(`/graphics-designs/${id}`);
}
