'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useRegister } from '@kartwerkz/api-client';
import { Button, Card, CardContent, Input, Label } from '@kartwerkz/ui';

const registerSchema = z.object({
  name: z.string().min(2, 'Enter your name'),
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const registerMutation = useRegister();
  const [formError, setFormError] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({ resolver: zodResolver(registerSchema) });

  const onSubmit = async (values: RegisterFormValues) => {
    setFormError(null);
    try {
      await registerMutation.mutateAsync(values);
      router.push('/account');
    } catch {
      setFormError('We could not create your account. The email may already be in use.');
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-24 sm:px-6 lg:px-8">
      <h1 className="text-center font-display text-display-md font-black uppercase tracking-tight text-foreground">
        Register
      </h1>

      <Card className="mt-10">
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="name">Name</Label>
              <Input id="name" autoComplete="name" {...register('name')} />
              {errors.name ? (
                <p className="text-xs text-destructive">{errors.name.message}</p>
              ) : null}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" autoComplete="email" {...register('email')} />
              {errors.email ? (
                <p className="text-xs text-destructive">{errors.email.message}</p>
              ) : null}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                {...register('password')}
              />
              {errors.password ? (
                <p className="text-xs text-destructive">{errors.password.message}</p>
              ) : null}
            </div>

            {formError ? <p className="text-sm text-destructive">{formError}</p> : null}

            <Button
              type="submit"
              variant="accent"
              size="lg"
              className="w-full"
              loading={registerMutation.isPending}
            >
              CREATE ACCOUNT
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-foreground-muted">
            Already have an account?{' '}
            <Link href="/login" className="text-foreground underline hover:text-accent">
              Log in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
