import { apiFetch } from './client';
import type { CreateConfigurationInput, SavedConfiguration } from './types';

export function createConfiguration(input: CreateConfigurationInput): Promise<SavedConfiguration> {
  return apiFetch<SavedConfiguration>('/configurations', {
    method: 'POST',
    body: input,
  });
}

export function getConfiguration(id: string): Promise<SavedConfiguration> {
  return apiFetch<SavedConfiguration>(`/configurations/${id}`);
}

export function updateConfiguration(
  id: string,
  input: Partial<CreateConfigurationInput>,
): Promise<SavedConfiguration> {
  return apiFetch<SavedConfiguration>(`/configurations/${id}`, {
    method: 'PATCH',
    body: input,
  });
}
