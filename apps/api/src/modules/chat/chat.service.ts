import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { OpenRouterProvider, ChatMessage } from '../../providers/ai/openrouter.provider';
import { SendMessageDto, CreateConversationDto } from './dto/chat.dto';
import { MessageRole } from '@prisma/client';

const SYSTEM_PROMPT = `You are a helpful AI assistant called Matcha. You are friendly, knowledgeable, and conversational.
Help users with their questions, provide thoughtful responses, and engage in meaningful conversations.
Keep your responses concise but informative. If you don't know something, be honest about it.`;

// FREE tier limits
const FREE_TIER_MONTHLY_MESSAGES = 50;

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    private prisma: PrismaService,
    private openRouter: OpenRouterProvider,
  ) {}

  async createConversation(userId: string, data?: CreateConversationDto) {
    return this.prisma.conversation.create({
      data: {
        userId,
        title: data?.title || 'New conversation',
      },
    });
  }

  async getConversations(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [conversations, total] = await Promise.all([
      this.prisma.conversation.findMany({
        where: { userId },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit,
        include: {
          messages: {
            take: 1,
            orderBy: { createdAt: 'desc' },
          },
        },
      }),
      this.prisma.conversation.count({ where: { userId } }),
    ]);

    return {
      conversations,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getConversation(userId: string, conversationId: string) {
    const conversation = await this.prisma.conversation.findFirst({
      where: { id: conversationId, userId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    return conversation;
  }

  async sendMessage(userId: string, userTier: 'FREE' | 'PRO', data: SendMessageDto) {
    // Check usage limits for FREE tier
    if (userTier === 'FREE') {
      const canSend = await this.checkAndUpdateUsage(userId);
      if (!canSend) {
        throw new ForbiddenException({
          message: 'Monthly message limit reached',
          code: 'USAGE_LIMIT_EXCEEDED',
          limit: FREE_TIER_MONTHLY_MESSAGES,
          upgradeUrl: '/pricing',
        });
      }
    }

    let conversationId = data.conversationId;

    // Create a new conversation if none provided
    if (!conversationId) {
      const conversation = await this.createConversation(userId, {
        title: data.message.slice(0, 50) + (data.message.length > 50 ? '...' : ''),
      });
      conversationId = conversation.id;
    } else {
      // Verify conversation belongs to user
      const existing = await this.prisma.conversation.findFirst({
        where: { id: conversationId, userId },
      });
      if (!existing) {
        throw new NotFoundException('Conversation not found');
      }
    }

    // Save user message
    const userMessage = await this.prisma.message.create({
      data: {
        conversationId,
        role: MessageRole.USER,
        content: data.message,
      },
    });

    // Get conversation history for context
    const messages = await this.prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
      take: 20, // Limit context window
    });

    // Build messages for OpenRouter
    const chatMessages: ChatMessage[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...messages.map((m) => ({
        role: m.role.toLowerCase() as 'user' | 'assistant',
        content: m.content,
      })),
    ];

    // Get AI response with error handling
    let response;
    try {
      this.logger.log(`Sending message to OpenRouter for conversation ${conversationId}`);
      response = await this.openRouter.chat(chatMessages);
    } catch (error) {
      this.logger.error('OpenRouter API error:', error);

      // Save error message for user
      const errorMessage = await this.prisma.message.create({
        data: {
          conversationId,
          role: MessageRole.ASSISTANT,
          content: 'Sorry, I encountered an error processing your request. Please try again.',
        },
      });

      throw new ServiceUnavailableException({
        message: 'AI service temporarily unavailable',
        code: 'AI_SERVICE_ERROR',
        conversationId,
        userMessage,
        errorMessage,
      });
    }

    // Save assistant message
    const assistantMessage = await this.prisma.message.create({
      data: {
        conversationId,
        role: MessageRole.ASSISTANT,
        content: response.message,
      },
    });

    // Update conversation timestamp
    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    return {
      conversationId,
      message: assistantMessage,
      usage: response.usage,
    };
  }

  /**
   * Check if user can send a message and update usage count
   */
  private async checkAndUpdateUsage(userId: string): Promise<boolean> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    // Get or create usage limit record
    let usageLimit = await this.prisma.usageLimit.findUnique({
      where: { userId },
    });

    if (!usageLimit) {
      // Create new usage record
      usageLimit = await this.prisma.usageLimit.create({
        data: {
          userId,
          chatMessagesThisMonth: 0,
          analysesThisMonth: 0,
          monthResetAt: startOfNextMonth,
        },
      });
    }

    // Check if we need to reset the monthly count
    if (now >= usageLimit.monthResetAt) {
      usageLimit = await this.prisma.usageLimit.update({
        where: { userId },
        data: {
          chatMessagesThisMonth: 0,
          analysesThisMonth: 0,
          monthResetAt: startOfNextMonth,
        },
      });
    }

    // Check if user has exceeded limit
    if (usageLimit.chatMessagesThisMonth >= FREE_TIER_MONTHLY_MESSAGES) {
      return false;
    }

    // Increment usage count
    await this.prisma.usageLimit.update({
      where: { userId },
      data: {
        chatMessagesThisMonth: { increment: 1 },
      },
    });

    return true;
  }

  /**
   * Get remaining messages for user
   */
  async getRemainingMessages(userId: string, userTier: 'FREE' | 'PRO'): Promise<number | null> {
    if (userTier === 'PRO') {
      return null; // Unlimited
    }

    const usageLimit = await this.prisma.usageLimit.findUnique({
      where: { userId },
    });

    if (!usageLimit) {
      return FREE_TIER_MONTHLY_MESSAGES;
    }

    const now = new Date();
    if (now >= usageLimit.monthResetAt) {
      return FREE_TIER_MONTHLY_MESSAGES;
    }

    return Math.max(0, FREE_TIER_MONTHLY_MESSAGES - usageLimit.chatMessagesThisMonth);
  }

  async deleteConversation(userId: string, conversationId: string) {
    const conversation = await this.prisma.conversation.findFirst({
      where: { id: conversationId, userId },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    await this.prisma.conversation.delete({
      where: { id: conversationId },
    });

    return { success: true };
  }

  async updateConversationTitle(userId: string, conversationId: string, title: string) {
    const conversation = await this.prisma.conversation.findFirst({
      where: { id: conversationId, userId },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    return this.prisma.conversation.update({
      where: { id: conversationId },
      data: { title },
    });
  }
}
