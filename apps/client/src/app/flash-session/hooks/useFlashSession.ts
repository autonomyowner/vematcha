'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useTTS } from './useTTS';

export type FlashSessionState =
  | 'INTRO'
  | 'SET_ACTIVE'
  | 'SET_PAUSE'
  | 'CLOSING'
  | 'SUMMARY';

export interface FlashSessionData {
  topic: string;
  positiveMemory: string;
  distressStart: number;
  distressEnd: number | null;
  currentSet: number;
  totalSets: number;
  startTime: Date | null;
  endTime: Date | null;
}

interface UseFlashSessionReturn {
  state: FlashSessionState;
  data: FlashSessionData;
  bilateralSide: 'left' | 'right';
  setElapsed: number;
  setDuration: number;
  isSpeaking: boolean;
  isMuted: boolean;
  blinkActive: boolean;
  blinkCount: number;
  isPreloading: boolean;

  setTopic: (topic: string) => void;
  setPositiveMemory: (memory: string) => void;
  setDistressStart: (level: number) => void;
  setDistressEnd: (level: number) => void;
  startSession: () => void;
  pauseSet: () => void;
  continueSet: () => void;
  endEarly: () => void;
  completeSession: () => void;
  toggleMute: () => void;
}

// Clinical Flash Technique Protocol
const FLASH_CONFIG = {
  FLASHES_PER_SET: 5,
  SECONDS_BETWEEN_FLASHES: 8.5,
  BILATERAL_INTERVAL_MS: 1500,
  SET_DURATION_MS: 42500,
};

const VOICE_SCRIPTS = {
  setOpening: "Begin slow tapping... left... right... left... right...",
  pefFocus: "Stay fully connected to your peaceful place...",
  flash: "Flash",
  betweenFlashes: [
    "Stay with your positive place...",
    "Notice what you see there...",
    "Feel the calm...",
    "Let those good feelings grow...",
  ],
  setComplete: ["Stop tapping...", "Take a deep breath..."],
  pauseCheck: ["Take a moment to notice how you feel.", "Does the memory seem different in any way?"],
  closing: ["Bring to mind what was bothering you earlier...", "How does it feel now, on a scale of zero to ten?"],
  complete: [
    "Wonderful. Your mind did important work today.",
    "Notice your feet on the ground...",
    "Look around and name three things you can see...",
    "You can return anytime you need this space.",
  ],
};

