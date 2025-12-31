import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { OpenRouterProvider, ChatMessage, AnalysisData } from '../../providers/ai/openrouter.provider';
import { SendMessageDto, CreateConversationDto } from './dto/chat.dto';
import { MessageRole } from '@prisma/client';
import { getSystemPromptWithAnalysis } from './prompts/matcha-prompt';
import { SafetyGuardProvider, RiskLevel } from '../../providers/safety/safety-guard.provider';
import { CacheService } from '../../providers/redis/cache.service';

// FREE tier limits
const FREE_TIER_MONTHLY_MESSAGES = 50;

// Cache TTLs in seconds
const USAGE_CACHE_TTL = 60; // 1 minute for usage limits

// Analysis filtering thresholds
const MIN_MESSAGES_FOR_ANALYSIS = 5;
const MIN_CONFIDENCE_THRESHOLD = 0.3;

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    private prisma: PrismaService,
    private openRouter: OpenRouterProvider,
    private safetyGuard: SafetyGuardProvider,
    private cacheService: CacheService,
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

    // SAFETY CHECK: Analyze user input for crisis indicators
    const inputSafety = await this.safetyGuard.checkUserInput(data.message, {
      userId,
      previousMessages: messages.slice(-5).map(m => ({
        role: m.role.toLowerCase(),
        content: m.content,
      })),
    });

    // If CRISIS detected, override with emergency resources immediately
    if (inputSafety.riskLevel === RiskLevel.CRISIS) {
      this.logger.warn(`CRISIS DETECTED for user ${userId}: ${inputSafety.flags.join(', ')}`);

      const crisisMessage = this.safetyGuard.getCrisisInterventionMessage(inputSafety.flags);

      const assistantMessage = await this.prisma.message.create({
        data: {
          conversationId,
          role: MessageRole.ASSISTANT,
          content: crisisMessage,
        },
      });

      // Update conversation with crisis flag
      await this.prisma.conversation.update({
        where: { id: conversationId },
        data: {
          emotionalState: { crisis: true, flags: inputSafety.flags },
          updatedAt: new Date(),
        },
      });

      return {
        conversationId,
        message: assistantMessage,
        analysis: {
          emotionalState: { primary: 'crisis', intensity: 'high' },
          riskAssessment: {
            level: 'crisis',
            indicators: inputSafety.flags,
            action: 'IMMEDIATE_CRISIS_INTERVENTION',
          },
        },
        usage: null,
        modelTier: 'safety-override',
        crisisDetected: true,
      };
    }

    // Determine model tier based on context
    const messageCount = messages.length;
    const hasComplexEmotionalContent = this.detectComplexEmotionalContent(data.message);
    const modelTier = this.openRouter.determineModelTier({
      messageCount,
      isSessionEnd: data.isSessionEnd || false,
      requiresDeepAnalysis: data.requestDeepAnalysis || false,
      hasComplexEmotionalContent,
    });

    // Get previous emotions for context
    const previousEmotions = await this.getPreviousEmotions(conversationId);

    // Build dynamic system prompt with context
    const systemPrompt = getSystemPromptWithAnalysis({
      messageCount,
      isDeepAnalysis: modelTier === 'deep',
      previousEmotions,
    });

    // Build messages for OpenRouter
    const chatMessages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      ...messages.map((m) => ({
        role: m.role.toLowerCase() as 'user' | 'assistant',
        content: m.content,
      })),
    ];

    // Get AI response with tiered model and optional extended thinking
    let response;
    try {
      this.logger.log(
        `Sending message to OpenRouter (tier: ${modelTier}, thinking: ${modelTier === 'deep'}) for conversation ${conversationId}`,
      );
      response = await this.openRouter.chatWithThinking(chatMessages, {
        modelTier,
        thinking: {
          enabled: modelTier === 'deep',
        },
      });
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

    // SAFETY CHECK: Validate AI response before sending to user
    const responseSafety = await this.safetyGuard.checkAIResponse(
      response.message,
      data.message,
    );

    // If response is unsafe, override with safe alternative
    if (!responseSafety.isSafe) {
      this.logger.warn(
        `Unsafe AI response blocked for conversation ${conversationId}: ${responseSafety.flags.join(', ')}`,
      );

      // Override with crisis resources if user message was high-risk
      if (inputSafety.requiresIntervention) {
        response.message = this.safetyGuard.getCrisisInterventionMessage(inputSafety.flags);
      } else {
        // Generic safe fallback
        response.message = "I want to make sure I'm being helpful and supportive. Can you tell me more about what's going on?";
      }
    }

    // Save assistant message
    const assistantMessage = await this.prisma.message.create({
      data: {
        conversationId,
        role: MessageRole.ASSISTANT,
        content: response.message,
      },
    });

    // Update conversation with analysis data
    const updatedConversation = await this.prisma.conversation.update({
      where: { id: conversationId },
      data: {
        updatedAt: new Date(),
        analysisUpdatedAt: new Date(),
        // Store the latest analysis - this accumulates insights over time
        ...(response.analysis && {
          emotionalState: response.analysis.emotionalState,
          biases: await this.mergeAnalysisArray(
            conversationId,
            'biases',
            response.analysis.biases,
          ),
          patterns: response.analysis.patterns,
          insights: await this.mergeInsights(
            conversationId,
            response.analysis.insights,
          ),
        }),
      },
    });

    // Filter analysis based on message count and confidence thresholds
    let filteredAnalysis = response.analysis;

    if (messageCount < MIN_MESSAGES_FOR_ANALYSIS) {
      // Not enough context for accurate analysis
      filteredAnalysis = null;
    } else if (filteredAnalysis) {
      // Check if any bias has sufficient confidence
      const hasHighConfidenceBias = filteredAnalysis.biases?.some(
        (b) => b.confidence >= MIN_CONFIDENCE_THRESHOLD,
      );

      // If no high-confidence insights, don't show analysis
      if (!hasHighConfidenceBias) {
        filteredAnalysis = null;
      }
    }

    return {
      conversationId,
      message: assistantMessage,
      analysis: filteredAnalysis,
      usage: response.usage,
      modelTier, // Include which tier was used for transparency
    };
  }

  /**
   * Stream message - faster response with progressive rendering
   */
  async sendMessageStream(
    userId: string,
    userTier: 'FREE' | 'PRO',
    data: SendMessageDto,
    onChunk: (chunk: string) => void,
    onComplete: (finalData: any) => void,
  ) {
    // Check usage limits for FREE tier
    if (userTier === 'FREE') {
      const canSend = await this.checkAndUpdateUsage(userId);
      if (!canSend) {
        throw new ForbiddenException({
          message: 'Monthly message limit reached',
          code: 'USAGE_LIMIT_EXCEEDED',
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
      const existing = await this.prisma.conversation.findFirst({
        where: { id: conversationId, userId },
      });
      if (!existing) {
        throw new NotFoundException('Conversation not found');
      }
    }

    // Save user message
    await this.prisma.message.create({
      data: {
        conversationId,
        role: MessageRole.USER,
        content: data.message,
      },
    });

    // Get conversation history for context (limited for speed)
    const messages = await this.prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
      take: 10, // Reduced for faster processing
    });

    // Quick safety check - skip deep analysis for streaming
    const inputSafety = await this.safetyGuard.checkUserInput(data.message, {
      userId,
      previousMessages: messages.slice(-3).map(m => ({
        role: m.role.toLowerCase(),
        content: m.content,
      })),
    });

    // Crisis handling - immediate response
    if (inputSafety.riskLevel === RiskLevel.CRISIS) {
      const crisisMessage = this.safetyGuard.getCrisisInterventionMessage(inputSafety.flags);

      await this.prisma.message.create({
        data: {
          conversationId,
          role: MessageRole.ASSISTANT,
          content: crisisMessage,
        },
      });

      onChunk(crisisMessage);
      onComplete({
        conversationId,
        crisisDetected: true,
      });
      return;
    }

    // Build messages - use fast model for streaming
    const systemPrompt = getSystemPromptWithAnalysis({
      messageCount: messages.length,
      isDeepAnalysis: false,
      previousEmotions: [],
    });

    const chatMessages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      ...messages.map((m) => ({
        role: m.role.toLowerCase() as 'user' | 'assistant',
        content: m.content,
      })),
    ];

    // Stream the response using fast model
    let fullMessage = '';
    try {
      const response = await this.openRouter.streamChat(chatMessages, (chunk) => {
        fullMessage += chunk;
        onChunk(chunk);
      });

      // Save assistant message after streaming completes
      const assistantMessage = await this.prisma.message.create({
        data: {
          conversationId,
          role: MessageRole.ASSISTANT,
          content: fullMessage,
        },
      });

      // Update conversation timestamp
      await this.prisma.conversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date() },
      });

      onComplete({
        conversationId,
        messageId: assistantMessage.id,
        usage: response.usage,
      });
    } catch (error) {
      this.logger.error('Streaming error:', error);
      throw error;
    }
  }

  /**
   * Merge new biases with existing ones, keeping unique entries
   */
  private async mergeAnalysisArray(
    conversationId: string,
    field: 'biases',
    newItems: Array<{ name: string; confidence: number; description: string }>,
  ) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      select: { [field]: true },
    });

    const existing = (conversation?.[field] as typeof newItems) || [];
    const merged = [...existing];

    for (const newItem of newItems) {
      const existingIndex = merged.findIndex((e) => e.name === newItem.name);
      if (existingIndex >= 0) {
        // Update confidence if higher
        if (newItem.confidence > merged[existingIndex].confidence) {
          merged[existingIndex] = newItem;
        }
      } else {
        merged.push(newItem);
      }
    }

    // Keep top 10 biases by confidence
    return merged
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 10);
  }

  /**
   * Merge new insights with existing ones, keeping unique entries
   */
  private async mergeInsights(
    conversationId: string,
    newInsights: string[],
  ): Promise<string[]> {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      select: { insights: true },
    });

    const existing = (conversation?.insights as string[]) || [];
    const merged = [...existing];

    for (const insight of newInsights) {
      // Simple deduplication - check if similar insight exists
      const isDuplicate = merged.some(
        (e) => e.toLowerCase().includes(insight.toLowerCase().slice(0, 20)) ||
               insight.toLowerCase().includes(e.toLowerCase().slice(0, 20)),
      );
      if (!isDuplicate) {
        merged.push(insight);
      }
    }

    // Keep last 20 insights
    return merged.slice(-20);
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

    // Invalidate cache after usage update
    await this.invalidateUsageCache(userId);

    return true;
  }

  /**
   * Get remaining messages for user (with caching)
   */
  async getRemainingMessages(userId: string, userTier: 'FREE' | 'PRO'): Promise<number | null> {
    if (userTier === 'PRO') {
      return null; // Unlimited
    }

    // Try cache first
    const cacheKey = this.cacheService.generateKey('usage', userId, 'remaining');
    const cached = await this.cacheService.get<number>(cacheKey);
    if (cached !== null) {
      return cached;
    }

    const usageLimit = await this.prisma.usageLimit.findUnique({
      where: { userId },
    });

    let remaining: number;
    if (!usageLimit) {
      remaining = FREE_TIER_MONTHLY_MESSAGES;
    } else {
      const now = new Date();
      if (now >= usageLimit.monthResetAt) {
        remaining = FREE_TIER_MONTHLY_MESSAGES;
      } else {
        remaining = Math.max(0, FREE_TIER_MONTHLY_MESSAGES - usageLimit.chatMessagesThisMonth);
      }
    }

    // Cache for 1 minute
    await this.cacheService.set(cacheKey, remaining, USAGE_CACHE_TTL);
    return remaining;
  }

  /**
   * Invalidate usage cache when limit changes
   */
  private async invalidateUsageCache(userId: string): Promise<void> {
    const cacheKey = this.cacheService.generateKey('usage', userId, 'remaining');
    await this.cacheService.del(cacheKey);
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

  /**
   * Detect if message contains crisis-level content that needs deeper analysis
   * This triggers the deep model tier only for safety-critical situations
   *
   * Note: Keep patterns minimal to avoid unnecessary slow responses.
   * General emotional content is handled fine by the fast model.
   */
  private detectComplexEmotionalContent(message: string): boolean {
    const crisisIndicators = [
      // Direct self-harm/suicide indicators only
      /\b(suicide|suicidal|kill myself|end my life|self.?harm|hurt myself|want to die|don't want to live)\b/i,
      // Active crisis phrases
      /\b(can't go on|no reason to live|everyone better off without me|planning to end)\b/i,
    ];

    return crisisIndicators.some((pattern) => pattern.test(message));
  }

  /**
   * Get previous emotions from conversation for context
   */
  private async getPreviousEmotions(conversationId: string): Promise<string[]> {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      select: { emotionalState: true },
    });

    if (!conversation?.emotionalState) return [];

    const state = conversation.emotionalState as {
      primary?: string;
      secondary?: string;
    };

    return [state.primary, state.secondary].filter(Boolean) as string[];
  }
}
