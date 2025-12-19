/**
 * Voice Therapy Session Controller
 *
 * REST API endpoints for voice-based therapy sessions
 */

import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Logger,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ClerkAuthGuard } from '../auth/guards/clerk-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Throttle } from '@nestjs/throttler';
import { VoiceService, StartVoiceSessionDto } from './voice.service';

@Controller('voice')
@UseGuards(ClerkAuthGuard)
export class VoiceController {
  private readonly logger = new Logger(VoiceController.name);

  constructor(private voiceService: VoiceService) {}

  /**
   * Start a new voice therapy session
   *
   * POST /voice/start
   */
  @Post('start')
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 sessions per minute
  async startSession(
    @CurrentUser() user: { id: string; tier: 'FREE' | 'PRO' },
    @Body() data: StartVoiceSessionDto,
  ) {
    this.logger.log(
      `User ${user.id} starting voice session: ${data.sessionType}`,
    );

    return this.voiceService.startVoiceSession(user.id, data);
  }

  /**
   * Get voice session details
   *
   * GET /voice/sessions/:sessionId
   */
  @Get('sessions/:sessionId')
  async getSession(
    @CurrentUser() user: { id: string },
    @Param('sessionId') sessionId: string,
  ) {
    return this.voiceService.getVoiceSession(user.id, sessionId);
  }

  /**
   * End an active voice session
   *
   * PATCH /voice/sessions/:sessionId/end
   */
  @Patch('sessions/:sessionId/end')
  @HttpCode(HttpStatus.OK)
  async endSession(
    @CurrentUser() user: { id: string },
    @Param('sessionId') sessionId: string,
  ) {
    this.logger.log(`User ${user.id} ending voice session ${sessionId}`);
    return this.voiceService.endVoiceSession(user.id, sessionId);
  }

  /**
   * Get user's voice session history
   *
   * GET /voice/sessions
   */
  @Get('sessions')
  async getSessionHistory(
    @CurrentUser() user: { id: string },
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.voiceService.getVoiceSessionHistory(
      user.id,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  /**
   * Vapi webhook endpoint (unauthenticated - Vapi calls this)
   *
   * POST /voice/webhook
   */
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 100, ttl: 60000 } }) // High limit for webhook
  async handleWebhook(@Body() payload: any) {
    // TODO: Verify Vapi webhook signature for security
    return this.voiceService.handleVapiWebhook(payload);
  }
}