export function useFlashSession(): UseFlashSessionReturn {
  const [state, setState] = useState<FlashSessionState>('INTRO');
  const [data, setData] = useState<FlashSessionData>({
    topic: '',
    positiveMemory: '',
    distressStart: 5,
    distressEnd: null,
    currentSet: 0,
    totalSets: 4,
    startTime: null,
    endTime: null,
  });

  const [bilateralSide, setBilateralSide] = useState<'left' | 'right'>('left');
  const [setElapsed, setSetElapsed] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [blinkActive, setBlinkActive] = useState(false);
  const [blinkCount, setBlinkCount] = useState(0);
  const [isPreloading, setIsPreloading] = useState(false);

  // Refs for cleanup
  const bilateralIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const isMutedRef = useRef(isMuted);
  const stateRef = useRef(state);
  const dataRef = useRef(data);

  // Keep refs in sync
  useEffect(() => { isMutedRef.current = isMuted; }, [isMuted]);
  useEffect(() => { stateRef.current = state; }, [state]);
  useEffect(() => { dataRef.current = data; }, [data]);

  const tts = useTTS();
  const ttsRef = useRef(tts);
  useEffect(() => { ttsRef.current = tts; }, [tts]);

  // Helper to add timeout with tracking
  const addTimeout = useCallback((fn: () => void, ms: number) => {
    const id = setTimeout(fn, ms);
    timeoutsRef.current.push(id);
    return id;
  }, []);

  // Clear all timeouts
  const clearAllTimeouts = useCallback(() => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
  }, []);

  // Speak helper using ref
  const speak = useCallback((text: string, onStart?: () => void) => {
    if (!isMutedRef.current) {
      ttsRef.current.speak(text, onStart);
    }
  }, []);

  const speakSeq = useCallback((texts: string[]) => {
    if (!isMutedRef.current) {
      ttsRef.current.speakSequence(texts);
    }
  }, []);

  // Preload audio once on mount
  useEffect(() => {
    const allPhrases = [
      VOICE_SCRIPTS.setOpening,
      VOICE_SCRIPTS.pefFocus,
      VOICE_SCRIPTS.flash,
      ...VOICE_SCRIPTS.betweenFlashes,
      ...VOICE_SCRIPTS.setComplete,
      ...VOICE_SCRIPTS.pauseCheck,
      ...VOICE_SCRIPTS.closing,
      ...VOICE_SCRIPTS.complete,
    ];

    setIsPreloading(true);
    tts.preloadPhrases(allPhrases)
      .finally(() => setIsPreloading(false));
  }, []); // Only run once

  // Bilateral stimulation
  useEffect(() => {
    if (state === 'SET_ACTIVE') {
      bilateralIntervalRef.current = setInterval(() => {
        setBilateralSide(prev => prev === 'left' ? 'right' : 'left');
      }, FLASH_CONFIG.BILATERAL_INTERVAL_MS);
    }

    return () => {
      if (bilateralIntervalRef.current) {
        clearInterval(bilateralIntervalRef.current);
        bilateralIntervalRef.current = null;
      }
    };
  }, [state]);

  // Main set logic - runs when entering SET_ACTIVE
  useEffect(() => {
    if (state !== 'SET_ACTIVE') return;

    const startTime = Date.now();

    // Progress timer
    timerIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      setSetElapsed(Math.min(elapsed, FLASH_CONFIG.SET_DURATION_MS));
    }, 100);

    // Opening voice
    speak(VOICE_SCRIPTS.setOpening);

    // PEF focus at 2s
    addTimeout(() => speak(VOICE_SCRIPTS.pefFocus), 2000);

    // Schedule all 5 flashes
    const scheduleFlash = (flashNum: number, delay: number) => {
      addTimeout(() => {
        // Audio with visual sync on start
        speak(VOICE_SCRIPTS.flash, () => {
          // Visual flash synchronized with audio start
          setBlinkActive(true);
          setBlinkCount(flashNum + 1);

          // End visual after 400ms
          setTimeout(() => setBlinkActive(false), 400);
        });

        // Reminder 2s after (not on last flash)
        if (flashNum < FLASH_CONFIG.FLASHES_PER_SET - 1) {
          addTimeout(() => {
            const idx = flashNum % VOICE_SCRIPTS.betweenFlashes.length;
            speak(VOICE_SCRIPTS.betweenFlashes[idx]);
          }, 2000);
        }
      }, delay);
    };

    // First flash at 4s, then every 8.5s
    for (let i = 0; i < FLASH_CONFIG.FLASHES_PER_SET; i++) {
      const delay = 4000 + (i * FLASH_CONFIG.SECONDS_BETWEEN_FLASHES * 1000);
      scheduleFlash(i, delay);
    }

    // Set completion
    addTimeout(() => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }

      speakSeq(VOICE_SCRIPTS.setComplete);

      // Move to next state after 3s
      addTimeout(() => {
        const currentData = dataRef.current;
        if (currentData.currentSet >= currentData.totalSets) {
          setState('CLOSING');
          speakSeq(VOICE_SCRIPTS.closing);
        } else {
          setState('SET_PAUSE');
          speakSeq(VOICE_SCRIPTS.pauseCheck);
        }
      }, 3000);
    }, FLASH_CONFIG.SET_DURATION_MS);

    return () => {
      clearAllTimeouts();
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      setBlinkActive(false);
      setBlinkCount(0);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]); // Only depend on state - callbacks use refs

  // Actions
  const setTopic = useCallback((topic: string) => {
    setData(prev => ({ ...prev, topic }));
  }, []);

  const setPositiveMemory = useCallback((memory: string) => {
    setData(prev => ({ ...prev, positiveMemory: memory }));
  }, []);

  const setDistressStart = useCallback((level: number) => {
    setData(prev => ({ ...prev, distressStart: level }));
  }, []);

  const setDistressEnd = useCallback((level: number) => {
    setData(prev => ({ ...prev, distressEnd: level }));
  }, []);

  const startSession = useCallback(() => {
    tts.stop();
    setData(prev => ({
      ...prev,
      currentSet: 1,
      startTime: new Date(),
    }));
    setSetElapsed(0);
    setState('SET_ACTIVE');
  }, [tts]);

  const pauseSet = useCallback(() => {
    clearAllTimeouts();
    tts.stop();
    setState('SET_PAUSE');
  }, [clearAllTimeouts, tts]);

  const continueSet = useCallback(() => {
    tts.stop();
    setData(prev => ({ ...prev, currentSet: prev.currentSet + 1 }));
    setSetElapsed(0);
    // Small delay to ensure state updates before effect runs
    setTimeout(() => setState('SET_ACTIVE'), 50);
  }, [tts]);

  const endEarly = useCallback(() => {
    clearAllTimeouts();
    tts.stop();
    setState('CLOSING');
    setTimeout(() => speakSeq(VOICE_SCRIPTS.closing), 100);
  }, [clearAllTimeouts, tts, speakSeq]);

  const completeSession = useCallback(() => {
    tts.stop();
    setData(prev => ({ ...prev, endTime: new Date() }));
    setState('SUMMARY');
    setTimeout(() => speakSeq(VOICE_SCRIPTS.complete), 100);
  }, [tts, speakSeq]);

  const toggleMute = useCallback(() => {
    setIsMuted(prev => {
      if (!prev) tts.stop();
      return !prev;
    });
  }, [tts]);

  return {
    state,
    data,
    bilateralSide,
    setElapsed,
    setDuration: FLASH_CONFIG.SET_DURATION_MS,
    isSpeaking: tts.isSpeaking,
    isMuted,
    blinkActive,
    blinkCount,
    isPreloading,
    setTopic,
    setPositiveMemory,
    setDistressStart,
    setDistressEnd,
    startSession,
    pauseSet,
    continueSet,
    endEarly,
    completeSession,
    toggleMute,
  };
}
