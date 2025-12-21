'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Vapi from '@vapi-ai/web';
import { VoiceOrb, VoiceOrbStatus } from './VoiceOrb';

interface VoiceChatProps {
  onTranscript?: (messages: Array<{ role: 'USER' | 'ASSISTANT'; content: string }>) => void;
  onSessionEnd?: () => void;
  isVisible?: boolean;
}

interface TranscriptEntry {
  role: 'USER' | 'ASSISTANT';
  content: string;
  timestamp: Date;
}

export function VoiceChat({ onTranscript, onSessionEnd, isVisible = true }: VoiceChatProps) {
  const [vapi, setVapi] = useState<Vapi | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [volumeLevel, setVolumeLevel] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [assistantSpeaking, setAssistantSpeaking] = useState(false);

  // Volume smoothing callback
  const smoothVolume = useCallback((newLevel: number) => {
    setVolumeLevel(prev => prev * 0.6 + newLevel * 0.4);
    setIsSpeaking(newLevel > 0.1);
  }, []);

  // Determine orb status
  const getOrbStatus = (): VoiceOrbStatus => {
    if (isConnecting) return 'connecting';
    if (!isActive) return 'idle';
    if (assistantSpeaking) return 'ai-speaking';
    if (isSpeaking) return 'user-speaking';
    return 'listening';
  };

  // Report transcripts back to parent
  useEffect(() => {
    if (transcript.length > 0 && onTranscript) {
      onTranscript(transcript.map(t => ({ role: t.role, content: t.content })));
    }
  }, [transcript, onTranscript]);

  // Initialize Vapi client
  useEffect(() => {
    const publicKey = process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY;

    if (!publicKey) {
      setError('Voice not configured');
      return;
    }

    const vapiInstance = new Vapi(publicKey);
    setVapi(vapiInstance);

    vapiInstance.on('call-start', () => {
      setIsActive(true);
      setIsConnecting(false);
      setError(null);
    });

    vapiInstance.on('call-end', () => {
      setIsActive(false);
      setIsConnecting(false);
      setAssistantSpeaking(false);
      setIsSpeaking(false);
      if (onSessionEnd) {
        onSessionEnd();
      }
    });

    vapiInstance.on('speech-start', () => {
      setAssistantSpeaking(true);
    });

    vapiInstance.on('speech-end', () => {
      setAssistantSpeaking(false);
    });

    vapiInstance.on('message', (message: any) => {
      if (message.type === 'transcript' && message.transcriptType === 'final') {
        const role = message.role === 'user' ? 'USER' : 'ASSISTANT';
        setTranscript(prev => [
          ...prev,
          {
            role: role as 'USER' | 'ASSISTANT',
            content: message.transcript,
            timestamp: new Date(),
          },
        ]);
      }
    });

    vapiInstance.on('volume-level', (level: number) => {
      smoothVolume(level);
    });

    vapiInstance.on('error', (error: any) => {
      console.error('Voice error:', error);
      const errorMessage = error?.message || error?.error?.message || 'Voice connection failed';
      setError(errorMessage);
      setIsActive(false);
      setIsConnecting(false);
    });

    return () => {
      vapiInstance.stop();
    };
  }, [onSessionEnd]);

  const startCall = useCallback(async () => {
    if (!vapi) {
      setError('Voice not initialized');
      return;
    }

    setIsConnecting(true);
    setError(null);
    setTranscript([]);

    try {
      const assistantConfig = {
        model: {
          provider: 'openai' as const,
          model: 'gpt-4o-mini' as const,
          messages: [
            {
              role: 'system' as const,
              content: `You are Matcha, a warm and supportive AI companion focused on mental wellness.
Your personality is calm, empathetic, and gently curious. Keep responses conversational and brief (1-3 sentences typically).
Listen actively and validate feelings. Ask thoughtful follow-up questions to understand better.
Never diagnose or provide medical advice. If someone mentions crisis or self-harm, encourage professional help.
Speak naturally as if in a caring conversation with a friend.`
            }
          ],
        },
        voice: {
          provider: 'vapi' as const,
          voiceId: 'Lily',
        },
        firstMessage: "Hey, I'm Matcha. What's on your mind?",
        silenceTimeoutSeconds: 60,
        maxDurationSeconds: 1800,
        backgroundSound: 'off',
        backchannelingEnabled: true,
        backgroundDenoisingEnabled: true,
      };

      await vapi.start(assistantConfig as any);
    } catch (error: any) {
      console.error('Failed to start call:', error);

      if (error.message?.includes('microphone')) {
        setError('Microphone access needed');
      } else if (error.message?.includes('not supported')) {
        setError('Voice not supported in this browser');
      } else {
        setError('Could not start voice chat');
      }
      setIsConnecting(false);
    }
  }, [vapi]);

  const endCall = useCallback(() => {
    vapi?.stop();
  }, [vapi]);

  const toggleCall = useCallback(() => {
    if (isActive) {
      endCall();
    } else if (!isConnecting) {
      startCall();
    }
  }, [isActive, isConnecting, startCall, endCall]);

  if (!isVisible) return null;

  return (
    <div className="voice-chat-container">
      {/* Voice Button */}
      <button
        onClick={toggleCall}
        disabled={isConnecting}
        className={`voice-button ${isActive ? 'active' : ''} ${isConnecting ? 'connecting' : ''}`}
        title={isActive ? 'End voice chat' : 'Start voice chat'}
      >
        {isConnecting ? (
          <div className="voice-button-spinner" />
        ) : isActive ? (
          <div className="voice-button-waves">
            <span style={{ '--delay': '0s', '--height': isSpeaking ? '60%' : '20%' } as React.CSSProperties} />
            <span style={{ '--delay': '0.1s', '--height': isSpeaking ? '100%' : '30%' } as React.CSSProperties} />
            <span style={{ '--delay': '0.2s', '--height': isSpeaking ? '80%' : '25%' } as React.CSSProperties} />
            <span style={{ '--delay': '0.3s', '--height': isSpeaking ? '90%' : '20%' } as React.CSSProperties} />
            <span style={{ '--delay': '0.4s', '--height': isSpeaking ? '70%' : '30%' } as React.CSSProperties} />
          </div>
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            <line x1="12" y1="19" x2="12" y2="23" />
            <line x1="8" y1="23" x2="16" y2="23" />
          </svg>
        )}
      </button>

      {/* Error Toast */}
      {error && (
        <div className="voice-error">
          <span>{error}</span>
          <button onClick={() => setError(null)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      )}

      {/* Active Call Overlay */}
      {isActive && (
        <div className="voice-active-indicator">
          <VoiceOrb
            status={getOrbStatus()}
            volumeLevel={volumeLevel}
            size="lg"
          />
          <div className="voice-status">
            {assistantSpeaking ? 'Matcha is speaking...' : isSpeaking ? 'Listening...' : 'Speak naturally'}
          </div>
          <button onClick={endCall} className="voice-end-button">
            End Conversation
          </button>
        </div>
      )}

      {/* Live Transcript */}
      {isActive && transcript.length > 0 && (
        <div className="voice-transcript">
          {transcript.slice(-3).map((entry, index) => (
            <div
              key={index}
              className={`voice-transcript-entry ${entry.role === 'USER' ? 'user' : 'assistant'}`}
            >
              <span className="voice-transcript-role">
                {entry.role === 'USER' ? 'You' : 'Matcha'}
              </span>
              <span className="voice-transcript-text">{entry.content}</span>
            </div>
          ))}
        </div>
      )}

      <style jsx>{`
        .voice-chat-container {
          position: relative;
          display: flex;
          align-items: center;
        }

        .voice-button {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          border: none;
          background: var(--cream-100);
          color: var(--text-secondary);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
          flex-shrink: 0;
        }

        .voice-button:hover {
          background: var(--matcha-100);
          color: var(--matcha-600);
        }

        .voice-button.active {
          background: linear-gradient(135deg, var(--matcha-500) 0%, var(--matcha-600) 100%);
          color: white;
          box-shadow: 0 4px 14px rgba(104, 166, 125, 0.4);
        }

        .voice-button.connecting {
          opacity: 0.7;
          cursor: wait;
        }

        .voice-button-spinner {
          width: 20px;
          height: 20px;
          border: 2px solid transparent;
          border-top-color: currentColor;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        .voice-button-waves {
          display: flex;
          align-items: center;
          gap: 2px;
          height: 20px;
        }

        .voice-button-waves span {
          width: 3px;
          height: var(--height, 30%);
          background: currentColor;
          border-radius: 2px;
          animation: wave 0.5s ease-in-out infinite alternate;
          animation-delay: var(--delay, 0s);
          transition: height 0.15s ease;
        }

        @keyframes wave {
          from { transform: scaleY(0.5); }
          to { transform: scaleY(1); }
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .voice-error {
          position: absolute;
          bottom: calc(100% + 8px);
          right: 0;
          background: var(--terra-50);
          border: 1px solid var(--terra-200);
          color: var(--terra-600);
          padding: 8px 12px;
          border-radius: 8px;
          font-size: 13px;
          display: flex;
          align-items: center;
          gap: 8px;
          white-space: nowrap;
          animation: slideUp 0.2s ease;
          z-index: 100;
        }

        .voice-error button {
          background: none;
          border: none;
          color: inherit;
          cursor: pointer;
          padding: 2px;
          opacity: 0.6;
        }

        .voice-error button:hover {
          opacity: 1;
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .voice-active-indicator {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.85);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 24px;
          z-index: 1000;
          animation: fadeIn 0.3s ease;
          backdrop-filter: blur(8px);
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .voice-status {
          color: rgba(255, 255, 255, 0.9);
          font-size: 16px;
          animation: fadeInUp 0.3s ease 0.1s backwards;
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .voice-end-button {
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: white;
          padding: 12px 32px;
          border-radius: 24px;
          font-size: 15px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          animation: fadeInUp 0.3s ease 0.2s backwards;
        }

        .voice-end-button:hover {
          background: rgba(255, 255, 255, 0.15);
          border-color: rgba(255, 255, 255, 0.3);
        }

        .voice-transcript {
          position: fixed;
          bottom: 100px;
          left: 50%;
          transform: translateX(-50%);
          width: 90%;
          max-width: 500px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          z-index: 1001;
        }

        .voice-transcript-entry {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(4px);
          border-radius: 12px;
          padding: 12px 16px;
          animation: slideIn 0.3s ease;
        }

        .voice-transcript-entry.user {
          margin-left: 20%;
          background: rgba(104, 166, 125, 0.3);
        }

        .voice-transcript-entry.assistant {
          margin-right: 20%;
          background: rgba(255, 255, 255, 0.15);
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .voice-transcript-role {
          display: block;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: rgba(255, 255, 255, 0.6);
          margin-bottom: 4px;
        }

        .voice-transcript-text {
          color: white;
          font-size: 14px;
          line-height: 1.4;
        }
      `}</style>
    </div>
  );
}
