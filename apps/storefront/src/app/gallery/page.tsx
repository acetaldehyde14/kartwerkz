import type { Metadata } from 'next';
import Link from 'next/link';
import { Badge, Card, CardContent } from '@kartwerkz/ui';
import { PageHeader } from '@/components/common/page-header';

export const metadata: Metadata = {
  title: 'Gallery',
  description: 'Browse our demo livery designs, then take any of them into the live configurator.',
};

/**
 * Presentation of the 3 demo graphics designs — NOT a catalog of
 * separate products (there is exactly one product: the kit itself).
 * Placeholder imagery (styled gradients) stands in for real renders
 * until the API/asset pipeline is wired up.
 */
const DEMO_DESIGNS = [
  {
    name: 'Apex Livery',
    tier: 'PREMADE',
    gradient: 'from-accent via-accent/40 to-background',
  },
  {
    name: 'Carbon Circuit',
    tier: 'SEMI_CUSTOM',
    gradient: 'from-secondary via-secondary/30 to-background',
  },
  {
    name: 'Full Send',
    tier: 'FULL_CUSTOM',
    gradient: 'from-foreground/30 via-accent/30 to-background',
  },
] as const;

export default function GalleryPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
      <PageHeader
        eyebrow="Gallery"
        title="Demo Liveries"
        description="Placeholder imagery — real renders come from the live 3D configurator and production proofs. Pick a starting point and make it yours."
      />

      <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {DEMO_DESIGNS.map((design) => (
          <Link key={design.name} href="/configurator" className="group block">
            <Card className="overflow-hidden transition-colors group-hover:border-accent">
              <div
                className={`flex h-56 w-full items-center justify-center bg-gradient-to-br ${design.gradient} text-xs uppercase tracking-wide text-foreground-muted`}
              >
                Placeholder render
              </div>
              <CardContent className="flex items-center justify-between pt-4">
                <div>
                  <p className="text-sm font-bold uppercase tracking-wide text-foreground">
                    {design.name}
                  </p>
                  <p className="mt-1 text-xs text-foreground-muted">
                    Tap to customise in the configurator
                  </p>
                </div>
                <Badge variant="outline">{design.tier.replace('_', ' ')}</Badge>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
