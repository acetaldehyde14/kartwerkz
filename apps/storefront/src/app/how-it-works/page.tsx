import type { Metadata } from 'next';
import { PageHeader } from '@/components/common/page-header';

export const metadata: Metadata = {
  title: 'How It Works',
  description:
    'From customizing your kit to delivery — the full Kartwerkz order and production workflow.',
};

const STEPS = [
  {
    title: 'Customize',
    description:
      'Design your kit in the live 3D configurator — kart model, design, colours, driver details, logos, and finish.',
  },
  {
    title: 'Cart',
    description: 'Review your configuration summary and pricing, then add it to your cart.',
  },
  { title: 'Checkout', description: 'Enter your shipping details and confirm your order.' },
  {
    title: 'Payment',
    description:
      'Pay securely via Stripe’s hosted checkout — we never see or store your card details.',
  },
  {
    title: 'Artwork Proof',
    description: 'Our design team prepares a production-ready proof from your configuration.',
  },
  { title: 'Approval', description: 'You review the proof and approve it, or request revisions.' },
  { title: 'Supplier', description: 'Once approved, the order is sent to our print/cut supplier.' },
  { title: 'Production', description: 'Your kit is printed, cut, and quality-checked.' },
  { title: 'Shipped', description: 'Your kit ships with tracking.' },
  { title: 'Delivered', description: 'It arrives at your door, ready to wrap your kart.' },
] as const;

export default function HowItWorksPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <PageHeader
        eyebrow="Process"
        title="How It Works"
        description="Every order follows the same transparent path from design to delivery."
      />

      <ol className="mt-16 space-y-10">
        {STEPS.map((step, index) => (
          <li key={step.title} className="relative flex gap-6 pl-2">
            <div className="flex flex-col items-center">
              <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-accent text-sm font-black text-accent-foreground">
                {index + 1}
              </span>
              {index < STEPS.length - 1 ? (
                <span className="mt-2 h-full w-px flex-1 bg-surface-border" aria-hidden="true" />
              ) : null}
            </div>
            <div className="pb-2">
              <h2 className="text-sm font-bold uppercase tracking-wide text-foreground">
                {step.title}
              </h2>
              <p className="mt-1 text-sm text-foreground-muted">{step.description}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
