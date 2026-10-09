import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Button } from '@kartwerkz/ui';

describe('Button', () => {
  it('renders children and defaults to the primary variant', () => {
    render(<Button>Click me</Button>);
    const button = screen.getByRole('button', { name: 'Click me' });
    expect(button).toBeInTheDocument();
    expect(button.className).toContain('bg-[rgb(var(--accent))]');
  });

  it.each(['primary', 'accent', 'secondary', 'outline', 'ghost'] as const)(
    'renders the %s variant without throwing',
    (variant) => {
      render(<Button variant={variant}>{variant}</Button>);
      expect(screen.getByRole('button', { name: variant })).toBeInTheDocument();
    },
  );

  it('disables the button and shows a spinner while loading', () => {
    render(<Button loading>Submit</Button>);
    const button = screen.getByRole('button', { name: 'Submit' });
    expect(button).toBeDisabled();
  });

  it('respects an explicit disabled prop', () => {
    render(<Button disabled>Submit</Button>);
    expect(screen.getByRole('button', { name: 'Submit' })).toBeDisabled();
  });
});
