'use client';

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { formatMoney } from '@kartwerkz/shared';
import { cartSubtotal, useCart, useCreateCheckoutSession } from '@kartwerkz/api-client';
import { Button, Card, CardContent, Input, Label, Skeleton } from '@kartwerkz/ui';

const checkoutSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  fullName: z.string().min(2, 'Enter your full name'),
  line1: z.string().min(3, 'Enter your street address'),
  line2: z.string().optional(),
  city: z.string().min(1, 'Enter your city'),
  postalCode: z.string().min(3, 'Enter a valid postal code'),
  country: z.string().min(2, 'Enter your country'),
  phone: z.string().optional(),
});

type CheckoutFormValues = z.infer<typeof checkoutSchema>;

export default function CheckoutPage() {
  const { data: cart, isLoading: cartLoading } = useCart();
  const createCheckoutSession = useCreateCheckoutSession();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: { country: 'SG' },
  });

  const [submitError, setSubmitError] = React.useState<string | null>(null);

  const onSubmit = async (values: CheckoutFormValues) => {
    setSubmitError(null);
    try {
      // Stripe Checkout is hosted — this page never touches card details
      // directly. NOTE: the API's checkout endpoint currently only accepts
      // `contactEmail` (+ an optional pre-saved `shippingAddressId` for
      // signed-in customers via `POST /customers/me/addresses` — there is
      // no inline guest address endpoint yet). We still collect the
      // address below for the customer's own confirmation/record, but it
      // isn't persisted server-side until that endpoint exists — tracked
      // as a follow-up in docs/architecture.md.
      const session = await createCheckoutSession.mutateAsync({
        contactEmail: values.email,
      });
      window.location.href = session.checkoutUrl;
    } catch {
      setSubmitError(
        'We could not start checkout. The payment service may be unavailable — please try again shortly.',
      );
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="font-display text-display-md font-black uppercase tracking-tight text-foreground">
        Checkout
      </h1>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-[1fr_320px]"
      >
        <div className="space-y-6">
          <section className="space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wide text-foreground">Contact</h2>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" autoComplete="email" {...register('email')} />
              {errors.email ? (
                <p className="text-xs text-destructive">{errors.email.message}</p>
              ) : null}
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wide text-foreground">
              Shipping Address
            </h2>
            <div className="space-y-1.5">
              <Label htmlFor="fullName">Full Name</Label>
              <Input id="fullName" autoComplete="name" {...register('fullName')} />
              {errors.fullName ? (
                <p className="text-xs text-destructive">{errors.fullName.message}</p>
              ) : null}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="line1">Address Line 1</Label>
              <Input id="line1" autoComplete="address-line1" {...register('line1')} />
              {errors.line1 ? (
                <p className="text-xs text-destructive">{errors.line1.message}</p>
              ) : null}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="line2">Address Line 2 (optional)</Label>
              <Input id="line2" autoComplete="address-line2" {...register('line2')} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="city">City</Label>
                <Input id="city" autoComplete="address-level2" {...register('city')} />
                {errors.city ? (
                  <p className="text-xs text-destructive">{errors.city.message}</p>
                ) : null}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="postalCode">Postal Code</Label>
                <Input id="postalCode" autoComplete="postal-code" {...register('postalCode')} />
                {errors.postalCode ? (
                  <p className="text-xs text-destructive">{errors.postalCode.message}</p>
                ) : null}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="country">Country</Label>
                <Input id="country" autoComplete="country" {...register('country')} />
                {errors.country ? (
                  <p className="text-xs text-destructive">{errors.country.message}</p>
                ) : null}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone">Phone (optional)</Label>
                <Input id="phone" autoComplete="tel" {...register('phone')} />
              </div>
            </div>
          </section>

          {submitError ? <p className="text-sm text-destructive">{submitError}</p> : null}
        </div>

        <Card className="h-fit">
          <CardContent className="space-y-4 pt-6">
            <h2 className="text-sm font-bold uppercase tracking-wide text-foreground">
              Order Summary
            </h2>
            {cartLoading || !cart ? (
              <Skeleton className="h-24 w-full" />
            ) : (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-foreground-muted">
                  <span>Subtotal</span>
                  <span>{formatMoney(cartSubtotal(cart))}</span>
                </div>
                <div className="flex justify-between text-foreground-muted">
                  <span>Shipping</span>
                  <span>Calculated at checkout</span>
                </div>
                <div className="flex justify-between border-t border-surface-border pt-2 text-base font-bold text-foreground">
                  <span>Total</span>
                  <span>{formatMoney(cartSubtotal(cart))}</span>
                </div>
              </div>
            )}
            <Button
              type="submit"
              variant="accent"
              size="lg"
              className="w-full"
              loading={createCheckoutSession.isPending}
            >
              PAY SECURELY
            </Button>
            <p className="text-center text-xs text-foreground-muted">
              You&apos;ll be redirected to Stripe&apos;s secure hosted checkout to complete payment.
            </p>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
