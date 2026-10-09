import type { Metadata } from 'next';
import { Callout } from '@/components/common/callout';

export const metadata: Metadata = {
  title: 'Customization Policy',
};

export default function CustomizationPolicyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <Callout>Draft content — requires legal review before production use.</Callout>

      <h1 className="font-display text-display-md font-black uppercase tracking-tight text-foreground">
        Customization Policy
      </h1>

      <div className="prose prose-invert mt-10 max-w-none space-y-6 text-sm leading-relaxed text-foreground-muted">
        <section>
          <h2 className="text-base font-bold text-foreground">Your Content, Your Responsibility</h2>
          <p>
            When you upload a logo, image, or other artwork to your configuration, you confirm that
            you own it or otherwise have the right to use and reproduce it, and that it does not
            infringe any third party&apos;s intellectual property rights.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-foreground">Prohibited Content</h2>
          <p>
            We reserve the right to refuse to print any configuration containing content that is
            unlawful, infringing, hateful, or otherwise inappropriate, at our sole discretion.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-foreground">File Requirements</h2>
          <p>
            Accepted formats: PNG, JPEG, SVG, PDF, AI, EPS, up to 25MB per file. Vector formats
            (SVG, AI, EPS) generally produce the best print quality for logos and sponsor marks.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-foreground">Colour Accuracy</h2>
          <p>
            Screen colours may differ slightly from the final printed result due to display
            calibration and print material. Your artwork proof reflects our best estimate of the
            final print colours.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-foreground">Indemnity</h2>
          <p>
            You agree to indemnify Kartwerkz against any claim arising from content you upload or
            submit for production.
          </p>
        </section>
      </div>
    </div>
  );
}
