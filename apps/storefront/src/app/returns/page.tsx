import type { Metadata } from 'next';
import { Callout } from '@/components/common/callout';

export const metadata: Metadata = {
  title: 'Returns',
};

export default function ReturnsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <Callout>Draft content — requires legal review before production use.</Callout>

      <h1 className="font-display text-display-md font-black uppercase tracking-tight text-foreground">
        Returns
      </h1>

      <div className="prose prose-invert mt-10 max-w-none space-y-6 text-sm leading-relaxed text-foreground-muted">
        <section>
          <h2 className="text-base font-bold text-foreground">Custom Goods Are Final Sale</h2>
          <p>
            Because every kit is manufactured to your personal configuration after you approve an
            artwork proof, we are generally unable to accept returns for change-of-mind reasons once
            production has begun.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-foreground">Manufacturing Defects</h2>
          <p>
            If your kit arrives damaged or with a manufacturing defect that does not match your
            approved proof, contact us within 7 days of delivery with photos. We will arrange a
            reprint or refund at no cost to you.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-foreground">Before You Approve</h2>
          <p>
            Please review your artwork proof carefully before approving — approval authorises
            production and is the last point at which changes can be made at no cost.
          </p>
        </section>
      </div>
    </div>
  );
}
