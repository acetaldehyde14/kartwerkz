import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  CURRENT_CONFIGURATION_SCHEMA_VERSION,
  KitConfigurationSchema,
  type KitConfiguration,
} from '@kartwerkz/shared';
import { SavedConfiguration } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

export interface OwnerContext {
  userId?: string;
  guestSessionId?: string;
}

@Injectable()
export class ConfigurationsService {
  constructor(private readonly prisma: PrismaService) {}

  parseConfiguration(body: unknown): KitConfiguration {
    const result = KitConfigurationSchema.safeParse(body);
    if (!result.success) {
      throw new BadRequestException({
        message: 'Invalid kit configuration',
        issues: result.error.issues,
      });
    }
    return result.data;
  }

  private async assertUploadsOwnedByContext(
    config: KitConfiguration,
    owner: OwnerContext,
  ): Promise<void> {
    const assetIds = [...new Set(config.logos.map((l) => l.uploadedAssetId))];
    if (assetIds.length === 0) return;

    const assets = await this.prisma.uploadedAsset.findMany({ where: { id: { in: assetIds } } });
    if (assets.length !== assetIds.length) {
      throw new BadRequestException('One or more uploaded assets referenced in logos do not exist');
    }
    for (const asset of assets) {
      const ownedByUser = owner.userId && asset.userId === owner.userId;
      const ownedByGuest = owner.guestSessionId && asset.guestSessionId === owner.guestSessionId;
      if (!ownedByUser && !ownedByGuest) {
        throw new ForbiddenException(
          `Uploaded asset ${asset.id} does not belong to the current session`,
        );
      }
    }
  }

  async create(body: unknown, owner: OwnerContext, name?: string): Promise<SavedConfiguration> {
    const config = this.parseConfiguration(body);
    await this.assertUploadsOwnedByContext(config, owner);

    return this.prisma.$transaction(async (tx) => {
      const saved = await tx.savedConfiguration.create({
        data: {
          schemaVersion: CURRENT_CONFIGURATION_SCHEMA_VERSION,
          userId: owner.userId,
          guestSessionId: owner.guestSessionId,
          kartModelId: config.kartModelId,
          graphicsDesignId: config.graphicsDesignId,
          primaryColour: config.colours.primary,
          secondaryColour: config.colours.secondary,
          accentColour: config.colours.accent,
          driverName: config.driver.name,
          raceNumber: config.driver.number,
          countryCode: config.driver.countryCode,
          finish: config.finish,
          specialInstructions: config.specialInstructions,
          name,
        },
      });

      if (config.logos.length > 0) {
        await tx.logoPlacement.createMany({
          data: config.logos.map((logo) => ({
            savedConfigurationId: saved.id,
            uploadedAssetId: logo.uploadedAssetId,
            bodyworkRegion: logo.bodyworkRegion,
            x: logo.x,
            y: logo.y,
            scale: logo.scale,
            rotationDegrees: logo.rotationDegrees,
          })),
        });
      }

      return saved;
    });
  }

  async findOwned(id: string, owner: OwnerContext) {
    const saved = await this.prisma.savedConfiguration.findUnique({
      where: { id },
      include: { logoPlacements: true },
    });
    if (!saved) throw new NotFoundException('Configuration not found');
    this.assertOwnership(saved, owner);
    return saved;
  }

  private assertOwnership(saved: SavedConfiguration, owner: OwnerContext): void {
    const ownedByUser = owner.userId && saved.userId === owner.userId;
    const ownedByGuest = owner.guestSessionId && saved.guestSessionId === owner.guestSessionId;
    if (!ownedByUser && !ownedByGuest) {
      throw new ForbiddenException('This configuration does not belong to you');
    }
  }

  async update(
    id: string,
    body: unknown,
    owner: OwnerContext,
    name?: string,
  ): Promise<SavedConfiguration> {
    const existing = await this.prisma.savedConfiguration.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Configuration not found');
    this.assertOwnership(existing, owner);

    const config = this.parseConfiguration(body);
    await this.assertUploadsOwnedByContext(config, owner);

    return this.prisma.$transaction(async (tx) => {
      await tx.logoPlacement.deleteMany({ where: { savedConfigurationId: id } });
      const updated = await tx.savedConfiguration.update({
        where: { id },
        data: {
          schemaVersion: CURRENT_CONFIGURATION_SCHEMA_VERSION,
          kartModelId: config.kartModelId,
          graphicsDesignId: config.graphicsDesignId,
          primaryColour: config.colours.primary,
          secondaryColour: config.colours.secondary,
          accentColour: config.colours.accent,
          driverName: config.driver.name,
          raceNumber: config.driver.number,
          countryCode: config.driver.countryCode,
          finish: config.finish,
          specialInstructions: config.specialInstructions,
          name: name ?? existing.name,
        },
      });

      if (config.logos.length > 0) {
        await tx.logoPlacement.createMany({
          data: config.logos.map((logo) => ({
            savedConfigurationId: id,
            uploadedAssetId: logo.uploadedAssetId,
            bodyworkRegion: logo.bodyworkRegion,
            x: logo.x,
            y: logo.y,
            scale: logo.scale,
            rotationDegrees: logo.rotationDegrees,
          })),
        });
      }

      return updated;
    });
  }
}
