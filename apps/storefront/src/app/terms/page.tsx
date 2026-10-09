import type { Metadata } from 'next';
import { Callout } from '@/components/common/callout';

export const metadata: Metadata = {
  title: 'Terms of Service',
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <Callout>Draft content — requires legal review before production use.</Callout>

      <h1 className="font-display text-display-md font-black uppercase tracking-tight text-foreground">
        Terms of Service
      </h1>
      <p className="mt-2 text-sm text-foreground-muted">Last updated: 7 October 2026</p>

      <div className="prose prose-invert mt-10 max-w-none space-y-6 text-sm leading-relaxed text-foreground-muted">
        <section>
          <h2 className="text-base font-bold text-foreground">1. Acceptance of Terms</h2>
          <p>
            By using kartwerkz.example.com you agree to these Terms of Service. If you do not agree,
            please do not use the site.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-foreground">2. Orders &amp; Pricing</h2>
          <p>
            All prices are listed in Singapore Dollars (SGD) and are subject to change without
            notice. Orders are confirmed once payment is successfully processed via Stripe.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-foreground">3. Custom Goods</h2>
          <p>
            Each kit is manufactured to your specific configuration (colours, driver details, logos,
            finish). See our Customization Policy for intellectual property and artwork
            requirements.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-foreground">4. Artwork Approval</h2>
          <p>
            Production begins only after you approve a digital artwork proof. Once approved, the
            order enters production and cannot be cancelled or refunded for change-of-mind reasons.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-foreground">5. Limitation of Liability</h2>
          <p>
            To the extent permitted by Singapore law, Kartwerkz is not liable for indirect or
            consequential losses arising from use of our products or site.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-foreground">6. Governing Law</h2>
          <p>These terms are governed by the laws of the Republic of Singapore.</p>
        </section>
      </div>
    </div>
  );
}
