'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Vapi from '@vapi-ai/web';

type SessionType = 'general-therapy' | 'flash-technique' | 'crisis-support';

interface TranscriptEntry {
  role: 'USER' | 'ASSISTANT';
  content: string;
}

const firstMessages: Record<SessionType, string> = {
  'general-therapy': "Hi, I'm Matcha. I'm here to listen and support you. What's on your mind today?",
  'flash-technique': "Hi, I'm ready to guide you through a Flash Technique session. Before we start, make sure you're in a safe, comfortable place. Are you ready?",
  'crisis-support': "I'm here with you. You've reached out, and that takes courage. You're not alone right now. Can you tell me what's happening?"
};

const systemPrompts: Record<SessionType, string> = {
  'general-therapy': "You are Matcha, a warm and supportive AI companion focused on mental wellness. Keep responses conversational and brief (1-3 sentences). Listen actively and validate feelings. Never diagnose or provide medical advice. If someone mentions crisis or self-harm, encourage professional help.",
  'flash-technique': "You are Matcha, guiding a Flash Technique EMDR session. Guide the user through bilateral stimulation while they hold a positive memory. Be structured but warm. Give clear instructions for eye movements. Keep responses brief and calming.",
  'crisis-support': "You are Matcha, providing crisis support. Your primary goal is safety and de-escalation. Be immediately warm and present. Listen without judgment. Validate their feelings. Help ground them in the present. If they express imminent danger, encourage calling 988 or 911."
};

