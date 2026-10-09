import type { Metadata } from 'next';
import Link from 'next/link';
import { getProducts } from '@kartwerkz/api-client';
import type { Product } from '@kartwerkz/api-client';
import { Button, Card, CardContent } from '@kartwerkz/ui';
import { money } from '@kartwerkz/shared';
import { formatFromPrice, getDevPlaceholderPrice } from '@/lib/pricing';
import { PageHeader } from '@/components/common/page-header';

export const metadata: Metadata = {
  title: 'Custom Kart Graphics Kit',
  description:
    'One product, infinite liveries. Design your kart graphics kit in the live configurator: colours, sponsor logos, driver number, and finish.',
};

const PROCESS_STEPS = [
  {
    title: 'Choose your kart',
    description: 'Select your manufacturer and model so the fit is exact.',
  },
  {
    title: 'Pick a starting design',
    description: 'Start from a premade livery or build full-custom.',
  },
  {
    title: 'Personalise',
    description: 'Colours, driver name/number, country flag, sponsor logos, finish.',
  },
  {
    title: 'Approve your proof',
    description: 'We render a production proof for your sign-off before printing.',
  },
] as const;

/**
 * Server Component — fetches the product from the API where available,
 * but the API may not be running in every environment this page is
 * rendered in, so a try/catch falls back to static copy rather than
 * failing the whole page.
 */
async function getCustomGraphicsProduct(): Promise<Product | null> {
  try {
    const products = await getProducts();
    return products[0] ?? null;
  } catch {
    return null;
  }
}

export default async function CustomGraphicsPage() {
  const product = await getCustomGraphicsProduct();
  const price = product
    ? money(product.basePriceMinorUnits, product.currency)
    : getDevPlaceholderPrice(); // dev placeholder pricing

  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
      <PageHeader
        eyebrow="The Product"
        title={product?.name ?? 'Custom Kart Graphics Kit'}
        description={
          product?.description ??
          'A full livery kit, cut and printed to your kart model, designed by you in our live 3D configurator. One product. Every combination.'
        }
      />

      <div className="mx-auto mt-10 flex flex-col items-center gap-6">
        <div className="flex h-72 w-full max-w-2xl items-center justify-center rounded border border-surface-border bg-surface text-sm text-foreground-muted">
          Product hero image placeholder
        </div>

        <p className="text-sm font-semibold uppercase tracking-wide text-foreground-muted">
          {formatFromPrice(price)}
        </p>

        <Button asChild size="lg" variant="accent">
          <Link href="/configurator">CUSTOMIZE YOUR KIT</Link>
        </Button>
      </div>

      <div className="mt-24">
        <h2 className="text-center text-xs font-semibold uppercase tracking-[0.3em] text-accent">
          How it comes together
        </h2>
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PROCESS_STEPS.map((step, index) => (
            <Card key={step.title}>
              <CardContent className="pt-6">
                <p className="text-3xl font-black text-accent">
                  {String(index + 1).padStart(2, '0')}
                </p>
                <p className="mt-3 text-sm font-semibold uppercase tracking-wide text-foreground">
                  {step.title}
                </p>
                <p className="mt-2 text-sm text-foreground-muted">{step.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div className="mt-16 flex justify-center">
        <Button asChild variant="outline" size="lg">
          <Link href="/how-it-works">SEE THE FULL PROCESS</Link>
        </Button>
      </div>
    </div>
  );
}
