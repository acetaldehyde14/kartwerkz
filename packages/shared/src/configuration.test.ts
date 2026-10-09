import { describe, expect, it } from 'vitest';
import { KitConfigurationSchema } from './configuration';
import { MaterialFinish } from './enums';

const validLogo = {
  uploadedAssetId: '11111111-1111-1111-1111-111111111111',
  bodyworkRegion: 'front_fairing',
  x: 0.5,
  y: 0.5,
  scale: 1,
  rotationDegrees: 0,
};

const baseConfig = {
  schemaVersion: 1 as const,
  kartModelId: '22222222-2222-2222-2222-222222222222',
  graphicsDesignId: '33333333-3333-3333-3333-333333333333',
  colours: { primary: '#0A0A0B', secondary: '#FF3131', accent: '#FFFFFF' },
};

describe('KitConfigurationSchema', () => {
  it('accepts a minimal valid configuration and fills in defaults', () => {
    const result = KitConfigurationSchema.parse(baseConfig);
    expect(result.finish).toBe(MaterialFinish.GLOSS);
    expect(result.logos).toEqual([]);
    expect(result.driver).toEqual({});
  });

  it('rejects a non-hex colour', () => {
    expect(() =>
      KitConfigurationSchema.parse({
        ...baseConfig,
        colours: { ...baseConfig.colours, primary: 'red' },
      }),
    ).toThrow();
  });

  it('rejects more than 6 logo placements', () => {
    const logos = Array.from({ length: 7 }, (_, i) => ({ ...validLogo, x: i / 7 }));
    expect(() => KitConfigurationSchema.parse({ ...baseConfig, logos })).toThrow();
  });

  it('accepts exactly 6 logo placements', () => {
    const logos = Array.from({ length: 6 }, (_, i) => ({ ...validLogo, x: i / 6 }));
    const result = KitConfigurationSchema.parse({ ...baseConfig, logos });
    expect(result.logos).toHaveLength(6);
  });

  it('rejects a logo placement outside the normalized [0,1] range', () => {
    expect(() =>
      KitConfigurationSchema.parse({ ...baseConfig, logos: [{ ...validLogo, x: 1.5 }] }),
    ).toThrow();
  });

  it('rejects a race number containing non-digits', () => {
    expect(() =>
      KitConfigurationSchema.parse({ ...baseConfig, driver: { number: 'GP1' } }),
    ).toThrow();
  });

  it('accepts a valid driver number, name, and country code', () => {
    const result = KitConfigurationSchema.parse({
      ...baseConfig,
      driver: { name: 'MAX', number: '23', countryCode: 'SG' },
    });
    expect(result.driver).toEqual({ name: 'MAX', number: '23', countryCode: 'SG' });
  });
});
