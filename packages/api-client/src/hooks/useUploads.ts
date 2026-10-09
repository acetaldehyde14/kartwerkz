'use client';

import { useMutation } from '@tanstack/react-query';
import { uploadAsset } from '../uploads';

export function useUploadAsset() {
  return useMutation({
    mutationFn: (file: File) => uploadAsset(file),
  });
}
