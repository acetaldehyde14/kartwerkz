import { z } from 'zod';
import { MaterialFinish } from './enums';

/**
 * The kart graphics configuration format. Versioned so saved configurations
 * and purchased OrderItem.configurationSnapshot payloads remain valid even
 * as the schema evolves — see docs/configurator.md#schema-versioning.
 *
 * This is the "illustrative format" from the product spec, made concrete:
 * logos are a list of placements bound to a bodywork region, each referencing
 * an already-uploaded asset by id (never inline file data).
 */

export const HEX_COLOUR_REGEX = /^#[0-9A-Fa-f]{6}$/;

export const LogoPlacementSchema = z.object({
  uploadedAssetId: z.string().uuid(),
  bodyworkRegion: z.string().min(1),
  /** Normalized [0,1] coordinates within the region's printable area. */
  x: z.number().min(0).max(1),
  y: z.number().min(0).max(1),
  scale: z.number().min(0.1).max(3).default(1),
  rotationDegrees: z.number().min(-180).max(180).default(0),
});
export type LogoPlacement = z.infer<typeof LogoPlacementSchema>;

export const DriverDetailsSchema = z.object({
  name: z.string().trim().max(24).optional(),
  number: z
    .string()
    .trim()
    .regex(/^[0-9]{1,3}$/)
    .optional(),
  countryCode: z
    .string()
    .trim()
    .length(2)
    .regex(/^[A-Z]{2}$/)
    .optional(),
});
export type DriverDetails = z.infer<typeof DriverDetailsSchema>;

export const KitConfigurationV1Schema = z.object({
  schemaVersion: z.literal(1),
  kartModelId: z.string().uuid(),
  graphicsDesignId: z.string().uuid(),
  colours: z.object({
    primary: z.string().regex(HEX_COLOUR_REGEX),
    secondary: z.string().regex(HEX_COLOUR_REGEX),
    accent: z.string().regex(HEX_COLOUR_REGEX),
  }),
  driver: DriverDetailsSchema.default({}),
  finish: z.nativeEnum(MaterialFinish).default(MaterialFinish.GLOSS),
  logos: z.array(LogoPlacementSchema).max(6).default([]),
  specialInstructions: z.string().trim().max(1000).optional(),
});
export type KitConfigurationV1 = z.infer<typeof KitConfigurationV1Schema>;

/** Current schema version producers (configurator UI) should write. */
export const CURRENT_CONFIGURATION_SCHEMA_VERSION = 1;

export const KitConfigurationSchema = KitConfigurationV1Schema;
export type KitConfiguration = KitConfigurationV1;
