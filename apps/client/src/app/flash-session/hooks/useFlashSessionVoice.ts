'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Vapi from '@vapi-ai/web';

export type VoicePhase = 'setup' | 'check-in' | 'closing' | null;

export interface FlashSessionVoiceState {
  voiceEnabled: boolean;
  voicePhase: VoicePhase;
  isVoiceConnected: boolean;
  isVoiceConnecting: boolean;
  volumeLevel: number;
  isSpeaking: boolean;
  assistantSpeaking: boolean;
  transcript: Array<{ role: 'USER' | 'ASSISTANT'; content: string }>;
  error: string | null;
}

export interface FlashSessionVoiceActions {
  enableVoice: () => void;
  disableVoice: () => void;
  startVoicePhase: (phase: VoicePhase) => Promise<void>;
  endVoicePhase: () => void;
  clearError: () => void;
}

export interface UseFlashSessionVoiceReturn extends FlashSessionVoiceState, FlashSessionVoiceActions {}

// System prompts for different voice phases
const VOICE_PROMPTS = {
  setup: `You are Matcha, a warm and supportive AI companion guiding a Flash Technique (EMDR-derived) therapy session.

CURRENT PHASE: Session Setup

YOUR TASK:
1. First, greet warmly and briefly explain you'll guide them through a Flash Technique session
2. Ask what has been weighing on them - just the topic/title, NOT the details
3. Ask them to rate their current distress about this topic on a scale of 0-10
4. Ask them to think of a peaceful memory or safe place - somewhere that brings them calm
5. Once you have all three pieces of information, confirm you're ready to begin and say "Starting the session now"

IMPORTANT RULES:
- Keep responses brief (1-2 sentences max)
- NEVER ask for details about the distressing memory
- If they start describing trauma, gently redirect: "Just the topic is perfect - we don't need details for this technique"
- Be warm, calm, and reassuring
- When you have topic, distress level (0-10), and positive memory, say "Starting the session now" to trigger the session`,

  'check-in': `You are Matcha continuing a Flash Technique session during the between-set check-in.

CURRENT PHASE: Check-In (between bilateral stimulation sets)

YOUR TASK:
1. Ask "What did you notice during that set?" or "How are you feeling now?"
2. Listen and acknowledge whatever they share
3. If they report positive changes, validate them
4. If they report distress, offer reassurance that this is normal
5. Ask if they're ready to continue to the next set
6. When ready, say "Let's continue to the next set"

IMPORTANT RULES:
- Keep responses very brief (1-2 sentences)
- Don't analyze or interpret their experience
- Just acknowledge and move forward
- If they need to stop, respect that immediately`,

  closing: `You are Matcha concluding a Flash Technique session.

CURRENT PHASE: Session Closing

YOUR TASK:
1. Ask them to briefly bring to mind the original topic that was bothering them
2. Ask how it feels now, on a scale of 0-10
3. Acknowledge any improvement (or validate if no change yet - that's also normal)
4. Thank them for their work today
5. Remind them to notice how they feel over the coming hours and days
6. Say "Session complete" when finished

IMPORTANT RULES:
- Keep responses brief and warm
- Don't ask them to describe the topic again - just bring it to mind
- Celebrate any positive shift, no matter how small`,
};

