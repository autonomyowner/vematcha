'use client';

import { useEffect, useRef, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useUser, useAuth } from '@clerk/nextjs';
import { useLanguage } from '../../components/LanguageProvider';
import { Button } from '../../components/ui/Button';
import { useDashboard } from '../../hooks/useApi';
import { trackSignup, trackPurchase } from '../../lib/analytics';
import { StreakCard } from '../../components/StreakCard';
import { ExerciseList } from '../../components/ExerciseCard';
import { ExportSection } from '../../components/ExportButton';
import { FitnessScoreCard } from '../../components/FitnessScore';
import { ProgramList } from '../../components/ProgramCard';

interface Exercise {
  id: string;
  biasType: string;
  title: string;
  description: string;
  steps: string[];
  estimatedMinutes: number;
  completed: boolean;
}

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoaded: userLoaded } = useUser();
  const { isSignedIn, isLoaded: authLoaded, getToken } = useAuth();
  const { t, language } = useLanguage();
  const { data: dashboardData, isLoading: dashboardLoading, error: dashboardError } = useDashboard();
  const hasTrackedRef = useRef(false);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [generatingExercise, setGeneratingExercise] = useState(false);

  const isLoading = !userLoaded || !authLoaded || dashboardLoading;

  // Fetch exercises
  useEffect(() => {
    if (!isSignedIn) return;
    fetchExercises();
  }, [isSignedIn]);

  const fetchExercises = async () => {
    try {
      const token = await getToken();
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/exercises`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setExercises(data);
      }
    } catch (err) {
      console.error('Failed to fetch exercises:', err);
    }
  };

  const handleGenerateExercise = async () => {
    setGeneratingExercise(true);
    try {
      const token = await getToken();
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/exercises/generate-from-recent`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        await fetchExercises();
      }
    } catch (err) {
      console.error('Failed to generate exercise:', err);
    } finally {
      setGeneratingExercise(false);
    }
  };

  // Track signup for new users (created within last 60 seconds)
  useEffect(() => {
    if (hasTrackedRef.current || !user || !userLoaded) return;

    const createdAt = user.createdAt ? new Date(user.createdAt).getTime() : 0;
    const now = Date.now();
    const isNewUser = now - createdAt < 60000; // Within last 60 seconds

    // Check localStorage to avoid duplicate tracking
    const signupTrackedKey = `matcha_signup_tracked_${user.id}`;
    const alreadyTracked = localStorage.getItem(signupTrackedKey);

    if (isNewUser && !alreadyTracked) {
      trackSignup('email');
      localStorage.setItem(signupTrackedKey, 'true');
      hasTrackedRef.current = true;
    }
  }, [user, userLoaded]);

  // Track successful Pro upgrade
  useEffect(() => {
    const upgraded = searchParams.get('upgraded');
    if (upgraded === 'true' && !hasTrackedRef.current) {
      // Monthly: $15, Yearly: $144 (could be refined with actual billing info)
      trackPurchase('monthly', 15);
      hasTrackedRef.current = true;
      // Clean up URL
      router.replace('/dashboard');
    }
  }, [searchParams, router]);

  // Fallback data when API is not available or still loading
  // Uses validated CBT biases from cognitive-bias-framework.ts
  const fallbackBiases = [
    { name: t.dashboard.catastrophizing, intensity: 75, description: t.dashboard.catastrophizingDesc },
    { name: t.dashboard.procrastination, intensity: 68, description: t.dashboard.procrastinationDesc },
    { name: t.dashboard.allOrNothingThinking, intensity: 55, description: t.dashboard.allOrNothingThinkingDesc },
    { name: t.dashboard.shouldStatements, intensity: 45, description: t.dashboard.shouldStatementsDesc },
  ];

  const fallbackPatterns = [
    { name: t.dashboard.analytical, value: 72, color: 'var(--matcha-500)' },
    { name: t.dashboard.creative, value: 58, color: 'var(--terra-400)' },
    { name: t.dashboard.pragmatic, value: 85, color: 'var(--matcha-600)' },
    { name: t.dashboard.emotional, value: 40, color: 'var(--terra-500)' },
  ];

  const fallbackInsights = [
    t.dashboard.insight1,
    t.dashboard.insight2,
    t.dashboard.insight3,
  ];

  // Use API data if available, otherwise fallback
  const biases = dashboardData?.stats.topBiases.length
    ? dashboardData.stats.topBiases.map(b => ({
        name: b.name,
        intensity: Math.round(b.avgIntensity),
        description: `Detected ${b.count} times`,
      }))
    : fallbackBiases;

  const patterns = dashboardData?.stats.patterns.length
    ? dashboardData.stats.patterns.map((p, i) => ({
        name: p.name,
        value: Math.round(p.avgPercentage),
        color: ['var(--matcha-500)', 'var(--terra-400)', 'var(--matcha-600)', 'var(--terra-500)'][i % 4],
      }))
    : fallbackPatterns;

  const insights = dashboardData?.recentInsights.length
    ? dashboardData.recentInsights.slice(0, 3)
    : fallbackInsights;

  useEffect(() => {
    if (authLoaded && !isSignedIn) {
      router.replace('/login');
    }
  }, [isSignedIn, authLoaded, router]);

  if (isLoading || !isSignedIn) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: 'var(--cream-50)' }}
      >
        <p style={{ color: 'var(--text-secondary)' }}>Loading...</p>
      </div>
    );
  }

  const isPro = dashboardData?.profile.tier === 'PRO';
  const firstName = dashboardData?.profile.firstName || user?.firstName || 'User';
  const analysesRemaining = dashboardData?.usage.analysesRemaining;
  const chatMessagesRemaining = dashboardData?.usage.chatMessagesRemaining;
  const totalAnalyses = dashboardData?.usage.totalAnalyses || 0;
  const totalConversations = dashboardData?.usage.totalConversationsWithAnalysis || 0;
  const profileCompletion = dashboardData?.profile.completionPercentage || 0;

  // Emotional trends from chat
  const emotionalTrends = dashboardData?.stats.emotionalTrends || [];

  // Format member since date
  const memberSince = dashboardData?.profile.memberSince
    ? new Date(dashboardData.profile.memberSince).toLocaleDateString(language === 'en' ? 'en-US' : 'fr-FR', { month: 'short', year: 'numeric' })
    : 'N/A';

  // Format last analysis date
  const lastAnalysisDate = dashboardData?.usage.lastAnalysisDate;
  const lastChatDate = dashboardData?.usage.lastChatAnalysisDate;
  let lastAnalysis = language === 'en' ? 'No analyses yet' : 'Aucune analyse';

  // Use the most recent between analysis and chat
  const latestDate = lastAnalysisDate && lastChatDate
    ? new Date(lastAnalysisDate) > new Date(lastChatDate) ? lastAnalysisDate : lastChatDate
    : lastAnalysisDate || lastChatDate;

  if (latestDate) {
    const daysAgo = Math.floor((Date.now() - new Date(latestDate).getTime()) / (1000 * 60 * 60 * 24));
    lastAnalysis = language === 'en'
      ? `${daysAgo} ${t.dashboard.daysAgo} ago`
      : `Il y a ${daysAgo} ${t.dashboard.daysAgo}`;
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--cream-50)' }}>
      {/* Decorative Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute top-0 right-0 w-[400px] h-[400px] opacity-15"
          style={{
            background: 'radial-gradient(circle, var(--matcha-200) 0%, transparent 70%)',
            borderRadius: '50%',
            transform: 'translate(20%, -30%)',
          }}
        />
      </div>

      <div className="relative max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1
              className="text-3xl mb-2"
              style={{
                fontFamily: 'var(--font-dm-serif), Georgia, serif',
                color: 'var(--text-primary)',
              }}
            >
              {t.dashboard.hello}, {firstName}
            </h1>
            <p style={{ color: 'var(--text-secondary)' }}>
              {t.dashboard.subtitle}
            </p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            {!isPro && analysesRemaining !== null && (
              <div
                className="px-3 py-1.5 rounded-full text-sm"
                style={{
                  background: 'var(--cream-200)',
                  color: 'var(--text-secondary)',
                }}
              >
                {analysesRemaining} {analysesRemaining !== 1 ? t.dashboard.analysesRemainingPlural : t.dashboard.analysesRemaining}
              </div>
            )}
            {!isPro && chatMessagesRemaining !== null && (
              <div
                className="px-3 py-1.5 rounded-full text-sm"
                style={{
                  background: 'var(--matcha-100)',
                  color: 'var(--matcha-700)',
                }}
              >
                {chatMessagesRemaining} {language === 'en' ? 'chat msgs' : 'msgs chat'}
              </div>
            )}
            <span className={`matcha-badge ${isPro ? 'matcha-badge-pro' : 'matcha-badge-free'}`}>
              {isPro ? 'Pro' : (language === 'en' ? 'Free' : 'Gratuit')}
            </span>
          </div>
        </div>

        {/* API Error Banner */}
        {dashboardError && (
          <div
            className="mb-6 p-4 rounded-xl text-sm"
            style={{
              background: 'rgba(239, 176, 68, 0.1)',
              color: 'var(--terra-600)',
              border: '1px solid rgba(239, 176, 68, 0.3)',
            }}
          >
            Unable to load real-time data. Showing sample data.
          </div>
        )}

        {/* Main Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Profile Summary */}
          <div
            className="lg:col-span-1 rounded-3xl p-6"
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-soft)',
              boxShadow: 'var(--shadow-md)',
            }}
          >
            <h2
              className="text-xl mb-4"
              style={{
                fontFamily: 'var(--font-dm-serif), Georgia, serif',
                color: 'var(--text-primary)',
              }}
            >
              {t.dashboard.yourProfile}
            </h2>

            {/* Profile Completion */}
            <div className="mb-6">
              <div className="flex justify-between text-sm mb-2">
                <span style={{ color: 'var(--text-secondary)' }}>{t.dashboard.profileCompletion}</span>
                <span style={{ color: 'var(--matcha-600)' }}>{profileCompletion}%</span>
              </div>
              <div className="matcha-progress">
                <div className="matcha-progress-bar" style={{ width: `${profileCompletion}%` }} />
              </div>
            </div>

            {/* Stats */}
            <div className="space-y-4">
              <div className="flex justify-between">
                <span style={{ color: 'var(--text-secondary)' }}>{t.dashboard.analysesCompleted}</span>
                <span style={{ color: 'var(--text-primary)' }} className="font-medium">{totalAnalyses}</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: 'var(--text-secondary)' }}>{language === 'en' ? 'Chat Insights' : 'Analyses chat'}</span>
                <span style={{ color: 'var(--text-primary)' }} className="font-medium">{totalConversations}</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: 'var(--text-secondary)' }}>{t.dashboard.memberSince}</span>
                <span style={{ color: 'var(--text-primary)' }} className="font-medium">{memberSince}</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: 'var(--text-secondary)' }}>{t.dashboard.lastAnalysis}</span>
                <span style={{ color: 'var(--text-primary)' }} className="font-medium">{lastAnalysis}</span>
              </div>
            </div>

            {/* CTA */}
            <div className="mt-6 pt-6 border-t" style={{ borderColor: 'var(--border-soft)' }}>
              <Button fullWidth onClick={() => router.push('/chat')}>
                {t.dashboard.startNewAnalysis}
              </Button>
            </div>

            {/* Daily Streak */}
            <div className="mt-6">
              <StreakCard />
            </div>

            {/* Mental Fitness Score (Pro only) */}
            {isPro && (
              <div className="mt-4">
                <FitnessScoreCard />
              </div>
            )}

            {/* Export Data */}
            <div className="mt-4">
              <ExportSection />
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Cognitive Biases */}
            <div
              className="rounded-3xl p-6"
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-soft)',
                boxShadow: 'var(--shadow-md)',
              }}
            >
              <h2
                className="text-xl mb-6"
                style={{
                  fontFamily: 'var(--font-dm-serif), Georgia, serif',
                  color: 'var(--text-primary)',
                }}
              >
                {t.dashboard.cognitiveBiases}
              </h2>

              <div className="space-y-5">
                {biases.map((bias, i) => (
                  <div key={i}>
                    <div className="flex justify-between text-sm mb-2">
                      <span style={{ color: 'var(--text-primary)' }} className="font-medium">
                        {bias.name}
                      </span>
                      <span style={{ color: 'var(--matcha-600)' }}>{bias.intensity}%</span>
                    </div>
                    <div className="matcha-progress mb-2">
                      <div
                        className="matcha-progress-bar"
                        style={{ width: `${bias.intensity}%` }}
                      />
                    </div>
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                      {bias.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Thinking Patterns */}
            <div
              className="rounded-3xl p-6"
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-soft)',
                boxShadow: 'var(--shadow-md)',
              }}
            >
              <h2
                className="text-xl mb-6"
                style={{
                  fontFamily: 'var(--font-dm-serif), Georgia, serif',
                  color: 'var(--text-primary)',
                }}
              >
                {t.dashboard.thinkingPatterns}
              </h2>

              <div className="grid grid-cols-2 gap-4">
                {patterns.map((pattern, i) => (
                  <div
                    key={i}
                    className="p-4 rounded-2xl"
                    style={{ background: 'var(--cream-100)' }}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span
                        className="font-medium"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        {pattern.name}
                      </span>
                      <span
                        className="text-2xl font-bold"
                        style={{ color: pattern.color }}
                      >
                        {pattern.value}%
                      </span>
                    </div>
                    <div className="matcha-progress">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${pattern.value}%`,
                          background: pattern.color,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Exercises */}
            <ExerciseList
              exercises={exercises}
              onExerciseComplete={fetchExercises}
              onGenerateNew={handleGenerateExercise}
              generating={generatingExercise}
            />

            {/* CBT Programs */}
            <ProgramList />
          </div>
        </div>

        {/* Insights Section */}
        <div
          className="mt-6 rounded-3xl p-6"
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-soft)',
            boxShadow: 'var(--shadow-md)',
          }}
        >
          <h2
            className="text-xl mb-6"
            style={{
              fontFamily: 'var(--font-dm-serif), Georgia, serif',
              color: 'var(--text-primary)',
            }}
          >
            {t.dashboard.personalizedInsights}
          </h2>

          <div className="grid md:grid-cols-3 gap-4">
            {insights.map((insight, i) => (
              <div
                key={i}
                className="p-4 rounded-2xl"
                style={{
                  background: 'linear-gradient(135deg, var(--matcha-50) 0%, var(--cream-100) 100%)',
                  borderLeft: '3px solid var(--matcha-500)',
                }}
              >
                <p className="text-sm" style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  {insight}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Emotional Trends from Chat */}
        {emotionalTrends.length > 0 && (
          <div
            className="mt-6 rounded-3xl p-6"
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-soft)',
              boxShadow: 'var(--shadow-md)',
            }}
          >
            <h2
              className="text-xl mb-6"
              style={{
                fontFamily: 'var(--font-dm-serif), Georgia, serif',
                color: 'var(--text-primary)',
              }}
            >
              {language === 'en' ? 'Emotional Trends' : 'Tendances Emotionnelles'}
            </h2>

            <div className="grid md:grid-cols-5 gap-4">
              {emotionalTrends.map((trend: { emotion: string; count: number; avgIntensity: number }, i: number) => (
                <div
                  key={i}
                  className="p-4 rounded-2xl text-center"
                  style={{
                    background: `linear-gradient(135deg, var(--matcha-${50 + i * 50}) 0%, var(--cream-100) 100%)`,
                  }}
                >
                  <div
                    className="text-lg font-medium capitalize mb-1"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {trend.emotion}
                  </div>
                  <div
                    className="text-sm"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    {trend.count}x {language === 'en' ? 'detected' : 'detecte'}
                  </div>
                  <div className="mt-2 matcha-progress h-1">
                    <div
                      className="matcha-progress-bar"
                      style={{ width: `${trend.avgIntensity}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Progress Over Time (Pro only) */}
        <div
          className="mt-6 rounded-3xl p-6 relative overflow-hidden"
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-soft)',
            boxShadow: 'var(--shadow-md)',
          }}
        >
          <div className="flex items-center justify-between mb-6">
            <h2
              className="text-xl"
              style={{
                fontFamily: 'var(--font-dm-serif), Georgia, serif',
                color: 'var(--text-primary)',
              }}
            >
              {t.dashboard.progressTitle}
            </h2>
            {!isPro && (
              <span className="matcha-badge matcha-badge-pro">Pro</span>
            )}
          </div>

          {/* Chart mockup */}
          <div className={`relative ${!isPro ? 'locked-blur' : ''}`}>
            <div className="h-48 flex items-end justify-between gap-2 px-4">
              {[45, 52, 48, 55, 60, 58, 65, 62, 68, 72, 70, 75].map((value, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-t-lg"
                  style={{
                    height: `${value}%`,
                    background: `linear-gradient(180deg, var(--matcha-400) 0%, var(--matcha-600) 100%)`,
                    opacity: 0.8 + (i * 0.015),
                  }}
                />
              ))}
            </div>
            <div className="flex justify-between mt-2 text-xs" style={{ color: 'var(--text-muted)' }}>
              <span>Oct 27</span>
              <span>Nov 26</span>
            </div>
          </div>

          {/* Upgrade overlay */}
          {!isPro && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/60 backdrop-blur-sm rounded-3xl">
              <div className="text-center p-6">
                <h3
                  className="text-lg mb-2"
                  style={{
                    fontFamily: 'var(--font-dm-serif), Georgia, serif',
                    color: 'var(--text-primary)',
                  }}
                >
                  {t.dashboard.unlockProgress}
                </h3>
                <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
                  {t.dashboard.upgradeDesc}
                </p>
                <Link href="/pricing">
                  <Button>{t.dashboard.upgradeToPro}</Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--cream-50)' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Loading...</p>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}
