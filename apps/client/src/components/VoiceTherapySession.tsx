'use client';

import { useState, useEffect, useRef } from 'react';
import Vapi from '@vapi-ai/web';

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
  const [error, setError] = useState<string | null>(null);
  const [volumeLevel, setVolumeLevel] = useState(0);
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll transcript to bottom
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript]);

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

      // Callback with transcript
      if (onSessionEnd) {
        onSessionEnd(transcript.map(t => `${t.role}: ${t.text}`));
      }
    });

    vapiInstance.on('speech-start', () => {
      console.log('Speech started');
    });

    vapiInstance.on('speech-end', () => {
      console.log('Speech ended');
    });

    vapiInstance.on('message', (message: any) => {
      console.log('Vapi message:', message);

      // Handle transcript updates
      if (message.type === 'transcript' && message.transcriptType === 'final') {
        const role = message.role === 'user' ? 'You' : 'Matcha';
        setTranscript(prev => [
          ...prev,
          {
            role,
            text: message.transcript,
            time: new Date(),
          },
        ]);
      }
    });

    vapiInstance.on('volume-level', (level: number) => {
      setVolumeLevel(level);
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
          provider: 'vapi' as const,
          voiceId: 'Lily',
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
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-50 to-green-100 p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {getSessionTitle()}
          </h2>
          <p className="text-gray-600">
            {getSessionDescription()}
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 m-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Call Controls */}
        <div className="p-6 flex flex-col items-center space-y-4">
          {!isCallActive && !isConnecting && (
            <button
              onClick={startCall}
              className="bg-green-600 hover:bg-green-700 text-white font-semibold py-4 px-8 rounded-full flex items-center space-x-3 transition-all transform hover:scale-105 shadow-lg"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
              <span>Start Session</span>
            </button>
          )}

          {isConnecting && (
            <div className="flex flex-col items-center space-y-3">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
              <p className="text-gray-600">Connecting...</p>
            </div>
          )}

          {isCallActive && (
            <>
              {/* Volume Indicator */}
              <div className="flex items-center space-x-4 mb-4">
                <div className="relative w-20 h-20">
                  <svg className="animate-pulse" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r={40 + volumeLevel * 10}
                      fill="rgba(34, 197, 94, 0.2)"
                      className="transition-all duration-100"
                    />
                    <circle cx="50" cy="50" r="35" fill="#22c55e" />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-500">Session Active</p>
                  <p className="text-xs text-gray-400">Speak naturally</p>
                </div>
              </div>

              <button
                onClick={endCall}
                className="bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-full flex items-center space-x-2 transition-all shadow-lg"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span>End Session</span>
              </button>
            </>
          )}
        </div>

        {/* Transcript */}
        {transcript.length > 0 && (
          <div className="border-t p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Transcript</h3>
            <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto space-y-3">
              {transcript.map((entry, index) => (
                <div
                  key={index}
                  className={`flex ${entry.role === 'You' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[70%] rounded-lg p-3 ${
                      entry.role === 'You'
                        ? 'bg-green-600 text-white'
                        : 'bg-white border border-gray-200 text-gray-900'
                    }`}
                  >
                    <p className="text-xs font-semibold mb-1 opacity-75">
                      {entry.role}
                    </p>
                    <p className="text-sm">{entry.text}</p>
                    <p className="text-xs mt-1 opacity-50">
                      {entry.time.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={transcriptEndRef} />
            </div>
          </div>
        )}

        {/* Help Text */}
        {!isCallActive && !isConnecting && (
          <div className="bg-blue-50 border-t p-4">
            <p className="text-sm text-blue-800">
              <strong>Tip:</strong> Make sure your microphone is enabled in your browser settings.
              You can interrupt Matcha at any time by simply speaking.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
