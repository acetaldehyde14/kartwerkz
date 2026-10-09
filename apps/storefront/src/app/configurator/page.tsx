import type { Metadata } from 'next';
import { ConfiguratorShell } from './configurator-shell';

export const metadata: Metadata = {
  title: 'Configurator',
  description:
    'Design your kart graphics kit live: colours, driver number, sponsor logos, and finish.',
};

/**
 * SHELL/CHROME ONLY — see ConfiguratorShell for the layout + Zustand
 * wiring. The live 3D preview (R3F) is intentionally not implemented
 * here; see the TODO(3d-viewer) marker inside configurator-shell.tsx.
 */
export default function ConfiguratorPage() {
  return <ConfiguratorShell />;
}
