'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';

const KartHeroScene = dynamic(() => import('./kart-hero-scene'), {
  ssr: false,
  loading: () => <HeroFallback label="Loading 3D preview…" />,
});

function HeroFallback({ label }: { label: string }) {
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center gap-4 bg-background">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-surface-border border-t-accent" />
      <p className="text-xs uppercase tracking-[0.2em] text-foreground-muted">{label}</p>
    </div>
  );
}

function supportsWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas');
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
    );
  } catch {
    return false;
  }
}

/**
 * Entry point for the homepage's interactive kart animation. Isolated as a
 * client component dynamically imported with `ssr: false` so Three.js/R3F
 * never ships in the server-rendered bundle or blocks non-3D pages (see
 * docs/architecture.md#frontend-rendering-strategy). Handles the two cases
 * the heavy scene component shouldn't have to: no WebGL support, and
 * `prefers-reduced-motion`.
 */
export function KartHero() {
  const [ready, setReady] = useState(false);
  const [webglOk, setWebglOk] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    setWebglOk(supportsWebGL());
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(query.matches);
    const handler = (event: MediaQueryListEvent) => setReducedMotion(event.matches);
    query.addEventListener('change', handler);
    setReady(true);
    return () => query.removeEventListener('change', handler);
  }, []);

  if (!ready) {
    return <HeroFallback label="Preparing kart preview…" />;
  }

  if (!webglOk) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center gap-4 bg-gradient-to-b from-surface to-background px-6 text-center">
        <p className="max-w-md text-sm text-foreground-muted">
          Your browser doesn&apos;t support the interactive 3D preview. Head to the configurator to
          design your kit — every option is still fully available.
        </p>
      </div>
    );
  }

  return <KartHeroScene reducedMotion={reducedMotion} />;
}
