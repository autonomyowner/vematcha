import {
  Controller,
  Get,
  Post,
  Delete,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ChatService } from './chat.service';
import { ClerkAuthGuard, AuthenticatedUser } from '../auth/guards/clerk-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { sendMessageSchema, createConversationSchema } from './dto/chat.dto';
import { z } from 'zod';

@Controller('chat')
@UseGuards(ClerkAuthGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('conversations')
  async createConversation(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: unknown,
  ) {
    const result = createConversationSchema.safeParse(body);
    if (!result.success) {
      throw new BadRequestException(result.error.format());
    }
    return this.chatService.createConversation(user.id, result.data);
  }

  @Get('conversations')
  async getConversations(
    @CurrentUser() user: AuthenticatedUser,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = Math.max(1, parseInt(page || '1', 10));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit || '20', 10)));
    return this.chatService.getConversations(user.id, pageNum, limitNum);
  }

  @Get('usage')
  async getUsage(@CurrentUser() user: AuthenticatedUser) {
    const remaining = await this.chatService.getRemainingMessages(user.id, user.tier);
    return {
      tier: user.tier,
      messagesRemaining: remaining,
      limit: user.tier === 'FREE' ? 50 : null,
    };
  }

  @Get('conversations/:id')
  async getConversation(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.chatService.getConversation(user.id, id);
  }

  @Delete('conversations/:id')
  async deleteConversation(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.chatService.deleteConversation(user.id, id);
  }

  @Patch('conversations/:id')
  async updateConversation(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() body: unknown,
  ) {
    const schema = z.object({ title: z.string().max(200) });
    const result = schema.safeParse(body);
    if (!result.success) {
      throw new BadRequestException(result.error.format());
    }
    return this.chatService.updateConversationTitle(user.id, id, result.data.title);
  }

  @Post('send')
  @Throttle({ default: { limit: 20, ttl: 60000 } }) // 20 messages per minute max
  async sendMessage(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: unknown,
  ) {
    const result = sendMessageSchema.safeParse(body);
    if (!result.success) {
      throw new BadRequestException(result.error.format());
    }
    return this.chatService.sendMessage(user.id, user.tier, result.data);
  }
}
