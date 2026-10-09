'use client';

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useSendContactMessage } from '@kartwerkz/api-client';
import { Button, Card, CardContent, Input, Label, Textarea } from '@kartwerkz/ui';
import { PageHeader } from '@/components/common/page-header';

const contactSchema = z.object({
  name: z.string().min(2, 'Enter your name'),
  email: z.string().email('Enter a valid email address'),
  message: z.string().min(10, 'Tell us a little more (at least 10 characters)'),
});

type ContactFormValues = z.infer<typeof contactSchema>;

export default function ContactPage() {
  const sendMessage = useSendContactMessage();
  const [submitted, setSubmitted] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ContactFormValues>({ resolver: zodResolver(contactSchema) });

  const onSubmit = async (values: ContactFormValues) => {
    setFormError(null);
    try {
      await sendMessage.mutateAsync(values);
      setSubmitted(true);
      reset();
    } catch {
      setFormError('We could not send your message right now. Please email us directly instead.');
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <PageHeader
        eyebrow="Contact"
        title="Get In Touch"
        description="Questions about an order, a custom build, or a bulk team order? We're here."
      />

      <div className="mt-12 grid grid-cols-1 gap-10 lg:grid-cols-[1fr_280px]">
        <Card>
          <CardContent className="pt-6">
            {submitted ? (
              <p className="text-sm text-foreground">
                Thanks — your message has been sent. We&apos;ll get back to you within 1-2 business
                days.
              </p>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <div className="space-y-1.5">
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" {...register('name')} />
                  {errors.name ? (
                    <p className="text-xs text-destructive">{errors.name.message}</p>
                  ) : null}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" {...register('email')} />
                  {errors.email ? (
                    <p className="text-xs text-destructive">{errors.email.message}</p>
                  ) : null}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="message">Message</Label>
                  <Textarea id="message" rows={5} {...register('message')} />
                  {errors.message ? (
                    <p className="text-xs text-destructive">{errors.message.message}</p>
                  ) : null}
                </div>

                {formError ? <p className="text-sm text-destructive">{formError}</p> : null}

                <Button
                  type="submit"
                  variant="accent"
                  size="lg"
                  className="w-full"
                  loading={sendMessage.isPending}
                >
                  SEND MESSAGE
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4 text-sm text-foreground-muted">
          <div>
            <p className="font-semibold uppercase tracking-wide text-foreground">Email</p>
            <p>support@kartwerkz.example.com</p>
          </div>
          <div>
            <p className="font-semibold uppercase tracking-wide text-foreground">Hours</p>
            <p>Mon–Fri, 9am–6pm SGT</p>
          </div>
          <div>
            <p className="font-semibold uppercase tracking-wide text-foreground">Based In</p>
            <p>Singapore</p>
          </div>
        </div>
      </div>
    </div>
  );
}
