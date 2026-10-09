import type { MetadataRoute } from 'next';
import { getSiteUrl } from '@/lib/site';

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl();

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/account', '/admin', '/checkout', '/cart'],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
