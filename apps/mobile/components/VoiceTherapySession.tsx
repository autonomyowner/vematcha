import { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../lib/colors';

interface VoiceTherapySessionProps {
  sessionType?: 'general-therapy' | 'flash-technique' | 'crisis-support';
  onSessionEnd?: (transcript: Array<{ role: 'USER' | 'ASSISTANT'; content: string }>) => void;
  onClose?: () => void;
}

const VAPI_PUBLIC_KEY = process.env.EXPO_PUBLIC_VAPI_PUBLIC_KEY || '';

// HTML template that runs Vapi in a WebView
const getVapiHTML = (sessionType: string, publicKey: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>Voice Session</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #0a0a0a;
      color: white;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .container {
      text-align: center;
      width: 100%;
      max-width: 400px;
    }
    .orb-container {
      position: relative;
      width: 180px;
      height: 180px;
      margin: 0 auto 32px;
    }
    .orb-pulse {
      position: absolute;
      inset: 0;
      border-radius: 50%;
      background: linear-gradient(135deg, #68a67d, #5a9470);
      animation: pulse 2s ease-in-out infinite;
    }
    .orb-pulse-2 {
      position: absolute;
      inset: -10px;
      border-radius: 50%;
      background: linear-gradient(135deg, #68a67d, #5a9470);
      opacity: 0.3;
      animation: pulse 2s ease-in-out infinite 0.5s;
    }
    .orb-core {
      position: absolute;
      inset: 30px;
      border-radius: 50%;
      background: linear-gradient(135deg, #5a9470, #4a7c5d);
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 8px 32px rgba(104, 166, 125, 0.4);
    }
    .mic-icon {
      width: 40px;
      height: 40px;
      fill: white;
    }
    @keyframes pulse {
      0%, 100% { transform: scale(1); opacity: 0.4; }
      50% { transform: scale(1.15); opacity: 0.2; }
    }
    .status {
      font-size: 18px;
      margin-bottom: 8px;
      color: rgba(255,255,255,0.9);
    }
    .substatus {
      font-size: 14px;
      color: rgba(255,255,255,0.6);
      margin-bottom: 32px;
    }
    .transcript {
      background: rgba(255,255,255,0.1);
      border-radius: 12px;
      padding: 16px;
      margin-bottom: 24px;
      max-height: 200px;
      overflow-y: auto;
      text-align: left;
    }
    .transcript-entry {
      margin-bottom: 12px;
    }
    .transcript-role {
      font-size: 11px;
      text-transform: uppercase;
      color: rgba(255,255,255,0.5);
      margin-bottom: 2px;
    }
    .transcript-text {
      font-size: 14px;
      line-height: 1.4;
    }
    .user .transcript-role { color: #8fc49a; }
    .end-btn {
      background: rgba(255,255,255,0.1);
      border: 1px solid rgba(255,255,255,0.2);
      color: white;
      padding: 14px 32px;
      border-radius: 24px;
      font-size: 16px;
      cursor: pointer;
    }
    .error {
      background: rgba(200, 100, 100, 0.2);
      border: 1px solid rgba(200, 100, 100, 0.4);
      padding: 16px;
      border-radius: 12px;
      margin-bottom: 24px;
      color: #ff9999;
    }
    .connecting {
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .spinner {
      width: 40px;
      height: 40px;
      border: 3px solid rgba(255,255,255,0.2);
      border-top-color: #5a9470;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-bottom: 16px;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    .hidden { display: none; }
  </style>
</head>
<body>
  <div class="container">
    <div id="connecting" class="connecting">
      <div class="spinner"></div>
      <div class="status">Connecting to Matcha...</div>
      <div class="substatus">Please allow microphone access</div>
    </div>

    <div id="active" class="hidden">
      <div class="orb-container">
        <div class="orb-pulse-2"></div>
        <div class="orb-pulse"></div>
        <div class="orb-core">
          <svg class="mic-icon" viewBox="0 0 24 24">
            <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
            <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
          </svg>
        </div>
      </div>
      <div id="statusText" class="status">Speak naturally</div>
      <div id="substatusText" class="substatus">Matcha is listening</div>
      <div id="transcript" class="transcript hidden"></div>
      <button id="endBtn" class="end-btn" onclick="endCall()">End Conversation</button>
    </div>

    <div id="error" class="error hidden"></div>
  </div>

  <script src="https://cdn.jsdelivr.net/npm/@vapi-ai/web@latest/dist/vapi.iife.js"></script>
  <script>
    const publicKey = "${publicKey}";
    const sessionType = "${sessionType}";
    let vapi = null;
    let transcript = [];

    const firstMessages = {
      'general-therapy': "Hi, I'm Matcha. I'm here to listen and support you. What's on your mind today?",
      'flash-technique': "Hi, I'm ready to guide you through a Flash Technique session. Before we start, make sure you're in a safe, comfortable place. Are you ready?",
      'crisis-support': "I'm here with you. You've reached out, and that takes courage. You're not alone right now. Can you tell me what's happening?"
    };

    const systemPrompts = {
      'general-therapy': "You are Matcha, a warm and supportive AI companion focused on mental wellness. Keep responses conversational and brief (1-3 sentences). Listen actively and validate feelings. Never diagnose or provide medical advice. If someone mentions crisis or self-harm, encourage professional help.",
      'flash-technique': "You are Matcha, guiding a Flash Technique EMDR session. Guide the user through bilateral stimulation while they hold a positive memory. Be structured but warm. Give clear instructions for eye movements. Keep responses brief and calming.",
      'crisis-support': "You are Matcha, providing crisis support. Your primary goal is safety and de-escalation. Be immediately warm and present. Listen without judgment. Validate their feelings. Help ground them in the present. If they express imminent danger, encourage calling 988 or 911."
    };

    function updateStatus(main, sub) {
      document.getElementById('statusText').textContent = main;
      document.getElementById('substatusText').textContent = sub;
    }

    function showError(msg) {
      document.getElementById('error').textContent = msg;
      document.getElementById('error').classList.remove('hidden');
      document.getElementById('connecting').classList.add('hidden');
    }

    function addTranscript(role, text) {
      transcript.push({ role, content: text });
      const container = document.getElementById('transcript');
      container.classList.remove('hidden');

      const entry = document.createElement('div');
      entry.className = 'transcript-entry ' + (role === 'USER' ? 'user' : 'assistant');
      entry.innerHTML = '<div class="transcript-role">' + (role === 'USER' ? 'You' : 'Matcha') + '</div><div class="transcript-text">' + text + '</div>';
      container.appendChild(entry);
      container.scrollTop = container.scrollHeight;

      // Keep only last 5 entries visible
      while (container.children.length > 5) {
        container.removeChild(container.firstChild);
      }
    }

    function endCall() {
      if (vapi) {
        vapi.stop();
      }
      // Send transcript back to React Native
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'session-end',
        transcript: transcript
      }));
    }

    async function startCall() {
      try {
        vapi = new Vapi(publicKey);

        vapi.on('call-start', () => {
          document.getElementById('connecting').classList.add('hidden');
          document.getElementById('active').classList.remove('hidden');
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'call-start' }));
        });

        vapi.on('call-end', () => {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'session-end',
            transcript: transcript
          }));
        });

        vapi.on('speech-start', () => {
          updateStatus('Matcha is speaking...', 'Listen carefully');
        });

        vapi.on('speech-end', () => {
          updateStatus('Speak naturally', 'Matcha is listening');
        });

        vapi.on('message', (message) => {
          if (message.type === 'transcript' && message.transcriptType === 'final') {
            const role = message.role === 'user' ? 'USER' : 'ASSISTANT';
            addTranscript(role, message.transcript);
          }
        });

        vapi.on('error', (error) => {
          console.error('Vapi error:', error);
          showError(error?.message || 'Voice connection failed');
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'error',
            message: error?.message || 'Voice connection failed'
          }));
        });

        await vapi.start({
          model: {
            provider: 'openai',
            model: 'gpt-4o-mini',
            messages: [{ role: 'system', content: systemPrompts[sessionType] }]
          },
          voice: { provider: '11labs', voiceId: '21m00Tcm4TlvDq8ikWAM' }, // Rachel - warm female voice
          firstMessage: firstMessages[sessionType],
          silenceTimeoutSeconds: 60,
          maxDurationSeconds: sessionType === 'flash-technique' ? 1200 : 1800,
          backgroundSound: 'off',
          backchannelingEnabled: true,
          backgroundDenoisingEnabled: true
        });

      } catch (error) {
        console.error('Failed to start:', error);
        showError(error.message || 'Failed to start voice session');
      }
    }

    // Start immediately
    startCall();
  </script>
