import { beforeEach, describe, expect, it } from 'vitest';
import { MaterialFinish, type LogoPlacement } from '@kartwerkz/shared';
import { MAX_LOGOS, toKitConfiguration, useConfiguratorStore } from '@/stores/configurator-store';

function makeLogo(overrides: Partial<LogoPlacement> = {}): LogoPlacement {
  return {
    uploadedAssetId: '11111111-1111-1111-1111-111111111111',
    bodyworkRegion: 'front_fairing',
    x: 0.5,
    y: 0.5,
    scale: 1,
    rotationDegrees: 0,
    ...overrides,
  };
}

describe('useConfiguratorStore', () => {
  beforeEach(() => {
    useConfiguratorStore.getState().reset();
  });

  it('updates a single colour channel without touching the others', () => {
    const { setColour } = useConfiguratorStore.getState();
    const before = useConfiguratorStore.getState().colours;

    setColour('accent', '#112233');

    const after = useConfiguratorStore.getState().colours;
    expect(after.accent).toBe('#112233');
    expect(after.primary).toBe(before.primary);
    expect(after.secondary).toBe(before.secondary);
  });

  it('merges partial driver detail updates', () => {
    const { setDriver } = useConfiguratorStore.getState();

    setDriver({ name: 'M. SCHUMACHER' });
    setDriver({ number: '44' });

    const { driver } = useConfiguratorStore.getState();
    expect(driver.name).toBe('M. SCHUMACHER');
    expect(driver.number).toBe('44');
  });

  it('sets the finish', () => {
    useConfiguratorStore.getState().setFinish(MaterialFinish.MATTE);
    expect(useConfiguratorStore.getState().finish).toBe(MaterialFinish.MATTE);
  });

  it('adds logo placements up to MAX_LOGOS and rejects further additions', () => {
    const { addLogo } = useConfiguratorStore.getState();

    for (let i = 0; i < MAX_LOGOS; i++) {
      expect(addLogo(makeLogo({ x: i / MAX_LOGOS }))).toBe(true);
    }
    expect(useConfiguratorStore.getState().logos).toHaveLength(MAX_LOGOS);

    const rejected = addLogo(makeLogo({ x: 0.99 }));
    expect(rejected).toBe(false);
    expect(useConfiguratorStore.getState().logos).toHaveLength(MAX_LOGOS);
  });

  it('removes a logo placement by index', () => {
    const { addLogo, removeLogo } = useConfiguratorStore.getState();
    addLogo(makeLogo({ bodyworkRegion: 'left_sidepod' }));
    addLogo(makeLogo({ bodyworkRegion: 'right_sidepod' }));

    removeLogo(0);

    const { logos } = useConfiguratorStore.getState();
    expect(logos).toHaveLength(1);
    expect(logos[0]?.bodyworkRegion).toBe('right_sidepod');
  });

  it('toKitConfiguration returns null until a kart model and design are selected', () => {
    expect(toKitConfiguration(useConfiguratorStore.getState())).toBeNull();

    useConfiguratorStore.getState().setKartModel('22222222-2222-2222-2222-222222222222');
    expect(toKitConfiguration(useConfiguratorStore.getState())).toBeNull();

    useConfiguratorStore.getState().setGraphicsDesign('33333333-3333-3333-3333-333333333333');
    const config = toKitConfiguration(useConfiguratorStore.getState());

    expect(config).not.toBeNull();
    expect(config?.schemaVersion).toBe(1);
    expect(config?.kartModelId).toBe('22222222-2222-2222-2222-222222222222');
    expect(config?.graphicsDesignId).toBe('33333333-3333-3333-3333-333333333333');
  });
});
