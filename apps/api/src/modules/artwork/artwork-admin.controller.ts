import {
  Body,
  Controller,
  Param,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiTags } from '@nestjs/swagger';
import { User } from '@prisma/client';
import { ArtworkService } from './artwork.service';
import { AddRevisionDto } from './dto/add-revision.dto';
import { AuthGuard } from '../../common/guards/auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuditService } from '../audit/audit.service';

@ApiTags('admin-artwork')
@Controller('admin/orders/:orderId/proofs/:proofId')
@UseGuards(AuthGuard, RolesGuard)
@Roles('ADMIN')
export class ArtworkAdminController {
  constructor(
    private readonly artworkService: ArtworkService,
    private readonly auditService: AuditService,
  ) {}

  @Post('revisions')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  async addRevision(
    @Param('orderId') orderId: string,
    @Param('proofId') proofId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: AddRevisionDto,
    @CurrentUser() user: User,
  ) {
    const revision = await this.artworkService.addRevision(
      orderId,
      proofId,
      file,
      dto.notes,
      dto.previewImageUrl,
    );
    await this.auditService.log(
      user.id,
      'artwork.revision.create',
      'ArtworkRevision',
      revision.id,
      {
        orderId,
        proofId,
        revisionNumber: revision.revisionNumber,
      },
    );
    return revision;
  }

  @Post('revisions/:revisionId/send')
  async sendRevision(
    @Param('orderId') orderId: string,
    @Param('proofId') proofId: string,
    @Param('revisionId') revisionId: string,
    @CurrentUser() user: User,
  ) {
    const revision = await this.artworkService.sendRevisionToCustomer(orderId, proofId, revisionId);
    await this.auditService.log(user.id, 'artwork.revision.send', 'ArtworkRevision', revision.id, {
      orderId,
      proofId,
    });
    return revision;
  }
}
