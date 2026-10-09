/**
 * The 3 illustrative demo graphics designs (mirrors apps/api/prisma/seed.ts
 * design-001/002/003's defaultColours exactly). Used by the homepage hero's
 * DESIGN 01/02/03 selector and as the configurator's starting palette when a
 * design is picked — in both cases this only supplies the colour triple;
 * the actual graphic layout comes from the shared kart viewer's built-in
 * demo artwork (apps/storefront/src/components/kart/graphics.ts), recoloured
 * per design. Kept local rather than always fetched so the homepage hero
 * renders instantly and still works if the API isn't reachable (see
 * docs/configurator.md) — NOT the source of truth for anything persisted.
 */

export interface DemoDesign {
  id: string;
  slug: string;
  name: string;
  /** primary -> KartAppearance.bodyColor, secondary -> accentColor, accent -> inkColor. */
  colours: {
    primary: string;
    secondary: string;
    accent: string;
  };
}

export const DEMO_DESIGNS: DemoDesign[] = [
  {
    id: 'design-001',
    slug: 'design-001',
    name: 'Apex Red',
    colours: { primary: '#C8102E', secondary: '#111111', accent: '#FFFFFF' },
  },
  {
    id: 'design-002',
    slug: 'design-002',
    name: 'Carbon Edge',
    colours: { primary: '#1A1A1A', secondary: '#3B3B3B', accent: '#00B2A9' },
  },
  {
    id: 'design-003',
    slug: 'design-003',
    name: 'Hyper Grid',
    colours: { primary: '#0047AB', secondary: '#FFD100', accent: '#FFFFFF' },
  },
];