</body>
</html>
`;

export function VoiceTherapySession({
  sessionType = 'general-therapy',
  onSessionEnd,
  onClose,
}: VoiceTherapySessionProps) {
  const webViewRef = useRef<WebView>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);

      if (data.type === 'call-start') {
        setIsLoading(false);
      } else if (data.type === 'session-end') {
        if (onSessionEnd && data.transcript) {
          onSessionEnd(data.transcript);
        }
        onClose?.();
      } else if (data.type === 'error') {
        setError(data.message);
      }
    } catch (e) {
      console.error('Failed to parse WebView message:', e);
    }
  };

  if (!VAPI_PUBLIC_KEY) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.cream[50], padding: 24, justifyContent: 'center', alignItems: 'center' }}>
        <Ionicons name="alert-circle-outline" size={64} color={colors.terra[500]} />
        <Text style={{ fontSize: 18, color: colors.warm[900], marginTop: 16, textAlign: 'center' }}>
          Voice not configured
        </Text>
        <Text style={{ fontSize: 14, color: colors.warm[600], marginTop: 8, textAlign: 'center' }}>
          EXPO_PUBLIC_VAPI_PUBLIC_KEY is missing
        </Text>
        <TouchableOpacity
          onPress={onClose}
          style={{
            marginTop: 24,
            backgroundColor: colors.warm[200],
            paddingVertical: 12,
            paddingHorizontal: 24,
            borderRadius: 12,
          }}
        >
          <Text style={{ color: colors.warm[700], fontWeight: '600' }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#0a0a0a' }}>
      <WebView
        ref={webViewRef}
        source={{ html: getVapiHTML(sessionType, VAPI_PUBLIC_KEY) }}
        style={{ flex: 1, backgroundColor: '#0a0a0a' }}
        onMessage={handleMessage}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        mediaPlaybackRequiresUserAction={false}
        allowsInlineMediaPlayback={true}
        mediaCapturePermissionGrantType="grant"
        onError={(e) => {
          console.error('WebView error:', e.nativeEvent);
          setError('Failed to load voice session');
        }}
      />

      {/* Close button overlay */}
      <TouchableOpacity
        onPress={onClose}
        style={{
          position: 'absolute',
          top: Platform.OS === 'ios' ? 60 : 40,
          right: 20,
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: 'rgba(255,255,255,0.1)',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Ionicons name="close" size={24} color="white" />
      </TouchableOpacity>

      {error && (
        <View style={{
          position: 'absolute',
          bottom: 100,
          left: 20,
          right: 20,
          backgroundColor: 'rgba(200, 100, 100, 0.9)',
          padding: 16,
          borderRadius: 12,
        }}>
          <Text style={{ color: 'white', textAlign: 'center' }}>{error}</Text>
        </View>
      )}
    </View>
  );
}

export default VoiceTherapySession;
