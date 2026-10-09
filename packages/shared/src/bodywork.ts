/**
 * Canonical bodywork region identifiers for the demo kart model. Production
 * KartModel rows store their own `bodyworkRegions` JSON list in the
 * database (a model may not expose every region), but these constants give
 * the configurator and R3F viewer a stable set of names to key materials,
 * UV groups, and printable-area bounds off of. See docs/configurator.md.
 */
export const BODYWORK_REGIONS = [
  'chassis',
  'front_fairing',
  'nassau_panel',
  'left_sidepod',
  'right_sidepod',
  'rear_bumper',
  'seat',
  'steering_wheel',
  'wheels',
] as const;

export type BodyworkRegion = (typeof BODYWORK_REGIONS)[number];

/** Regions that accept livery/graphics textures (as opposed to fixed parts like wheels). */
export const PAINTABLE_BODYWORK_REGIONS: BodyworkRegion[] = [
  'front_fairing',
  'nassau_panel',
  'left_sidepod',
  'right_sidepod',
  'rear_bumper',
];

/** Regions a sponsor logo may be placed on, in the MVP placement system. */
export const LOGO_ELIGIBLE_REGIONS: BodyworkRegion[] = [
  'front_fairing',
  'nassau_panel',
  'left_sidepod',
  'right_sidepod',
];
