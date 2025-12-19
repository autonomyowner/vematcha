/**
 * Voice Therapy Session Service
 *
 * Manages voice-based therapy sessions using Vapi.ai
 * Features:
 * - Create and manage voice sessions
 * - Track session state and progress
 * - Extract transcripts and analysis post-session
 * - Integrate with existing conversation system
 */

import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { VapiProvider } from '../../providers/ai/vapi.provider';
import { SessionType } from '@prisma/client';

export interface StartVoiceSessionDto {
  sessionType: 'general-therapy' | 'flash-technique' | 'crisis-support';
  conversationId?: string; // Link to existing conversation for context
  createNewConversation?: boolean; // Create new conversation for this session
}

export interface VoiceSessionResponse {
  sessionId: string;
  webCallUrl: string; // Client uses this URL to connect
  vapiPublicKey: string; // Client needs this for Vapi SDK initialization
  callId: string;
  conversationId?: string;
}

@Injectable()
export class VoiceService {
  private readonly logger = new Logger(VoiceService.name);

  constructor(
    private prisma: PrismaService,
    private vapi: VapiProvider,
  ) {}

  /**
   * Start a new voice therapy session
   */
  async startVoiceSession(
    userId: string,
    data: StartVoiceSessionDto,
  ): Promise<VoiceSessionResponse> {
    let conversationId = data.conversationId;

    // Create new conversation if requested or if Flash session (always separate)
    if (data.createNewConversation || data.sessionType === 'flash-technique') {
      const sessionTypeMap = {
        'general-therapy': SessionType.REGULAR,
        'flash-technique': SessionType.EMDR_FLASH,
        'crisis-support': SessionType.REGULAR, // Crisis is still a regular conversation type
      };

      const conversation = await this.prisma.conversation.create({
        data: {
          userId,
          title: this.generateConversationTitle(data.sessionType),
          sessionType: sessionTypeMap[data.sessionType],
        },
      });
      conversationId = conversation.id;

      this.logger.log(`Created new conversation ${conversationId} for voice session`);
    } else if (conversationId) {
      // Verify conversation belongs to user
      const existing = await this.prisma.conversation.findFirst({
        where: { id: conversationId, userId },
      });
      if (!existing) {
        throw new NotFoundException('Conversation not found');
      }
    }

    // Start Vapi voice call
    const vapiResponse = await this.vapi.createAndStartCall(
      data.sessionType,
      userId,
      conversationId,
    );

    // Create voice session record in database
    const voiceSession = await this.prisma.voiceSession.create({
      data: {
        userId,
        conversationId,
        vapiCallId: vapiResponse.call.id,
        sessionType: data.sessionType,
        status: 'active',
      },
    });

    this.logger.log(
      `Started voice session ${voiceSession.id} (Vapi call: ${vapiResponse.call.id})`,
    );

    return {
      sessionId: voiceSession.id,
      webCallUrl: vapiResponse.webCallUrl,
      vapiPublicKey: this.vapi.getPublicKey(),
      callId: vapiResponse.call.id,
      conversationId,
    };
  }

  /**
   * Get active voice session details
   */
  async getVoiceSession(userId: string, sessionId: string) {
    const session = await this.prisma.voiceSession.findFirst({
      where: { id: sessionId, userId },
      include: {
        conversation: {
          include: {
            messages: {
              orderBy: { createdAt: 'desc' },
              take: 5, // Recent messages for context
            },
          },
        },
      },
    });

    if (!session) {
      throw new NotFoundException('Voice session not found');
    }

    // If session is active, get live call data from Vapi
    if (session.status === 'active') {
      try {
        const vapiCall = await this.vapi.getCall(session.vapiCallId);
        return {
          ...session,
          liveCallData: {
            status: vapiCall.status,
            duration: vapiCall.startedAt
              ? (Date.now() - new Date(vapiCall.startedAt).getTime()) / 1000
              : 0,
            messagesCount: vapiCall.messages?.length || 0,
          },
        };
      } catch (error) {
        this.logger.warn(`Could not fetch live Vapi call data: ${error.message}`);
      }
    }

    return session;
  }

