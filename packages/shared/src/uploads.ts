export const ACCEPTED_ARTWORK_MIME_TYPES = [
  'image/png',
  'image/jpeg',
  'image/svg+xml',
  'application/pdf',
  'application/postscript', // .ai / .eps
  'application/illustrator',
] as const;

/** Formats the configurator can rasterize/display directly in the live 3D preview. */
export const PREVIEW_RENDERABLE_MIME_TYPES = ['image/png', 'image/jpeg', 'image/svg+xml'] as const;

export const MAX_UPLOAD_SIZE_BYTES = 25 * 1024 * 1024; // 25MB

export function isPreviewRenderable(mimeType: string): boolean {
  return (PREVIEW_RENDERABLE_MIME_TYPES as readonly string[]).includes(mimeType);
}
