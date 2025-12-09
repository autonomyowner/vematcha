'use client';

import { useCallback, useRef, useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { api } from '../../../lib/api';

interface UseTTSReturn {
  speak: (text: string, onStart?: () => void) => void;
  speakSequence: (texts: string[]) => void;
  stop: () => void;
  isSpeaking: boolean;
  isLoading: boolean;
  preloadPhrases: (phrases: string[]) => Promise<void>;
}

export function useTTS(): UseTTSReturn {
  const { getToken } = useAuth();
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioCache = useRef<Map<string, string>>(new Map());
  const isMountedRef = useRef(true);
  const isPlayingRef = useRef(false);
  const queueRef = useRef<Array<{ text: string; onStart?: () => void }>>([]);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
      audioCache.current.forEach((url) => URL.revokeObjectURL(url));
      audioCache.current.clear();
    };
  }, []);

  // Fallback to browser TTS
  const speakWithBrowser = useCallback((text: string, onStart?: () => void): Promise<void> => {
    return new Promise((resolve) => {
      if (!window.speechSynthesis) {
        onStart?.();
        resolve();
        return;
      }

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      utterance.onstart = () => {
        // Call onStart when audio actually begins
        onStart?.();
      };

      utterance.onend = () => resolve();
      utterance.onerror = () => resolve();

      window.speechSynthesis.cancel(); // Cancel any ongoing speech
      window.speechSynthesis.speak(utterance);
    });
  }, []);

  const fetchAudio = useCallback(async (text: string, onStart?: () => void): Promise<string | null> => {
    // Check cache first
    const cached = audioCache.current.get(text);
    if (cached) return cached;

    try {
      const token = await getToken();
      if (!token) {
        // Fallback to browser TTS if no token
        await speakWithBrowser(text, onStart);
        return null;
      }

      const audioBuffer = await api.textToSpeech(token, text);
      const blob = new Blob([audioBuffer], { type: 'audio/mpeg' });
      const url = URL.createObjectURL(blob);
      audioCache.current.set(text, url);
      return url;
    } catch (error) {
      console.error('TTS fetch error, falling back to browser TTS:', error);
      // Fallback to browser TTS on error
      await speakWithBrowser(text, onStart);
      return null;
    }
  }, [getToken, speakWithBrowser]);

  const playNext = useCallback(async () => {
    if (!isMountedRef.current || isPlayingRef.current || queueRef.current.length === 0) {
      return;
    }

    const item = queueRef.current.shift()!;
    isPlayingRef.current = true;
    setIsSpeaking(true);

    try {
      setIsLoading(true);
      const url = await fetchAudio(item.text, item.onStart);
      setIsLoading(false);

      if (!url || !isMountedRef.current) {
        isPlayingRef.current = false;
        setIsSpeaking(false);
        playNext();
        return;
      }

      const audio = new Audio(url);
      audioRef.current = audio;

      // For cached audio, call onStart immediately when playing starts
      audio.onplay = () => {
        item.onStart?.();
      };

      audio.onended = () => {
        if (isMountedRef.current) {
          isPlayingRef.current = false;
          setIsSpeaking(queueRef.current.length > 0);
          playNext();
        }
      };

      audio.onerror = () => {
        if (isMountedRef.current) {
          isPlayingRef.current = false;
          setIsSpeaking(queueRef.current.length > 0);
          playNext();
        }
      };

      await audio.play();
    } catch (error) {
      console.error('Audio play error:', error);
      isPlayingRef.current = false;
      setIsSpeaking(false);
      playNext();
    }
  }, [fetchAudio]);

  const speak = useCallback((text: string, onStart?: () => void) => {
    queueRef.current.push({ text, onStart });
    if (!isPlayingRef.current) {
      playNext();
    }
  }, [playNext]);

  const speakSequence = useCallback((texts: string[]) => {
    queueRef.current.push(...texts.map(text => ({ text })));
    if (!isPlayingRef.current) {
      playNext();
    }
  }, [playNext]);

  const stop = useCallback(() => {
    queueRef.current = [];
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
    }
    isPlayingRef.current = false;
    setIsSpeaking(false);
    setIsLoading(false);
  }, []);

  const preloadPhrases = useCallback(async (phrases: string[]) => {
    const promises = phrases.map(async (phrase) => {
      if (!audioCache.current.has(phrase)) {
        await fetchAudio(phrase);
      }
    });
    await Promise.all(promises);
  }, [fetchAudio]);

  return {
    speak,
    speakSequence,
    stop,
    isSpeaking,
    isLoading,
    preloadPhrases,
  };
}
