/**
 * Idempotent development seed — upserts by unique slug so re-running this
 * script (e.g. on every `pnpm dev` restart) never duplicates rows. See
 * spec section 5 for the exact seed contract this fulfills:
 *   - 1 Product ("Custom Kart Graphics Kit")
 *   - 4 KartManufacturer rows, each with 1 demo KartModel
 *   - exactly 3 GraphicsDesign rows (PREMADE, demo) with per-region assets
 *   - 1 Supplier (manual fulfillment, dev)
 *
 * All monetary values are integer minor units — never floats.
 */
import { PrismaClient } from '@prisma/client';
import { BODYWORK_REGIONS, PAINTABLE_BODYWORK_REGIONS } from '@kartwerkz/shared';

const prisma = new PrismaClient();

const DEV_BASE_PRICE_MINOR_UNITS = Number(process.env.DEV_BASE_PRICE_MINOR_UNITS ?? 89900);

interface ManufacturerSeed {
  slug: string;
  name: string;
}

const MANUFACTURERS: ManufacturerSeed[] = [
  { slug: 'otk', name: 'OTK' },
  { slug: 'birel-art', name: 'Birel ART' },
  { slug: 'crg', name: 'CRG' },
  { slug: 'kart-republic', name: 'Kart Republic' },
];

interface DesignSeed {
  slug: string;
  name: string;
  description: string;
  defaultColours: { primary: string; secondary: string; accent: string };
}

const DESIGNS: DesignSeed[] = [
  {
    slug: 'design-001',
    name: 'Apex Red (Demo)',
    description:
      'Demo premade livery — bold red/black apex graphics. Placeholder artwork for development only.',
    defaultColours: { primary: '#C8102E', secondary: '#111111', accent: '#FFFFFF' },
  },
  {
    slug: 'design-002',
    name: 'Carbon Edge (Demo)',
    description:
      'Demo premade livery — carbon-fibre inspired dark theme. Placeholder artwork for development only.',
    defaultColours: { primary: '#1A1A1A', secondary: '#3B3B3B', accent: '#00B2A9' },
  },
  {
    slug: 'design-003',
    name: 'Hyper Grid (Demo)',
    description:
      'Demo premade livery — high-contrast grid pattern. Placeholder artwork for development only.',
    defaultColours: { primary: '#0047AB', secondary: '#FFD100', accent: '#FFFFFF' },
  },
];

async function main(): Promise<void> {
  console.log('Seeding Kartwerkz development data...');

  const product = await prisma.product.upsert({
    where: { slug: 'custom-kart-graphics-kit' },
    update: {
      basePriceMinorUnits: DEV_BASE_PRICE_MINOR_UNITS,
    },
    create: {
      slug: 'custom-kart-graphics-kit',
      name: 'Custom Kart Graphics Kit',
      description:
        'A full custom graphics kit for your kart. DEVELOPMENT PRICING — this base price comes from ' +
        'DEV_BASE_PRICE_MINOR_UNITS and must be replaced with real commercial pricing via admin pricing ' +
        'rules before go-live.',
      basePriceMinorUnits: DEV_BASE_PRICE_MINOR_UNITS,
      currency: 'SGD',
      isActive: true,
    },
  });

  const demoKartModels = [];
  for (const m of MANUFACTURERS) {
    const manufacturer = await prisma.kartManufacturer.upsert({
      where: { slug: m.slug },
      update: { name: m.name },
      create: { slug: m.slug, name: m.name },
    });

    const kartModel = await prisma.kartModel.upsert({
      where: { manufacturerId_slug: { manufacturerId: manufacturer.id, slug: 'demo' } },
      update: {
        bodyworkRegions: [...BODYWORK_REGIONS],
      },
      create: {
        manufacturerId: manufacturer.id,
        slug: 'demo',
        name: `${m.name} Demo Chassis`,
        glbAssetPath: '/models/demo-kart.glb',
        bodyworkRegions: [...BODYWORK_REGIONS],
        isDemo: true,
        isActive: true,
      },
    });
    demoKartModels.push(kartModel);

    await prisma.productKartModel.upsert({
      where: { productId_kartModelId: { productId: product.id, kartModelId: kartModel.id } },
      update: {},
      create: { productId: product.id, kartModelId: kartModel.id },
    });
  }

  for (const d of DESIGNS) {
    const design = await prisma.graphicsDesign.upsert({
      where: { slug: d.slug },
      update: {
        name: d.name,
        description: d.description,
        defaultColours: d.defaultColours,
      },
      create: {
        slug: d.slug,
        name: d.name,
        description: d.description,
        tier: 'PREMADE',
        thumbnailUrl: `/textures/${d.slug}/thumbnail.jpg`,
        defaultColours: d.defaultColours,
        priceAdjustmentMinorUnits: 0,
        isDemo: true,
        isActive: true,
      },
    });

    for (const kartModel of demoKartModels) {
      await prisma.graphicsDesignKartModel.upsert({
        where: {
          graphicsDesignId_kartModelId: { graphicsDesignId: design.id, kartModelId: kartModel.id },
        },
        update: {},
        create: { graphicsDesignId: design.id, kartModelId: kartModel.id },
      });
    }

    // Idempotent via delete-then-recreate: these are seed-only derived rows,
    // never user data, so this is safe to run on every seed invocation.
    await prisma.graphicsAsset.deleteMany({ where: { graphicsDesignId: design.id } });
    await prisma.graphicsAsset.createMany({
      data: PAINTABLE_BODYWORK_REGIONS.map((region) => ({
        graphicsDesignId: design.id,
        bodyworkRegion: region,
        previewTextureUrl: `/textures/${d.slug}/${region}.jpg`,
      })),
    });
  }

  const existingSupplier = await prisma.supplier.findFirst({
    where: { name: 'Manual Fulfillment (Dev)' },
  });
  if (!existingSupplier) {
    await prisma.supplier.create({
      data: {
        name: 'Manual Fulfillment (Dev)',
        integrationMethod: 'MANUAL',
        isActive: true,
      },
    });
  }

  console.log('Seed complete.');
}

main()
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
