'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useLanguage } from './LanguageProvider';

interface StreakData {
  currentStreak: number;
  longestStreak: number;
  totalCheckIns: number;
  lastCheckInDate: string | null;
}

export function StreakCard() {
  const { getToken } = useAuth();
  const { language } = useLanguage();
  const [streak, setStreak] = useState<StreakData | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkingIn, setCheckingIn] = useState(false);
  const [checkedInToday, setCheckedInToday] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

  useEffect(() => {
    fetchStreak();
  }, []);

  const fetchStreak = async () => {
    try {
      const token = await getToken();
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/streaks`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch streak');
      const data = await res.json();
      setStreak(data);

      // Check if already checked in today
      if (data.lastCheckInDate) {
        const lastDate = new Date(data.lastCheckInDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        lastDate.setHours(0, 0, 0, 0);
        setCheckedInToday(lastDate.getTime() === today.getTime());
      }
    } catch (err) {
      console.error('Failed to fetch streak:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async () => {
    setCheckingIn(true);
    try {
      const token = await getToken();
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/streaks/check-in`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Check-in failed');
      const data = await res.json();
      setStreak(data);
      setCheckedInToday(true);

      // Show celebration animation
      setShowCelebration(true);
      setTimeout(() => setShowCelebration(false), 2000);
    } catch (err) {
      console.error('Check-in failed:', err);
    } finally {
      setCheckingIn(false);
    }
  };

  if (loading) {
    return (
      <div
        className="rounded-2xl p-5"
        style={{
          background: 'linear-gradient(135deg, var(--matcha-100) 0%, var(--cream-50) 100%)',
          border: '1px solid var(--matcha-200)',
        }}
      >
        <div className="animate-pulse space-y-3">
          <div className="h-5 bg-white/50 rounded w-1/3" />
          <div className="h-10 bg-white/50 rounded w-1/4" />
          <div className="h-4 bg-white/50 rounded w-2/3" />
        </div>
      </div>
    );
  }

  const t = {
    en: {
      title: 'Daily Streak',
      bestStreak: 'best streak',
      totalCheckIns: 'total check-ins',
      checkedIn: 'Checked in today',
      checkingIn: 'Checking in...',
      checkIn: 'Check In',
      keepGoing: 'Keep it going!',
    },
    fr: {
      title: 'Serie quotidienne',
      bestStreak: 'meilleure serie',
      totalCheckIns: 'check-ins totaux',
      checkedIn: 'Fait pour aujourd\'hui',
      checkingIn: 'En cours...',
      checkIn: 'Check In',
      keepGoing: 'Continuez!',
    },
  };

  const text = language === 'fr' ? t.fr : t.en;

  return (
    <div
      className="rounded-2xl p-5 relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, var(--matcha-100) 0%, var(--cream-50) 100%)',
        border: '1px solid var(--matcha-200)',
      }}
    >
      {/* Celebration overlay */}
      {showCelebration && (
        <div className="absolute inset-0 flex items-center justify-center bg-matcha-500/10 backdrop-blur-sm z-10">
          <div className="text-center animate-bounce">
            <div className="text-4xl mb-2">+1</div>
            <div className="text-sm font-medium" style={{ color: 'var(--matcha-700)' }}>
              {text.keepGoing}
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-4">
        <h3
          className="text-lg font-medium"
          style={{ color: 'var(--text-primary)' }}
        >
          {text.title}
        </h3>
        <div
          className="text-3xl font-bold"
          style={{ color: 'var(--matcha-600)' }}
        >
          {streak?.currentStreak || 0}
        </div>
      </div>

      <div className="flex gap-4 text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
        <div>
          <span className="font-medium" style={{ color: 'var(--matcha-700)' }}>
            {streak?.longestStreak || 0}
          </span>{' '}
          {text.bestStreak}
        </div>
        <div>
          <span className="font-medium" style={{ color: 'var(--matcha-700)' }}>
            {streak?.totalCheckIns || 0}
          </span>{' '}
          {text.totalCheckIns}
        </div>
      </div>

      <button
        onClick={handleCheckIn}
        disabled={checkedInToday || checkingIn}
        className="w-full py-2.5 rounded-xl font-medium transition-all"
        style={{
          background: checkedInToday ? 'var(--cream-200)' : 'var(--matcha-500)',
          color: checkedInToday ? 'var(--text-muted)' : 'white',
          cursor: checkedInToday ? 'default' : 'pointer',
        }}
      >
        {checkedInToday ? text.checkedIn : checkingIn ? text.checkingIn : text.checkIn}
      </button>
    </div>
  );
}
