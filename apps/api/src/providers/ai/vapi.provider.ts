/**
 * Vapi.ai Provider for Real-Time Voice Therapy Sessions
 *
 * Integrates Vapi's voice infrastructure with:
 * - Ultrathink model for deep therapeutic reasoning
 * - Claude 3.5 Sonnet for nuanced emotional intelligence
 * - ElevenLabs for high-quality voice synthesis
 *
 * Features:
 * - Real-time bidirectional voice communication
 * - Emotion detection from voice tone
 * - Interruption handling (user can cut off AI)
 * - Crisis detection in real-time
 * - Integration with existing conversation/analysis system
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
// @ts-ignore - AxiosInstance type issue
import type { AxiosInstance } from 'axios';
import { getClinicalSystemPrompt, ClinicalPromptContext } from '../../modules/chat/prompts/clinical-cbt-prompt';

export interface VapiAssistantConfig {
  name: string;
  model: {
    provider: 'openrouter' | 'openai' | 'anthropic';
    model: string; // e.g., 'gpt-4o', 'claude-3-5-sonnet'
    messages?: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
    temperature?: number;
    maxTokens?: number;
    emotionRecognitionEnabled?: boolean;
  };
  voice: {
    provider: 'elevenlabs' | '11labs' | 'azure' | 'vapi';
    voiceId: string; // Voice ID (Vapi built-in voices or ElevenLabs voice ID)
    stability?: number; // 0-1, higher = more stable (ElevenLabs only)
    similarityBoost?: number; // 0-1, higher = more similar to original voice (ElevenLabs only)
    model?: string; // ElevenLabs model (e.g., 'eleven_multilingual_v2')
  };
  firstMessage?: string;
  transcriber?: {
    provider: 'deepgram';
    model?: string;
    language?: string;
  };
  recordingEnabled?: boolean;
  endCallFunctionEnabled?: boolean;
  dialKeypadFunctionEnabled?: boolean;
  serverMessages?: Array<
    'conversation-update' | 'end-of-call-report' | 'function-call' | 'hang' | 'speech-update' | 'status-update' | 'transcript' | 'tool-calls'
  >;
  clientMessages?: Array<'conversation-update' | 'function-call' | 'hang' | 'metadata' | 'model-output' | 'speech-update' | 'status-update' | 'transcript' | 'tool-calls' | 'user-interrupted' | 'voice-input'>;
  silenceTimeoutSeconds?: number;
  responseDelaySeconds?: number;
  interruptionsEnabled?: boolean;
  numWordsToInterruptAssistant?: number;
  maxDurationSeconds?: number;
  backgroundSound?: 'off' | 'office';
}

export interface VapiCallConfig {
  assistant?: VapiAssistantConfig;
  assistantId?: string; // Use pre-created assistant
  customer?: {
    number?: string;
  };
  phoneNumberId?: string;
  name?: string;
  assistantOverrides?: Partial<VapiAssistantConfig>;
}

export interface VapiCall {
  id: string;
  orgId: string;
  createdAt: string;
  updatedAt: string;
  type: 'webCall' | 'inboundPhoneCall' | 'outboundPhoneCall';
  status: 'queued' | 'ringing' | 'in-progress' | 'forwarding' | 'ended';
  endedReason?: 'assistant-error' | 'assistant-not-found' | 'db-error' | 'no-server-available' | 'pipeline-error-openai-llm-failed' | 'pipeline-error-azure-voice-failed' | 'pipeline-error-cartesia-voice-failed' | 'pipeline-error-deepgram-transcriber-failed' | 'pipeline-error-eleven-labs-voice-failed' | 'pipeline-error-playht-voice-failed' | 'exceeded-max-duration' | 'manually-ended' | 'customer-ended-call' | 'customer-did-not-answer' | 'customer-busy' | 'assistant-ended-call' | 'assistant-said-end-call-phrase' | 'voicemail' | 'unknown' | 'phone-call-provider-closed-websocket' | 'pipeline-error-twilio-failed' | 'silence-timed-out';
  messages?: Array<{
    role: 'system' | 'user' | 'assistant' | 'tool' | 'function';
    message: string;
    time: number;
    endTime?: number;
    secondsFromStart: number;
  }>;
  transcript?: string;
  recordingUrl?: string;
  summary?: string;
  analysis?: {
    successEvaluation?: string;
    structuredData?: Record<string, any>;
  };
  costs?: Array<{
    analysis?: {
      model: string;
      promptTokens: number;
      completionTokens: number;
      cost: number;
    };
  }>;
  phoneNumber?: any;
  customer?: any;
  assistant?: VapiAssistantConfig;
  assistantId?: string;
  startedAt?: string;
  endedAt?: string;
  cost?: number;
  costBreakdown?: {
    llm: number;
    stt: number;
    tts: number;
    vapi: number;
    total: number;
    llmPromptTokens: number;
    llmCompletionTokens: number;
    ttsCharacters: number;
  };
}

export interface VapiWebCallResponse {
  webCallUrl: string; // URL for client to connect to
  call: VapiCall;
}

@Injectable()
export class VapiProvider {
  private readonly logger = new Logger(VapiProvider.name);
  private readonly client: AxiosInstance;
  private readonly apiKey: string;
  private readonly publicKey: string;

  // Model configurations - Using Vapi-supported providers
  private readonly ULTRATHINK_MODEL = 'gpt-4o'; // GPT-4o for deep reasoning
  private readonly CLAUDE_MODEL = 'gpt-4o'; // GPT-4o for nuanced EQ (will switch to Claude once configured)

  // Voice configurations
  private readonly RACHEL_VOICE_ID = '21m00Tcm4TlvDq8ikWAM'; // Calm, soothing female voice (from your existing TTS config)
  private readonly ELEVENLABS_MODEL = 'eleven_multilingual_v2';

  constructor(private config: ConfigService) {
    this.apiKey = this.config.get<string>('vapi.apiKey') || '';
    this.publicKey = this.config.get<string>('vapi.publicKey') || '';

    if (!this.apiKey) {
      this.logger.warn('Vapi API key not configured. Voice sessions will not be available.');
    }

    this.client = axios.create({
      baseURL: 'https://api.vapi.ai',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });
  }

  /**
   * Create a new voice therapy assistant
   *
   * @param sessionType - Type of therapy session
   * @param userId - User ID for context
   * @param conversationId - Existing conversation ID (for context continuity)
   */
  async createTherapyAssistant(
    sessionType: 'general-therapy' | 'flash-technique' | 'crisis-support',
    userId: string,
    conversationId?: string,
  ): Promise<string> {
    const systemPrompt = this.buildSystemPrompt(sessionType, conversationId);
    const assistantConfig = this.buildAssistantConfig(sessionType, systemPrompt);

    try {
      const response = await this.client.post('/assistant', assistantConfig);
      this.logger.log(`Created Vapi assistant: ${response.data.id} for session type: ${sessionType}`);
      return response.data.id;
    } catch (error) {
      this.logger.error('Failed to create Vapi assistant:', error.response?.data || error.message);
      throw new Error('Could not create voice therapy assistant');
    }
  }

  /**
   * Start a web-based voice call
   *
   * @param assistantId - Pre-created assistant ID
   * @param metadata - Additional metadata to attach to call
   */
  async startWebCall(
    assistantId: string,
    metadata?: {
      userId: string;
      conversationId?: string;
      sessionType: string;
    },
  ): Promise<VapiWebCallResponse> {
    try {
      const response = await this.client.post('/call/web', {
        assistantId,
        metadata,
      });

      this.logger.log(`Started web call: ${response.data.call.id}`);
      return response.data;
    } catch (error) {
      this.logger.error('Failed to start web call:', error.response?.data || error.message);
      throw new Error('Could not start voice call');
    }
  }

  /**
   * Create and start a voice call in one step
   * (Useful for one-off sessions without pre-creating assistant)
   */
  async createAndStartCall(
    sessionType: 'general-therapy' | 'flash-technique' | 'crisis-support',
    userId: string,
    conversationId?: string,
  ): Promise<VapiWebCallResponse> {
    const systemPrompt = this.buildSystemPrompt(sessionType, conversationId);
    const assistantConfig = this.buildAssistantConfig(sessionType, systemPrompt);

    try {
      const response = await this.client.post('/call/web', {
        assistant: assistantConfig,
        metadata: {
          userId,
          conversationId,
          sessionType,
        },
      });

      // Debug: log actual response structure
      this.logger.log(`Vapi response: ${JSON.stringify(response.data, null, 2)}`);

      // VAPI returns the call object directly, not nested under 'call'
      const call = response.data;
      this.logger.log(`Created and started web call: ${call.id}`);

      return {
        webCallUrl: call.webCallUrl,
        call: call,
      };
    } catch (error) {
      this.logger.error('Failed to create and start call:', error.response?.data || error.message);
      throw new Error('Could not start voice therapy session');
    }
  }

  /**
   * Get call details (useful for retrieving transcript/analysis after call ends)
   */
  async getCall(callId: string): Promise<VapiCall> {
    try {
      const response = await this.client.get(`/call/${callId}`);
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to get call ${callId}:`, error.response?.data || error.message);
      throw new Error('Could not retrieve call data');
    }
  }

  /**
   * End an active call
   */
  async endCall(callId: string): Promise<void> {
    try {
      await this.client.post(`/call/${callId}/stop`);
      this.logger.log(`Ended call: ${callId}`);
    } catch (error) {
      this.logger.error(`Failed to end call ${callId}:`, error.response?.data || error.message);
      throw new Error('Could not end call');
    }
  }

  /**
   * Build system prompt based on session type and context
   */
  private buildSystemPrompt(
    sessionType: 'general-therapy' | 'flash-technique' | 'crisis-support',
    conversationId?: string,
  ): string {
    // TODO: Fetch conversation history and themes if conversationId provided
    // For now, using basic context

    const contextMap: Record<string, ClinicalPromptContext> = {
      'general-therapy': {
        sessionType: 'voice-session',
        messageCount: 0,
        riskLevel: 'none',
      },
      'flash-technique': {
        sessionType: 'flash-technique',
        messageCount: 0,
        isFlashSession: true,
        flashPhase: 'setup',
      },
      'crisis-support': {
        sessionType: 'voice-session',
        messageCount: 0,
        riskLevel: 'high',
      },
    };

    return getClinicalSystemPrompt(contextMap[sessionType]);
  }

  /**
   * Build Vapi assistant configuration
   */
  private buildAssistantConfig(
    sessionType: 'general-therapy' | 'flash-technique' | 'crisis-support',
    systemPrompt: string,
  ): VapiAssistantConfig {
    // Choose model based on session type
    const modelConfig = sessionType === 'flash-technique'
      ? {
          // Flash Technique needs structured, directive guidance
          provider: 'openai' as const,
          model: this.ULTRATHINK_MODEL,
          temperature: 0.3, // Lower temp for precise protocol following
          maxTokens: 1000,
        }
      : {
          // General therapy benefits from nuanced emotional responses
          provider: 'openai' as const,
          model: this.CLAUDE_MODEL,
          temperature: 0.7, // Higher temp for natural, warm responses
          maxTokens: 1500,
        };

    const firstMessageMap = {
      'general-therapy': "Hi, I'm Matcha. I'm here to listen and support you. What's on your mind today?",
      'flash-technique': "Hi, I'm ready to guide you through a Flash Technique session. This will take about 10-15 minutes. Before we start, I want to make sure you're in a safe, comfortable place where you won't be interrupted. Are you ready?",
      'crisis-support': "I'm here with you. You've reached out, and that takes courage. I want you to know you're not alone right now. Can you tell me what's happening?",
    };

    return {
      name: `Matcha ${sessionType}`,
      model: {
        ...modelConfig,
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
        ],
        emotionRecognitionEnabled: true, // Enable emotion detection from voice
      },
      voice: {
        provider: '11labs',
        voiceId: '21m00Tcm4TlvDq8ikWAM', // Rachel - warm, calm female voice from ElevenLabs
      },
      firstMessage: firstMessageMap[sessionType],
      transcriber: {
        provider: 'deepgram',
        model: 'nova-2-general', // Latest Deepgram model for best accuracy
        language: 'en-US',
      },
      recordingEnabled: true, // Record for transcript/analysis
      serverMessages: ['transcript', 'end-of-call-report', 'speech-update', 'tool-calls'], // What events server receives
      clientMessages: ['transcript', 'speech-update', 'user-interrupted'], // What events client receives
      silenceTimeoutSeconds: sessionType === 'flash-technique' ? 30 : 60, // Flash needs silence for processing
      responseDelaySeconds: 1.5, // Give user time to collect thoughts (critical for therapy)
      interruptionsEnabled: true, // User can always interrupt
      numWordsToInterruptAssistant: 2, // Only 2 words needed to interrupt (low friction)
      maxDurationSeconds: sessionType === 'flash-technique' ? 1200 : 3600, // Flash: 20min, General: 60min
      backgroundSound: 'off', // No distracting background sounds
      endCallFunctionEnabled: true, // AI can end call if user says "goodbye" etc.
    };
  }

  /**
   * Extract structured analysis from Vapi call
   * (Call this after call ends to get transcript + emotional analysis)
   */
  async extractCallAnalysis(callId: string): Promise<{
    transcript: string;
    messages: Array<{ role: string; message: string; timestamp: number }>;
    duration: number;
    costs: any;
  }> {
    const call = await this.getCall(callId);

    // Map Vapi message format to our expected format
    const mappedMessages = (call.messages || []).map(m => ({
      role: m.role,
      message: m.message,
      timestamp: m.time, // Vapi uses 'time' instead of 'timestamp'
    }));

    return {
      transcript: call.transcript || '',
      messages: mappedMessages,
      duration: call.endedAt && call.startedAt
        ? (new Date(call.endedAt).getTime() - new Date(call.startedAt).getTime()) / 1000
        : 0,
      costs: call.costBreakdown,
    };
  }

  /**
   * Get Vapi public key for client-side SDK initialization
   */
  getPublicKey(): string {
    return this.publicKey;
  }
}
