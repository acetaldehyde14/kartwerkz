import * as T from 'three';
import { PANEL_NAMES, type KartModel, type PanelName } from './createKart';

/**
 * Extended from the upstream kit's `'gloss' | 'matte'` to the four finishes
 * Kartwerkz actually sells (see packages/shared/src/enums.ts MaterialFinish)
 * — 'chrome'/'holographic' are approximated via metalness/clearcoat below,
 * same disclosed-approximation caveat as the rest of this preview.
 */
export type Finish = 'gloss' | 'matte' | 'chrome' | 'holographic';

export interface KartAppearance {
  bodyColor: string;
  accentColor: string;
  inkColor: string;
  driverName: string;
  number: string;
  finish: Finish;
  /** 0 = plain plastics; 1 = fully wrapped. Can be driven by scroll progress. */
  wrapProgress: number;
  /** Decoded images owned by your application, per panel. See UV templates. */
  panelArtwork?: Partial<Record<PanelName, CanvasImageSource>>;
  logo?: CanvasImageSource;
}
export const DEFAULT_APPEARANCE: KartAppearance = {
  bodyColor: '#146ce0',
  accentColor: '#d6ef45',
  inkColor: '#f4f5ed',
  driverName: 'KARTWERKZ',
  number: '27',
  finish: 'gloss',
  wrapProgress: 0,
};

function applyFinish(mat: T.MeshPhysicalMaterial, finish: Finish) {
  switch (finish) {
    case 'gloss':
      mat.metalness = 0;
      mat.roughness = 0.25;
      mat.clearcoat = 1;
      mat.clearcoatRoughness = 0.1;
      mat.iridescence = 0;
      break;
    case 'matte':
      mat.metalness = 0;
      mat.roughness = 0.72;
      mat.clearcoat = 0.05;
      mat.clearcoatRoughness = 0.5;
      mat.iridescence = 0;
      break;
    case 'chrome':
      mat.metalness = 1;
      mat.roughness = 0.08;
      mat.clearcoat = 1;
      mat.clearcoatRoughness = 0.05;
      mat.iridescence = 0;
      break;
    case 'holographic':
      // Three's iridescence model approximates a colour-shifting clearcoat —
      // the closest built-in stand-in for a holographic vinyl finish. See
      // docs/configurator.md: this is a preview approximation, not accurate
      // under real studio/manufacturing lighting.
      mat.metalness = 0.6;
      mat.roughness = 0.15;
      mat.clearcoat = 1;
      mat.clearcoatRoughness = 0.1;
      mat.iridescence = 1;
      mat.iridescenceIOR = 1.3;
      mat.iridescenceThicknessRange = [100, 400];
      break;
  }
  mat.needsUpdate = true;
}

/** Preview textures only. These UVs are NOT supplier cutting/print templates. */
export function applyAppearance(model: KartModel, appearance: KartAppearance): () => void {
  const textures: T.CanvasTexture[] = [];
  for (const name of PANEL_NAMES) {
    const c = document.createElement('canvas');
    c.width = 1024;
    c.height = 1024;
    const ctx = c.getContext('2d');
    if (!ctx) continue;
    ctx.fillStyle = name === 'rear-bumper' ? '#22262a' : appearance.bodyColor;
    ctx.fillRect(0, 0, 1024, 1024);
    ctx.save();
    ctx.beginPath();
    const progress = Math.min(
      1,
      Math.max(0, Number.isFinite(appearance.wrapProgress) ? appearance.wrapProgress : 0),
    );
    ctx.rect(0, 0, Math.ceil(1024 * progress), 1024);
    ctx.clip();
    const artwork = appearance.panelArtwork?.[name];
    if (artwork) ctx.drawImage(artwork, 0, 0, 1024, 1024);
    else {
      // Diagonal graphic demo. All logos/lettering are original placeholders.
      ctx.fillStyle = '#101a29';
      ctx.beginPath();
      ctx.moveTo(0, 680);
      ctx.lineTo(1024, 190);
      ctx.lineTo(1024, 430);
      ctx.lineTo(0, 920);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = appearance.accentColor;
      ctx.beginPath();
      ctx.moveTo(0, 610);
      ctx.lineTo(1024, 120);
      ctx.lineTo(1024, 188);
      ctx.lineTo(0, 678);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = appearance.inkColor;
      ctx.beginPath();
      ctx.moveTo(0, 580);
      ctx.lineTo(1024, 90);
      ctx.lineTo(1024, 106);
      ctx.lineTo(0, 596);
      ctx.closePath();
      ctx.fill();
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      if (name === 'nassau-panel') {
        ctx.fillStyle = appearance.accentColor;
        ctx.fillRect(320, 185, 384, 190);
        ctx.fillStyle = '#111820';
        ctx.font = '900 italic 155px Arial';
        ctx.fillText(appearance.number.slice(0, 3), 512, 285, 340);
        ctx.fillStyle = appearance.inkColor;
        ctx.font = '900 italic 52px Arial';
        ctx.fillText(appearance.driverName.slice(0, 24), 512, 810, 650);
      } else if (name === 'front-bumper' || name === 'rear-bumper') {
        // On the front face of this swept section, canvas Y runs upwards.
        ctx.save();
        ctx.translate(512, 256);
        ctx.scale(1, -1);
        ctx.fillStyle = appearance.inkColor;
        ctx.font = '900 italic 66px Arial';
        ctx.fillText(appearance.driverName.slice(0, 24), 0, 0, 820);
        ctx.restore();
      } else {
        ctx.fillStyle = appearance.inkColor;
        ctx.font = '900 italic 66px Arial';
        ctx.fillText(appearance.driverName.slice(0, 24), 512, 470, 820);
        ctx.font = '900 italic 100px Arial';
        ctx.fillText(appearance.number.slice(0, 3), 820, 700, 160);
      }
      if (appearance.logo)
        ctx.drawImage(appearance.logo, 390, name === 'nassau-panel' ? 650 : 530, 244, 120);
    }
    ctx.restore();
    const texture = new T.CanvasTexture(c);
    texture.colorSpace = T.SRGBColorSpace;
    texture.anisotropy = 4;
    texture.name = name + '-graphics';
    textures.push(texture);
    const mat = model.panels[name].material;
    mat.color.set('#ffffff');
    mat.map = texture;
    applyFinish(mat, appearance.finish);
  }
  return () => {
    for (const name of PANEL_NAMES)
      if (textures.includes(model.panels[name].material.map as T.CanvasTexture))
        model.panels[name].material.map = null;
    textures.forEach((t) => t.dispose());
  };
}