function VoiceMobileContent() {
  const searchParams = useSearchParams();
  const sessionType = (searchParams.get('type') as SessionType) || 'general-therapy';

  const [vapi, setVapi] = useState<Vapi | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'connecting' | 'active' | 'ended' | 'error'>('loading');
  const [statusText, setStatusText] = useState('Initializing...');
  const [subText, setSubText] = useState('Please wait');
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [volumeLevel, setVolumeLevel] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Send message to React Native WebView
  const postToRN = (data: any) => {
    if (typeof window !== 'undefined' && (window as any).ReactNativeWebView) {
      (window as any).ReactNativeWebView.postMessage(JSON.stringify(data));
    }
  };

  useEffect(() => {
    const publicKey = process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY;

    if (!publicKey) {
      setError('Voice not configured');
      setStatus('error');
      return;
    }

    const vapiInstance = new Vapi(publicKey);
    setVapi(vapiInstance);
    setStatus('ready');
    setStatusText('Ready');
    setSubText('Tap Start to begin');

    vapiInstance.on('call-start', () => {
      setStatus('active');
      setStatusText('Speak naturally');
      setSubText('Matcha is listening');
      postToRN({ type: 'call-start' });
    });

    vapiInstance.on('call-end', () => {
      setStatus('ended');
      setStatusText('Session ended');
      setSubText('Thank you for sharing');
      postToRN({ type: 'session-end', transcript });
    });

    vapiInstance.on('speech-start', () => {
      setStatusText('Matcha is speaking...');
      setSubText('Listen carefully');
    });

    vapiInstance.on('speech-end', () => {
      setStatusText('Speak naturally');
      setSubText('Matcha is listening');
    });

    vapiInstance.on('message', (message: any) => {
      if (message.type === 'transcript' && message.transcriptType === 'final') {
        const role = message.role === 'user' ? 'USER' : 'ASSISTANT';
        const entry = { role: role as 'USER' | 'ASSISTANT', content: message.transcript };
        setTranscript(prev => [...prev, entry]);
      }
    });

    vapiInstance.on('volume-level', (level: number) => {
      setVolumeLevel(level);
    });

    vapiInstance.on('error', (err: any) => {
      console.error('Vapi error:', err);
      setError(err?.message || 'Voice connection failed');
      setStatus('error');
      postToRN({ type: 'error', message: err?.message || 'Voice connection failed' });
    });

    return () => {
      vapiInstance.stop();
    };
  }, []);

  const startCall = async () => {
    if (!vapi) return;

    setStatus('connecting');
    setStatusText('Connecting...');
    setSubText('Please allow microphone access');
    setTranscript([]);

    try {
      await vapi.start({
        model: {
          provider: 'openai' as const,
          model: 'gpt-4o-mini',
          messages: [{ role: 'system' as const, content: systemPrompts[sessionType] }]
        },
        voice: { provider: '11labs' as const, voiceId: '21m00Tcm4TlvDq8ikWAM' }, // Rachel - warm female voice
        firstMessage: firstMessages[sessionType],
        silenceTimeoutSeconds: 60,
        maxDurationSeconds: sessionType === 'flash-technique' ? 1200 : 1800,
        backgroundSound: 'off',
        backchannelingEnabled: true,
        backgroundDenoisingEnabled: true,
      } as any);
    } catch (err: any) {
      console.error('Failed to start:', err);
      setError(err.message || 'Failed to start');
      setStatus('error');
    }
  };

  const endCall = () => {
    vapi?.stop();
  };

  const handleClose = () => {
    postToRN({ type: 'close' });
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0a0a0a',
      color: 'white',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      position: 'relative',
    }}>
      {/* Close button */}
      <button
        onClick={handleClose}
        style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          width: '40px',
          height: '40px',
          borderRadius: '20px',
          background: 'rgba(255,255,255,0.1)',
          border: 'none',
          color: 'white',
          fontSize: '24px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        ×
      </button>

      {/* Main content */}
      <div style={{ textAlign: 'center', width: '100%', maxWidth: '400px' }}>
        {/* Animated Orb */}
        <div style={{
          position: 'relative',
          width: '180px',
          height: '180px',
          margin: '0 auto 32px',
        }}>
          <div style={{
            position: 'absolute',
            inset: '-10px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #68a67d, #5a9470)',
            opacity: 0.3,
            animation: status === 'active' ? 'pulse 2s ease-in-out infinite' : 'none',
            transform: `scale(${1 + volumeLevel * 0.3})`,
            transition: 'transform 0.1s ease',
          }} />
          <div style={{
            position: 'absolute',
            inset: '0',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #68a67d, #5a9470)',
            opacity: 0.5,
            animation: status === 'active' ? 'pulse 2s ease-in-out infinite 0.5s' : 'none',
          }} />
          <div style={{
            position: 'absolute',
            inset: '30px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #5a9470, #4a7c5d)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 32px rgba(104, 166, 125, 0.4)',
          }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="white">
              <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
              <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
            </svg>
          </div>
        </div>

        {/* Status */}
        <div style={{ fontSize: '18px', marginBottom: '8px' }}>{statusText}</div>
        <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)', marginBottom: '32px' }}>{subText}</div>

        {/* Error */}
        {error && (
          <div style={{
            background: 'rgba(200, 100, 100, 0.2)',
            border: '1px solid rgba(200, 100, 100, 0.4)',
            padding: '16px',
            borderRadius: '12px',
            marginBottom: '24px',
            color: '#ff9999',
          }}>
            {error}
          </div>
        )}

        {/* Transcript */}
        {transcript.length > 0 && (
          <div style={{
            background: 'rgba(255,255,255,0.1)',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '24px',
            maxHeight: '200px',
            overflowY: 'auto',
            textAlign: 'left',
          }}>
            {transcript.slice(-5).map((entry, i) => (
              <div key={i} style={{ marginBottom: '12px' }}>
                <div style={{
                  fontSize: '11px',
                  textTransform: 'uppercase',
                  color: entry.role === 'USER' ? '#8fc49a' : 'rgba(255,255,255,0.5)',
                  marginBottom: '2px',
                }}>
                  {entry.role === 'USER' ? 'You' : 'Matcha'}
                </div>
                <div style={{ fontSize: '14px', lineHeight: 1.4 }}>{entry.content}</div>
              </div>
            ))}
          </div>
        )}

        {/* Buttons */}
        {status === 'ready' && (
          <button
            onClick={startCall}
            style={{
              background: 'linear-gradient(135deg, #5a9470, #4a7c5d)',
              border: 'none',
              color: 'white',
              padding: '16px 48px',
              borderRadius: '30px',
              fontSize: '18px',
              fontWeight: '600',
              cursor: 'pointer',
              boxShadow: '0 4px 20px rgba(104, 166, 125, 0.4)',
            }}
          >
            Start Session
          </button>
        )}

        {status === 'connecting' && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
          }}>
            <div style={{
              width: '24px',
              height: '24px',
              border: '3px solid rgba(255,255,255,0.2)',
              borderTopColor: '#5a9470',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
            }} />
            <span>Connecting...</span>
          </div>
        )}

        {status === 'active' && (
          <button
            onClick={endCall}
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.2)',
              color: 'white',
              padding: '14px 32px',
              borderRadius: '24px',
              fontSize: '16px',
              cursor: 'pointer',
            }}
          >
            End Conversation
          </button>
        )}

        {status === 'ended' && (
          <button
            onClick={handleClose}
            style={{
              background: 'linear-gradient(135deg, #5a9470, #4a7c5d)',
              border: 'none',
              color: 'white',
              padding: '14px 32px',
              borderRadius: '24px',
              fontSize: '16px',
              cursor: 'pointer',
            }}
          >
            Done
          </button>
        )}

        {status === 'error' && (
          <button
            onClick={() => {
              setError(null);
              setStatus('ready');
              setStatusText('Ready');
              setSubText('Tap Start to begin');
            }}
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.2)',
              color: 'white',
              padding: '14px 32px',
              borderRadius: '24px',
              fontSize: '16px',
              cursor: 'pointer',
            }}
          >
            Try Again
          </button>
        )}
      </div>

      <style jsx global>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 0.4; }
          50% { transform: scale(1.15); opacity: 0.2; }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#0a0a0a',
      color: 'white',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <div style={{
        width: '40px',
        height: '40px',
        border: '3px solid rgba(255,255,255,0.2)',
        borderTopColor: '#5a9470',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
      }} />
      <style jsx global>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default function VoiceMobilePage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <VoiceMobileContent />
    </Suspense>
  );
}
