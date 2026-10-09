import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { User } from '@prisma/client';
import { ArtworkService } from './artwork.service';
import { RequestRevisionDto } from './dto/request-revision.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CurrentGuestSessionId } from '../../common/decorators/current-guest-session.decorator';
import { AuditService } from '../audit/audit.service';

@ApiTags('artwork')
@Controller('orders/:orderId/proofs')
export class ArtworkCustomerController {
  constructor(
    private readonly artworkService: ArtworkService,
    private readonly auditService: AuditService,
  ) {}

  @Get()
  async list(
    @Param('orderId') orderId: string,
    @CurrentUser() user: User | undefined,
    @CurrentGuestSessionId() guestSessionId: string | undefined,
  ) {
    return this.artworkService.getProofsForOrder(orderId, { userId: user?.id, guestSessionId });
  }

  @Post(':proofId/approve')
  async approve(
    @Param('orderId') orderId: string,
    @Param('proofId') proofId: string,
    @CurrentUser() user: User | undefined,
    @CurrentGuestSessionId() guestSessionId: string | undefined,
  ) {
    const approval = await this.artworkService.approve(
      orderId,
      proofId,
      { userId: user?.id, guestSessionId },
      user?.id,
    );
    await this.auditService.log(
      user?.id ?? null,
      'artwork.approval.approve',
      'ArtworkApproval',
      approval.id,
      {
        orderId,
        proofId,
      },
    );
    return approval;
  }

  @Post(':proofId/request-revision')
  async requestRevision(
    @Param('orderId') orderId: string,
    @Param('proofId') proofId: string,
    @Body() dto: RequestRevisionDto,
    @CurrentUser() user: User | undefined,
    @CurrentGuestSessionId() guestSessionId: string | undefined,
  ) {
    const approval = await this.artworkService.requestRevision(
      orderId,
      proofId,
      { userId: user?.id, guestSessionId },
      user?.id,
      dto.comment,
    );
    await this.auditService.log(
      user?.id ?? null,
      'artwork.approval.request_revision',
      'ArtworkApproval',
      approval.id,
      {
        orderId,
        proofId,
      },
    );
    return approval;
  }
}
