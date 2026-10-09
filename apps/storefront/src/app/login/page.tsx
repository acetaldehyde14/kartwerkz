'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useLogin } from '@kartwerkz/api-client';
import { Button, Card, CardContent, Input, Label } from '@kartwerkz/ui';

const loginSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Enter your password'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const login = useLogin();
  const [formError, setFormError] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (values: LoginFormValues) => {
    setFormError(null);
    try {
      await login.mutateAsync(values);
      router.push('/account');
    } catch {
      setFormError('Invalid email or password.');
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-24 sm:px-6 lg:px-8">
      <h1 className="text-center font-display text-display-md font-black uppercase tracking-tight text-foreground">
        Log In
      </h1>

      <Card className="mt-10">
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
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
                autoComplete="current-password"
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
              loading={login.isPending}
            >
              LOG IN
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-foreground-muted">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="text-foreground underline hover:text-accent">
              Register
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
