'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { Button } from '@kartwerkz/ui';

const ConfiguratorViewerScene = dynamic(() => import('./configurator-viewer-scene'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-surface-border border-t-accent" />
    </div>
  ),
});

/**
 * Live 3D preview mounted into the configurator's right-hand panel (see
 * app/configurator/configurator-shell.tsx). Dynamically imported so the
 * Three.js/R3F runtime never loads on routes other than /configurator and /.
 */
export function ConfiguratorViewer() {
  const [resetSignal, setResetSignal] = useState(0);

  return (
    <div className="relative h-full w-full">
      <ConfiguratorViewerScene resetSignal={resetSignal} />
      <div className="pointer-events-none absolute inset-x-0 bottom-4 flex justify-center gap-2 sm:justify-end sm:pr-4">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="pointer-events-auto"
          onClick={() => setResetSignal((n) => n + 1)}
        >
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          Reset camera
        </Button>
      </div>
      <p className="pointer-events-none absolute left-4 top-4 max-w-xs text-xs text-foreground-muted">
        Preview is an approximation — drag to rotate, scroll to zoom. Finish and colour appear
        slightly different under real studio/manufacturing lighting.
      </p>
    </div>
  );
}