  /**
   * End an active voice session
   * This processes the transcript and saves it to the conversation
   */
  async endVoiceSession(userId: string, sessionId: string) {
    const session = await this.prisma.voiceSession.findFirst({
      where: { id: sessionId, userId },
    });

    if (!session) {
      throw new NotFoundException('Voice session not found');
    }

    if (session.status !== 'active') {
      throw new Error('Session is not active');
    }

    // End the Vapi call
    try {
      await this.vapi.endCall(session.vapiCallId);
    } catch (error) {
      this.logger.warn(`Error ending Vapi call: ${error.message}`);
      // Continue anyway - call might have already ended
    }

    // Wait a moment for Vapi to finalize transcript
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Extract transcript and analysis
    const callData = await this.vapi.extractCallAnalysis(session.vapiCallId);

    // Save transcript to conversation messages
    if (session.conversationId && callData.transcript) {
      await this.saveTranscriptToConversation(
        session.conversationId,
        callData.transcript,
        callData.messages,
      );
    }

    // Update voice session with final data
    const updatedSession = await this.prisma.voiceSession.update({
      where: { id: sessionId },
      data: {
        status: 'completed',
        endedAt: new Date(),
        transcript: callData.transcript,
        duration: Math.round(callData.duration),
        vapiCosts: callData.costs as any, // Store cost breakdown
      },
    });

    this.logger.log(`Ended voice session ${sessionId}, duration: ${callData.duration}s`);

    return {
      session: updatedSession,
      transcript: callData.transcript,
      duration: callData.duration,
    };
  }

  /**
   * Get user's voice session history
   */
  async getVoiceSessionHistory(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [sessions, total] = await Promise.all([
      this.prisma.voiceSession.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          conversation: {
            select: {
              id: true,
              title: true,
              sessionType: true,
            },
          },
        },
      }),
      this.prisma.voiceSession.count({ where: { userId } }),
    ]);

    return {
      sessions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Helper: Save Vapi transcript to Conversation messages
   */
  private async saveTranscriptToConversation(
    conversationId: string,
    fullTranscript: string,
    messages: Array<{ role: string; message: string; timestamp: number }>,
  ) {
    // Option 1: Save full transcript as single system message
    await this.prisma.message.create({
      data: {
        conversationId,
        role: 'SYSTEM',
        content: `[Voice Session Transcript]\n\n${fullTranscript}`,
      },
    });

    // Option 2: Save individual messages (better for analysis)
    // Batch create all messages
    if (messages && messages.length > 0) {
      const messageRecords = messages
        .filter((m) => m.role === 'user' || m.role === 'assistant') // Skip system messages
        .map((m) => ({
          conversationId,
          role: (m.role === 'user' ? 'USER' : 'ASSISTANT') as 'USER' | 'ASSISTANT',
          content: m.message,
          createdAt: new Date(m.timestamp * 1000), // Convert to Date
        }));

      if (messageRecords.length > 0) {
        await this.prisma.message.createMany({
          data: messageRecords,
        });

        this.logger.log(
          `Saved ${messageRecords.length} voice messages to conversation ${conversationId}`,
        );
      }
    }
  }

  /**
   * Helper: Generate conversation title based on session type
   */
  private generateConversationTitle(sessionType: string): string {
    const titleMap: Record<string, string> = {
      'general-therapy': 'Voice Therapy Session',
      'flash-technique': 'Flash Technique Session',
      'crisis-support': 'Crisis Support Session',
    };
    const date = new Date().toLocaleDateString();
    return `${titleMap[sessionType] || 'Voice Session'} - ${date}`;
  }

  /**
   * Webhook handler for Vapi events (call ended, transcript ready, etc.)
   * Call this from a webhook endpoint
   */
  async handleVapiWebhook(payload: any) {
    this.logger.log(`Received Vapi webhook: ${payload.type}`);

    // Handle different webhook events
    switch (payload.type) {
      case 'end-of-call-report':
        await this.handleCallEnded(payload);
        break;
      case 'transcript':
        await this.handleTranscriptUpdate(payload);
        break;
      case 'function-call':
        // Handle tool calls if needed
        break;
      default:
        this.logger.log(`Unhandled webhook type: ${payload.type}`);
    }

    return { received: true };
  }

  /**
   * Handle call ended webhook
   */
  private async handleCallEnded(payload: any) {
    const vapiCallId = payload.call?.id;
    if (!vapiCallId) return;

    // Find session by Vapi call ID
    const session = await this.prisma.voiceSession.findFirst({
      where: { vapiCallId, status: 'active' },
    });

    if (!session) {
      this.logger.warn(`No active session found for Vapi call ${vapiCallId}`);
      return;
    }

    // Extract analysis
    const callData = await this.vapi.extractCallAnalysis(vapiCallId);

    // Save transcript to conversation
    if (session.conversationId && callData.transcript) {
      await this.saveTranscriptToConversation(
        session.conversationId,
        callData.transcript,
        callData.messages,
      );
    }

    // Update session
    await this.prisma.voiceSession.update({
      where: { id: session.id },
      data: {
        status: 'completed',
        endedAt: new Date(),
        transcript: callData.transcript,
        duration: Math.round(callData.duration),
        vapiCosts: callData.costs as any,
      },
    });

    this.logger.log(`Auto-ended voice session ${session.id} via webhook`);
  }

  /**
   * Handle real-time transcript updates
   */
  private async handleTranscriptUpdate(payload: any) {
    // Could use this for real-time transcript streaming to client
    // For now, just log
    this.logger.debug(`Transcript update: ${payload.transcript?.text}`);
  }
}
