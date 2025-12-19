'use client';

import { VoiceTherapySession } from '@/components/VoiceTherapySession';

export default function VoiceTestPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Voice Therapy Test
          </h1>
          <p className="text-lg text-gray-600">
            Test the new voice therapy feature powered by Vapi.ai
          </p>
        </div>

        <VoiceTherapySession
          sessionType="general-therapy"
          onSessionEnd={(transcript) => {
            console.log('Session ended. Full transcript:', transcript);
          }}
        />

        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">Testing Instructions:</h3>
          <ol className="list-decimal list-inside space-y-2 text-blue-800">
            <li>Click the "Start Session" button above</li>
            <li>Allow microphone access when prompted by your browser</li>
            <li>Wait for the green pulsing circle to appear</li>
            <li>Speak clearly: "Hello Matcha, how are you today?"</li>
            <li>Listen for AI voice response</li>
            <li>Check transcript appears below the controls</li>
            <li>Click "End Session" when done</li>
          </ol>
        </div>

        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-yellow-900 mb-3">⚠️ Troubleshooting:</h3>
          <ul className="list-disc list-inside space-y-2 text-yellow-800">
            <li>If microphone doesn't work: Check browser permissions (click lock icon in URL bar)</li>
            <li>If no voice response: Check browser console (F12) for errors</li>
            <li>If connection fails: Verify backend is running at http://localhost:4000</li>
            <li>Use Chrome or Edge for best compatibility</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
