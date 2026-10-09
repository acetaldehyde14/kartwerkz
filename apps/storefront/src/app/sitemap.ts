import type { MetadataRoute } from 'next';
import { getSiteUrl } from '@/lib/site';

const STATIC_ROUTES = [
  '',
  '/custom-graphics',
  '/configurator',
  '/gallery',
  '/how-it-works',
  '/contact',
  '/login',
  '/register',
  '/privacy',
  '/terms',
  '/shipping',
  '/returns',
  '/customization-policy',
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = getSiteUrl();
  const now = new Date();

  return STATIC_ROUTES.map((route) => ({
    url: `${siteUrl}${route}`,
    lastModified: now,
    changeFrequency: route === '' ? 'daily' : 'weekly',
    priority: route === '' ? 1 : 0.6,
  }));
}
