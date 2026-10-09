import { apiFetch } from './client';
import type { UploadedAsset } from './types';

/**
 * Uploads a file via multipart/form-data. Pass rawBody so the client
 * wrapper does not attempt to JSON-encode the FormData.
 */
export function uploadAsset(file: File): Promise<UploadedAsset> {
  const formData = new FormData();
  formData.append('file', file);

  return apiFetch<UploadedAsset>('/uploads', {
    method: 'POST',
    body: formData,
    rawBody: true,
  });
}
