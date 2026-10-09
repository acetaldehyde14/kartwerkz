import { create } from 'zustand';
import {
  CURRENT_CONFIGURATION_SCHEMA_VERSION,
  MaterialFinish,
  type DriverDetails,
  type KitConfiguration,
  type LogoPlacement,
} from '@kartwerkz/shared';

/**
 * Configurator state ONLY — no 3D/rendering logic lives here. The R3F
 * viewer (built separately, see apps/configurator/page.tsx TODO(3d-viewer))
 * subscribes to this store to know what to render; this file just owns
 * the data shape and its mutations, matching @kartwerkz/shared's
 * KitConfigurationSchema so `toKitConfiguration()` always produces a
 * valid payload to send to `POST /configurations`.
 */

export const MAX_LOGOS = 6;

export type ConfiguratorPanel = 'kart' | 'design' | 'colours' | 'driver' | 'logos' | 'finish';

export interface ConfiguratorState {
  kartModelId: string | null;
  graphicsDesignId: string | null;
  /**
   * The selected design's slug (e.g. "design-001"), set alongside
   * `graphicsDesignId`. UI-only — never sent to the API. The 3D viewer uses
   * this (not the real UUID `graphicsDesignId`) to pick which locally-known
   * procedural livery pattern to render, since the demo livery textures are
   * generated client-side and keyed by slug, not by database id.
   */
  graphicsDesignSlug: string | null;
  colours: {
    primary: string;
    secondary: string;
    accent: string;
  };
  driver: DriverDetails;
  finish: MaterialFinish;
  logos: LogoPlacement[];
  specialInstructions: string;

  // UI-only state (not part of the persisted configuration payload)
  activePanel: ConfiguratorPanel;
  mobileSheetOpen: boolean;
  /**
   * Client-only object-URL previews keyed by uploadedAssetId, used ONLY so
   * the 3D viewer has something to render before a real upload pipeline is
   * connected (see ConfiguratorShell's Logos panel). Never sent to the API
   * and never read by `toKitConfiguration` — the real preview texture for
   * a persisted logo comes from `GET /uploads/:id/signed-url`.
   */
  logoPreviewUrls: Record<string, string>;

  setKartModel: (kartModelId: string) => void;
  setGraphicsDesign: (graphicsDesignId: string, slug?: string) => void;
  setColour: (channel: 'primary' | 'secondary' | 'accent', hex: string) => void;
  setDriver: (driver: Partial<DriverDetails>) => void;
  setFinish: (finish: MaterialFinish) => void;
  addLogo: (logo: LogoPlacement, previewUrl?: string) => boolean;
  updateLogo: (index: number, logo: Partial<LogoPlacement>) => void;
  removeLogo: (index: number) => void;
  setSpecialInstructions: (value: string) => void;
  setActivePanel: (panel: ConfiguratorPanel) => void;
  setMobileSheetOpen: (open: boolean) => void;
  reset: () => void;
}

const DEFAULT_COLOURS = {
  primary: '#0A0A0B',
  secondary: '#FF3131',
  accent: '#FAFAFA',
};

const initialState = {
  kartModelId: null,
  graphicsDesignId: null,
  graphicsDesignSlug: null as string | null,
  colours: DEFAULT_COLOURS,
  driver: {},
  finish: MaterialFinish.GLOSS,
  logos: [],
  specialInstructions: '',
  activePanel: 'kart' as ConfiguratorPanel,
  mobileSheetOpen: false,
  logoPreviewUrls: {} as Record<string, string>,
};

export const useConfiguratorStore = create<ConfiguratorState>((set, get) => ({
  ...initialState,

  setKartModel: (kartModelId) => set({ kartModelId }),

  setGraphicsDesign: (graphicsDesignId, slug) =>
    set({ graphicsDesignId, graphicsDesignSlug: slug ?? null }),

  setColour: (channel, hex) => set((state) => ({ colours: { ...state.colours, [channel]: hex } })),

  setDriver: (driver) => set((state) => ({ driver: { ...state.driver, ...driver } })),

  setFinish: (finish) => set({ finish }),

  /** Returns false (and leaves state unchanged) once MAX_LOGOS is reached. */
  addLogo: (logo, previewUrl) => {
    const { logos, logoPreviewUrls } = get();
    if (logos.length >= MAX_LOGOS) {
      return false;
    }
    set({
      logos: [...logos, logo],
      logoPreviewUrls: previewUrl
        ? { ...logoPreviewUrls, [logo.uploadedAssetId]: previewUrl }
        : logoPreviewUrls,
    });
    return true;
  },

  updateLogo: (index, logo) =>
    set((state) => ({
      logos: state.logos.map((existing, i) => (i === index ? { ...existing, ...logo } : existing)),
    })),

  removeLogo: (index) => set((state) => ({ logos: state.logos.filter((_, i) => i !== index) })),

  setSpecialInstructions: (value) => set({ specialInstructions: value }),

  setActivePanel: (panel) => set({ activePanel: panel }),

  setMobileSheetOpen: (open) => set({ mobileSheetOpen: open }),

  reset: () => set(initialState),
}));

/**
 * Projects the current store state into the versioned KitConfiguration
 * payload shape. Returns null if required fields (kart model, design)
 * haven't been selected yet — callers should guard on this before
 * calling `createConfiguration` from @kartwerkz/api-client.
 */
export function toKitConfiguration(state: ConfiguratorState): KitConfiguration | null {
  if (!state.kartModelId || !state.graphicsDesignId) {
    return null;
  }
  return {
    schemaVersion: CURRENT_CONFIGURATION_SCHEMA_VERSION,
    kartModelId: state.kartModelId,
    graphicsDesignId: state.graphicsDesignId,
    colours: state.colours,
    driver: state.driver,
    finish: state.finish,
    logos: state.logos,
    specialInstructions: state.specialInstructions || undefined,
  };
}
