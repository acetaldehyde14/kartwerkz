/** Site-wide constants used by metadata, sitemap, robots, and layout. */
export const SITE_NAME = 'Kartwerkz';
export const SITE_DESCRIPTION =
  'Custom kart graphics kits, built around your identity. Design your livery, upload sponsor logos, and ship it to the grid.';

export function getSiteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
}
