'use client';

import { useEffect, useState } from 'react';
import KartViewer from '@/components/kart/KartViewer';
import type { Finish, KartAppearance } from '@/components/kart/graphics';
import { useConfiguratorStore } from '@/stores/configurator-store';
import { MaterialFinish } from '@kartwerkz/shared';

const FINISH_MAP: Record<MaterialFinish, Finish> = {
  [MaterialFinish.GLOSS]: 'gloss',
  [MaterialFinish.MATTE]: 'matte',
  [MaterialFinish.CHROME]: 'chrome',
  [MaterialFinish.HOLOGRAPHIC]: 'holographic',
};

/** Decodes an object-URL image for use as `KartAppearance.logo`. Returns undefined while loading/absent. */
function useDecodedImage(url: string | undefined): HTMLImageElement | undefined {
  const [image, setImage] = useState<HTMLImageElement | undefined>(undefined);

  useEffect(() => {
    if (!url) {
      setImage(undefined);
      return;
    }
    let cancelled = false;
    const img = new Image();
    img.onload = () => {
      if (!cancelled) setImage(img);
    };
    img.src = url;
    return () => {
      cancelled = true;
    };
  }, [url]);

  return image;
}

export interface ConfiguratorViewerSceneProps {
  resetSignal: number;
}

export default function ConfiguratorViewerScene({ resetSignal }: ConfiguratorViewerSceneProps) {
  const colours = useConfiguratorStore((s) => s.colours);
  const driver = useConfiguratorStore((s) => s.driver);
  const finish = useConfiguratorStore((s) => s.finish);
  const logos = useConfiguratorStore((s) => s.logos);
  const logoPreviewUrls = useConfiguratorStore((s) => s.logoPreviewUrls);
  const [ready, setReady] = useState(false);

  // The viewer stamps a single logo image onto its demo graphics (see
  // components/kart/graphics.ts) rather than the richer multi-logo,
  // per-panel positioned placement model the API persists — only the first
  // uploaded logo gets a live preview here. All uploaded logos are still
  // recorded and sent to admin for manual artwork prep regardless; this is
  // a preview-fidelity limitation, not a data-loss one.
  const firstLogoUrl = logos[0] ? logoPreviewUrls[logos[0].uploadedAssetId] : undefined;
  const logoImage = useDecodedImage(firstLogoUrl);

  const appearance: KartAppearance = {
    bodyColor: colours.primary,
    accentColor: colours.secondary,
    inkColor: colours.accent,
    driverName: driver.name ?? '',
    number: driver.number ?? '',
    finish: FINISH_MAP[finish],
    wrapProgress: 1,
    logo: logoImage,
  };

  return (
    <div className="absolute inset-0">
      {/* Remounting on resetSignal is the simplest way to restore the
          viewer's internal OrbitControls to its default camera position —
          it has no imperative reset API, only `view` presets. */}
      <KartViewer
        key={resetSignal}
        appearance={appearance}
        view="perspective"
        onReady={() => setReady(true)}
      />
      {!ready ? (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-surface-border border-t-accent" />
        </div>
      ) : null}
    </div>
  );
}
