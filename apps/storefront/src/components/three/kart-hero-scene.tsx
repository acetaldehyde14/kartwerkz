'use client';

import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import KartViewer from '@/components/kart/KartViewer';
import { DEFAULT_APPEARANCE, type KartAppearance } from '@/components/kart/graphics';
import { DEMO_DESIGNS } from '@/lib/three/demo-designs';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

/**
 * Quantization step count for wrapProgress. The kart viewer rebuilds five
 * 1024px canvas textures on every appearance change (see
 * components/kart/graphics.ts), so driving it from a continuous scroll
 * value would rebuild textures every frame — the viewer's own README
 * recommends quantizing scroll-driven reveals to ~40 steps.
 */
const WRAP_STEPS = 40;

function quantize(progress: number): number {
  return Math.round(Math.min(1, Math.max(0, progress)) * WRAP_STEPS) / WRAP_STEPS;
}

export interface KartHeroSceneProps {
  reducedMotion: boolean;
}

export default function KartHeroScene({ reducedMotion }: KartHeroSceneProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(reducedMotion ? 1 : 0);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [ready, setReady] = useState(false);

  const activeIndex = hoverIndex ?? selectedIndex;
  const activeDesign = DEMO_DESIGNS[activeIndex] ?? DEMO_DESIGNS[0]!;

  const appearance: KartAppearance = {
    ...DEFAULT_APPEARANCE,
    bodyColor: activeDesign.colours.primary,
    accentColor: activeDesign.colours.secondary,
    inkColor: activeDesign.colours.accent,
    wrapProgress: reducedMotion ? 1 : quantize(progress),
  };

  // Scroll-driven reveal (skipped entirely under reduced motion). Uses
  // gsap.context() — the recommended React integration pattern — rather
  // than a bare ScrollTrigger.create()/kill() pair, because React 19 Strict
  // Mode double-invokes effects in dev and a raw create/kill pair can leave
  // a stale/duplicate trigger whose measurements don't match the live DOM.
  useEffect(() => {
    if (reducedMotion || !stageRef.current) return;

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: stageRef.current,
        start: 'top top',
        end: '+=220%',
        pin: true,
        scrub: 0.6,
        onUpdate: (self) => setProgress(self.progress),
      });
    }, stageRef);

    return () => ctx.revert();
  }, [reducedMotion]);

  return (
    <div ref={stageRef} className="relative h-screen w-full overflow-hidden bg-background">
      <div className="absolute inset-0">
        <KartViewer
          appearance={appearance}
          view="perspective"
          autoRotate={!reducedMotion}
          enableZoom={false}
          onReady={() => setReady(true)}
        />
      </div>
      {!ready ? (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-surface-border border-t-accent" />
        </div>
      ) : null}

      {/* Stage indicator */}
      <div className="pointer-events-none absolute left-4 top-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-foreground-muted sm:left-8 sm:top-8">
        <span className="h-1.5 w-1.5 rounded-full bg-accent" />
        {progress < 0.08
          ? 'Plain bodywork'
          : progress < 0.95
            ? 'Applying livery…'
            : 'Fully wrapped'}
      </div>

      {/* Desktop design hover selector */}
      <div
        className="pointer-events-auto absolute right-4 top-1/2 hidden -translate-y-1/2 flex-col gap-3 sm:right-10 md:flex"
        aria-label="Preview a graphics design"
      >
        {DEMO_DESIGNS.map((design, index) => (
          <button
            key={design.id}
            type="button"
            onMouseEnter={() => setHoverIndex(index)}
            onMouseLeave={() => setHoverIndex(null)}
            onClick={() => setSelectedIndex(index)}
            className={`rounded border px-4 py-2 text-left text-xs font-bold uppercase tracking-wide transition-colors ${
              selectedIndex === index
                ? 'border-accent bg-accent text-accent-foreground'
                : 'border-surface-border bg-surface/80 text-foreground-muted hover:border-accent/60 hover:text-foreground'
            }`}
          >
            DESIGN {String(index + 1).padStart(2, '0')}
            <span className="mt-0.5 block text-[10px] font-medium normal-case tracking-normal opacity-80">
              {design.name}
            </span>
          </button>
        ))}
      </div>

      {/* Mobile touch-friendly carousel */}
      <div className="pointer-events-auto absolute inset-x-0 bottom-6 flex justify-center gap-2 md:hidden">
        {DEMO_DESIGNS.map((design, index) => (
          <button
            key={design.id}
            type="button"
            onClick={() => setSelectedIndex(index)}
            aria-label={`Preview ${design.name}`}
            className={`h-2.5 w-2.5 rounded-full transition-colors ${
              selectedIndex === index ? 'bg-accent' : 'bg-surface-border'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
