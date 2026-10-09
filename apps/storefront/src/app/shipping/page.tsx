import type { Metadata } from 'next';
import { Callout } from '@/components/common/callout';

export const metadata: Metadata = {
  title: 'Shipping',
};

export default function ShippingPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <Callout>Draft content — requires legal review before production use.</Callout>

      <h1 className="font-display text-display-md font-black uppercase tracking-tight text-foreground">
        Shipping
      </h1>

      <div className="prose prose-invert mt-10 max-w-none space-y-6 text-sm leading-relaxed text-foreground-muted">
        <section>
          <h2 className="text-base font-bold text-foreground">Production Time</h2>
          <p>
            Once your artwork proof is approved, kits typically enter production within 2-3 business
            days. Production and quality checks take a further 5-10 business days depending on
            finish and order volume.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-foreground">Shipping Within Singapore</h2>
          <p>
            Standard local delivery takes 2-4 business days after dispatch, via tracked courier.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-foreground">International Shipping</h2>
          <p>
            International delivery times vary by destination (typically 7-14 business days) and may
            be subject to import duties or taxes payable by the recipient.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-foreground">Tracking</h2>
          <p>You&apos;ll receive a tracking link by email as soon as your order ships.</p>
        </section>
      </div>
    </div>
  );
}
