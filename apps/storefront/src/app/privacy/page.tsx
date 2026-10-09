import type { Metadata } from 'next';
import { Callout } from '@/components/common/callout';

export const metadata: Metadata = {
  title: 'Privacy Policy',
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <Callout>Draft content — requires legal review before production use.</Callout>

      <h1 className="font-display text-display-md font-black uppercase tracking-tight text-foreground">
        Privacy Policy
      </h1>
      <p className="mt-2 text-sm text-foreground-muted">Last updated: 7 October 2026</p>

      <div className="prose prose-invert mt-10 max-w-none space-y-6 text-sm leading-relaxed text-foreground-muted">
        <section>
          <h2 className="text-base font-bold text-foreground">1. Who We Are</h2>
          <p>
            Kartwerkz (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;) operates
            kartwerkz.example.com, a self-hosted ecommerce platform selling custom karting graphics
            kits. This policy explains how we collect, use, and protect your personal data in
            accordance with Singapore&apos;s Personal Data Protection Act (PDPA).
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-foreground">2. Data We Collect</h2>
          <p>
            Account details (name, email, password hash), shipping and billing address, order and
            configuration history, uploaded artwork/logo files, payment status (processed by Stripe
            — we do not store card numbers), and basic usage/analytics data.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-foreground">3. How We Use Your Data</h2>
          <p>
            To process and fulfil orders, produce artwork proofs, communicate order status, respond
            to support requests, and improve our products. We do not sell your personal data.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-foreground">4. Third Parties</h2>
          <p>
            We share data with service providers strictly as needed to deliver our service: payment
            processing (Stripe), email delivery, object storage for uploaded artwork, and our
            print/cut supplier for production.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-foreground">5. Your Rights</h2>
          <p>
            Under the PDPA, you may request access to, correction of, or withdrawal of consent for
            the use of your personal data. Contact us at support@kartwerkz.example.com to make a
            request.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-foreground">6. Data Retention</h2>
          <p>
            We retain order and account data for as long as necessary to fulfil legal, accounting,
            and business purposes, after which it is securely deleted or anonymised.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-foreground">7. Contact</h2>
          <p>For any privacy-related queries, email support@kartwerkz.example.com.</p>
        </section>
      </div>
    </div>
  );
}