export function useFlashSessionVoice(): UseFlashSessionVoiceReturn {
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [voicePhase, setVoicePhase] = useState<VoicePhase>(null);
  const [isVoiceConnected, setIsVoiceConnected] = useState(false);
  const [isVoiceConnecting, setIsVoiceConnecting] = useState(false);
  const [volumeLevel, setVolumeLevel] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [assistantSpeaking, setAssistantSpeaking] = useState(false);
  const [transcript, setTranscript] = useState<Array<{ role: 'USER' | 'ASSISTANT'; content: string }>>([]);
  const [error, setError] = useState<string | null>(null);

  const vapiRef = useRef<Vapi | null>(null);
  const voicePhaseRef = useRef<VoicePhase>(null);

  // Keep ref in sync
  useEffect(() => {
    voicePhaseRef.current = voicePhase;
  }, [voicePhase]);

  // Volume smoothing
  const smoothVolume = useCallback((level: number) => {
    setVolumeLevel(prev => prev * 0.6 + level * 0.4);
    setIsSpeaking(level > 0.1);
  }, []);

  // Initialize Vapi instance
  useEffect(() => {
    const publicKey = process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY;

    if (!publicKey) {
      return;
    }

    const vapi = new Vapi(publicKey);
    vapiRef.current = vapi;

    vapi.on('call-start', () => {
      setIsVoiceConnected(true);
      setIsVoiceConnecting(false);
      setError(null);
    });

    vapi.on('call-end', () => {
      setIsVoiceConnected(false);
      setIsVoiceConnecting(false);
      setAssistantSpeaking(false);
      setIsSpeaking(false);
    });

    vapi.on('speech-start', () => {
      setAssistantSpeaking(true);
    });

    vapi.on('speech-end', () => {
      setAssistantSpeaking(false);
    });

    vapi.on('message', (message: any) => {
      if (message.type === 'transcript' && message.transcriptType === 'final') {
        const role = message.role === 'user' ? 'USER' : 'ASSISTANT';
        setTranscript(prev => [
          ...prev,
          { role: role as 'USER' | 'ASSISTANT', content: message.transcript },
        ]);
      }
    });

    vapi.on('volume-level', (level: number) => {
      smoothVolume(level);
    });

    vapi.on('error', (err: any) => {
      console.error('Flash voice error:', err);
      const errorMessage = err?.message || err?.error?.message || 'Voice connection failed';
      setError(errorMessage);
      setIsVoiceConnected(false);
      setIsVoiceConnecting(false);
    });

    return () => {
      vapi.stop();
    };
  }, [smoothVolume]);

  const enableVoice = useCallback(() => {
    setVoiceEnabled(true);
  }, []);

  const disableVoice = useCallback(() => {
    setVoiceEnabled(false);
    if (vapiRef.current && isVoiceConnected) {
      vapiRef.current.stop();
    }
  }, [isVoiceConnected]);

  const startVoicePhase = useCallback(async (phase: VoicePhase) => {
    if (!vapiRef.current || !phase) {
      return;
    }

    setIsVoiceConnecting(true);
    setError(null);
    setVoicePhase(phase);
    setTranscript([]);

    const prompt = VOICE_PROMPTS[phase];

    const firstMessageMap = {
      setup: "Hi, I'm Matcha. I'm here to guide you through a Flash Technique session. It's a gentle way to reduce distress without having to relive difficult memories. What's been weighing on you lately? Just the topic - we won't go into details.",
      'check-in': "Let's take a breath. What did you notice during that set?",
      closing: "We're almost done. Can you briefly bring to mind what was bothering you earlier? Just notice how it feels now, and tell me on a scale of 0 to 10.",
    };

    try {
      const assistantConfig = {
        model: {
          provider: 'openai' as const,
          model: 'gpt-4o-mini' as const,
          messages: [
            {
              role: 'system' as const,
              content: prompt,
            },
          ],
          temperature: 0.7,
        },
        voice: {
          provider: 'vapi' as const,
          voiceId: 'Lily',
        },
        firstMessage: firstMessageMap[phase],
        silenceTimeoutSeconds: phase === 'setup' ? 45 : 30,
        maxDurationSeconds: phase === 'setup' ? 300 : 120,
        backgroundSound: 'off',
        backchannelingEnabled: true,
        backgroundDenoisingEnabled: true,
      };

      await vapiRef.current.start(assistantConfig as any);
    } catch (err: any) {
      console.error('Failed to start voice phase:', err);
      setError(err.message || 'Failed to start voice');
      setIsVoiceConnecting(false);
      setVoicePhase(null);
    }
  }, []);

  const endVoicePhase = useCallback(() => {
    if (vapiRef.current) {
      vapiRef.current.stop();
    }
    setVoicePhase(null);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // State
    voiceEnabled,
    voicePhase,
    isVoiceConnected,
    isVoiceConnecting,
    volumeLevel,
    isSpeaking,
    assistantSpeaking,
    transcript,
    error,
    // Actions
    enableVoice,
    disableVoice,
    startVoicePhase,
    endVoicePhase,
    clearError,
  };
}
