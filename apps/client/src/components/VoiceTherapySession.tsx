'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Vapi from '@vapi-ai/web';
import { VoiceOrb, VoiceOrbStatus } from './VoiceOrb';

interface VoiceTherapySessionProps {
  sessionType?: 'general-therapy' | 'flash-technique' | 'crisis-support';
  onSessionEnd?: (transcript: string[]) => void;
}

export function VoiceTherapySession({
  sessionType = 'general-therapy',
  onSessionEnd
}: VoiceTherapySessionProps) {
  const [vapi, setVapi] = useState<Vapi | null>(null);
  const [isCallActive, setIsCallActive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [transcript, setTranscript] = useState<Array<{ role: string; text: string; time: Date }>>([]);
  const [currentMessage, setCurrentMessage] = useState<{ role: string; text: string } | null>(null);
  const [messageVisible, setMessageVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [volumeLevel, setVolumeLevel] = useState(0);
  const [assistantSpeaking, setAssistantSpeaking] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const fadeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const transcriptRef = useRef<Array<{ role: string; text: string; time: Date }>>([]);

  // Volume smoothing callback
  const smoothVolume = useCallback((newLevel: number) => {
    setVolumeLevel(prev => prev * 0.6 + newLevel * 0.4);
    setIsSpeaking(newLevel > 0.1);
  }, []);

  // Determine orb status
  const getOrbStatus = (): VoiceOrbStatus => {
    if (isConnecting) return 'connecting';
    if (!isCallActive) return 'idle';
    if (assistantSpeaking) return 'ai-speaking';
    if (isSpeaking) return 'user-speaking';
    return 'listening';
  };

  // Initialize Vapi client
  useEffect(() => {
    const publicKey = process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY;

    if (!publicKey) {
      setError('Vapi public key not configured. Please add NEXT_PUBLIC_VAPI_PUBLIC_KEY to your .env.local file');
      return;
    }

    const vapiInstance = new Vapi(publicKey);
    setVapi(vapiInstance);

    // Event listeners
    vapiInstance.on('call-start', () => {
      console.log('Voice call started');
      setIsCallActive(true);
      setIsConnecting(false);
      setError(null);
    });

    vapiInstance.on('call-end', () => {
      console.log('Voice call ended');
      setIsCallActive(false);
      setIsConnecting(false);
      setAssistantSpeaking(false);
      setIsSpeaking(false);

      // Callback with transcript using ref to avoid stale closure
      if (onSessionEnd) {
        onSessionEnd(transcriptRef.current.map(t => `${t.role}: ${t.text}`));
      }
    });

    vapiInstance.on('speech-start', () => {
      console.log('AI Speech started');
      setAssistantSpeaking(true);
    });

    vapiInstance.on('speech-end', () => {
      console.log('AI Speech ended');
      setAssistantSpeaking(false);
    });

    vapiInstance.on('message', (message: any) => {
      console.log('Vapi message:', message);

      // Handle transcript updates
      if (message.type === 'transcript' && message.transcriptType === 'final') {
        const role = message.role === 'user' ? 'You' : 'Matcha';
        const newMessage = {
          role,
          text: message.transcript,
          time: new Date(),
        };

        // Add to full transcript for callback (update ref to avoid closure issues)
        transcriptRef.current = [...transcriptRef.current, newMessage];
        setTranscript(transcriptRef.current);

        // Show current message with fade
        setCurrentMessage({ role, text: message.transcript });
        setMessageVisible(true);

        // Clear any existing timeout
        if (fadeTimeoutRef.current) {
          clearTimeout(fadeTimeoutRef.current);
        }

        // Fade out after 3 seconds
        fadeTimeoutRef.current = setTimeout(() => {
          setMessageVisible(false);
        }, 3000);
      }
    });

    vapiInstance.on('volume-level', (level: number) => {
      smoothVolume(level);
    });

    vapiInstance.on('error', (error: any) => {
      console.error('Vapi error object:', JSON.stringify(error, null, 2));
      console.error('Vapi error keys:', Object.keys(error || {}));
      console.error('Vapi error type:', typeof error);

      // Try to extract error message from various possible formats
      const errorMessage = error?.message
        || error?.error?.message
        || error?.error
        || error?.msg
        || (typeof error === 'string' ? error : null)
        || 'An error occurred during the voice session. Check browser console for details.';

      setError(errorMessage);
      setIsCallActive(false);
      setIsConnecting(false);
    });

    return () => {
      vapiInstance.stop();
      if (fadeTimeoutRef.current) {
        clearTimeout(fadeTimeoutRef.current);
      }
    };
  }, []);

  const startCall = async () => {
    if (!vapi) {
      setError('Vapi not initialized');
      return;
    }

    setIsConnecting(true);
    setError(null);
    setTranscript([]);
    transcriptRef.current = [];

    try {
      // Build first message based on session type
      const firstMessageMap = {
        'general-therapy': "Hi, I'm Matcha. I'm here to listen and support you. What's on your mind today?",
        'flash-technique': "Hi, I'm ready to guide you through a Flash Technique session. This will take about 10-15 minutes. Before we start, I want to make sure you're in a safe, comfortable place where you won't be interrupted. Are you ready?",
        'crisis-support': "I'm here with you. You've reached out, and that takes courage. I want you to know you're not alone right now. Can you tell me what's happening?",
      };

      // Start Vapi call with minimal config to test
      const assistantConfig = {
        model: {
          provider: 'openai' as const,
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system' as const,
              content: 'You are Matcha, a friendly and supportive AI companion. Keep responses brief and conversational.'
            }
          ],
        },
        voice: {
          provider: '11labs' as const,
          voiceId: '21m00Tcm4TlvDq8ikWAM', // Rachel - warm female voice
        },
        firstMessage: firstMessageMap[sessionType],
      };

      console.log('Starting Vapi with config:', JSON.stringify(assistantConfig, null, 2));
      console.log('Vapi public key:', process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY?.slice(0, 10) + '...');

      await vapi.start(assistantConfig as any);

    } catch (error: any) {
      console.error('Failed to start call:', error);

      // Provide helpful error messages
      if (error.message?.includes('sign in')) {
        setError('Please sign in to use voice therapy');
      } else if (error.message?.includes('microphone')) {
        setError('Microphone access denied. Please allow microphone access and try again.');
      } else if (error.message?.includes('not supported')) {
        setError('Voice calls are not supported in this browser. Please try Chrome or Edge.');
      } else {
        setError(error.message || 'Failed to start voice session. Check console for details.');
      }

      setIsConnecting(false);
    }
  };

  const endCall = () => {
    vapi?.stop();
  };

  const getSessionTitle = () => {
    switch (sessionType) {
      case 'flash-technique':
        return 'Flash Technique Session';
      case 'crisis-support':
        return 'Crisis Support';
      default:
        return 'Voice Therapy Session';
    }
  };

  const getSessionDescription = () => {
    switch (sessionType) {
      case 'flash-technique':
        return 'A guided EMDR session for processing distressing memories (10-15 minutes)';
      case 'crisis-support':
        return 'Immediate support for difficult moments';
      default:
        return 'Have a conversation with Matcha using your voice';
    }
  };

  return (
    <div className="voice-therapy-session max-w-4xl mx-auto p-6">
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-soft)',
          boxShadow: 'var(--shadow-lg)',
          backdropFilter: 'blur(8px)',
        }}
      >
        {/* Header */}
        <div
          className="p-6"
          style={{
            background: 'linear-gradient(135deg, var(--matcha-50) 0%, var(--cream-100) 100%)',
            borderBottom: '1px solid var(--border-soft)',
          }}
        >
          <h2
            className="text-2xl font-bold mb-2"
            style={{ color: 'var(--text-primary)' }}
          >
            {getSessionTitle()}
          </h2>
          <p style={{ color: 'var(--text-secondary)' }}>
            {getSessionDescription()}
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <div
            className="m-6 p-4 rounded-xl"
            style={{
              background: 'var(--terra-50)',
              borderLeft: '4px solid var(--terra-500)',
            }}
          >
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5" style={{ color: 'var(--terra-500)' }} viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm" style={{ color: 'var(--terra-600)' }}>{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Call Controls */}
        <div className="p-6 flex flex-col items-center space-y-4">
          {!isCallActive && !isConnecting && (
            <button
              onClick={startCall}
              className="font-semibold py-4 px-8 rounded-full flex items-center space-x-3 transition-all duration-200 transform hover:scale-[1.02]"
              style={{
                background: 'linear-gradient(135deg, var(--matcha-500) 0%, var(--matcha-600) 100%)',
                color: 'var(--text-inverse)',
                boxShadow: '0 4px 14px rgba(104, 166, 125, 0.35)',
              }}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
              <span>Start Session</span>
            </button>
          )}

          {isConnecting && (
            <div className="flex flex-col items-center space-y-3">
              <div className="flex gap-1">
                <span className="w-3 h-3 rounded-full animate-bounce" style={{ background: 'var(--matcha-500)', animationDelay: '0ms' }}></span>
                <span className="w-3 h-3 rounded-full animate-bounce" style={{ background: 'var(--matcha-500)', animationDelay: '150ms' }}></span>
                <span className="w-3 h-3 rounded-full animate-bounce" style={{ background: 'var(--matcha-500)', animationDelay: '300ms' }}></span>
              </div>
              <p style={{ color: 'var(--text-secondary)' }}>Connecting to Matcha...</p>
            </div>
          )}

          {isCallActive && (
            <>
              {/* Voice Orb with Volume Indicator */}
              <div className="flex items-center space-x-4 mb-4">
                <VoiceOrb
                  status={getOrbStatus()}
                  volumeLevel={volumeLevel}
                  size="md"
                />
                <div className="text-center">
                  <p className="text-sm" style={{ color: 'var(--text-primary)' }}>
                    {assistantSpeaking ? 'Matcha is speaking...' : isSpeaking ? 'Listening...' : 'Session Active'}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Speak naturally</p>
                </div>
              </div>

              <button
                onClick={endCall}
                className="font-semibold py-3 px-6 rounded-full flex items-center space-x-2 transition-all duration-200 hover:scale-[1.02]"
                style={{
                  background: 'var(--terra-500)',
                  color: 'var(--text-inverse)',
                  boxShadow: '0 4px 14px rgba(180, 120, 120, 0.3)',
                }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span>End Session</span>
              </button>
            </>
          )}
        </div>

        {/* Current Message - Fading */}
        {isCallActive && currentMessage && (
          <div
            className="px-6 pb-4 transition-opacity duration-500"
            style={{ opacity: messageVisible ? 1 : 0 }}
          >
            <div
              className="p-4 rounded-xl text-center"
              style={{
                background: currentMessage.role === 'You'
                  ? 'linear-gradient(135deg, var(--matcha-500) 0%, var(--matcha-600) 100%)'
                  : 'var(--cream-100)',
                color: currentMessage.role === 'You' ? 'var(--text-inverse)' : 'var(--text-primary)',
              }}
            >
              <p className="text-xs font-semibold mb-1" style={{ opacity: 0.7 }}>
                {currentMessage.role === 'You' ? 'You said' : 'Matcha said'}
              </p>
              <p className="text-sm leading-relaxed">{currentMessage.text}</p>
            </div>
          </div>
        )}

        {/* Help Text */}
        {!isCallActive && !isConnecting && (
          <div
            className="p-4"
            style={{
              background: 'var(--cream-100)',
              borderTop: '1px solid var(--border-soft)',
            }}
          >
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              <strong style={{ color: 'var(--matcha-600)' }}>Tip:</strong> Make sure your microphone is enabled in your browser settings.
              You can interrupt Matcha at any time by simply speaking.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
