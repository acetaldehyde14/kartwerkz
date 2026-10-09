import { Controller, Get, Param, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiTags } from '@nestjs/swagger';
import { User } from '@prisma/client';
import { UploadsService } from './uploads.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CurrentGuestSessionId } from '../../common/decorators/current-guest-session.decorator';

@ApiTags('uploads')
@Controller('uploads')
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Post()
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: User | undefined,
    @CurrentGuestSessionId() guestSessionId: string | undefined,
  ) {
    const asset = await this.uploadsService.upload(file, { userId: user?.id, guestSessionId });
    return {
      id: asset.id,
      originalFilename: asset.originalFilename,
      mimeType: asset.mimeType,
      sizeBytes: asset.sizeBytes,
      status: asset.status,
      previewRenderable: asset.previewRenderable,
    };
  }

  @Get(':id/signed-url')
  async getSignedUrl(
    @Param('id') id: string,
    @CurrentUser() user: User | undefined,
    @CurrentGuestSessionId() guestSessionId: string | undefined,
  ) {
    return this.uploadsService.getSignedUrl(id, { userId: user?.id, guestSessionId });
  }
}
