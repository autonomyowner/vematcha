'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useLanguage } from './LanguageProvider';

interface ScoreComponents {
  consistency: number;
  awareness: number;
  progress: number;
  engagement: number;
}

interface FitnessScoreData {
  score: number;
  components: ScoreComponents;
}

export function FitnessScoreCard() {
  const { getToken } = useAuth();
  const { language } = useLanguage();
  const [scoreData, setScoreData] = useState<FitnessScoreData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchScore();
  }, []);

  const fetchScore = async () => {
    try {
      const token = await getToken();
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/fitness-score`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setScoreData(data);
      }
    } catch (err) {
      console.error('Failed to fetch fitness score:', err);
    } finally {
      setLoading(false);
    }
  };

  const t = {
    en: {
      title: 'Mental Fitness Score',
      consistency: 'Consistency',
      awareness: 'Awareness',
      progress: 'Progress',
      engagement: 'Engagement',
      calculating: 'Calculating...',
    },
    fr: {
      title: 'Score de Forme Mentale',
      consistency: 'Regularite',
      awareness: 'Conscience',
      progress: 'Progres',
      engagement: 'Engagement',
      calculating: 'Calcul...',
    },
  };

  const text = language === 'fr' ? t.fr : t.en;

  if (loading) {
    return (
      <div
        className="rounded-2xl p-5"
        style={{
          background: 'linear-gradient(135deg, var(--matcha-100) 0%, var(--cream-50) 100%)',
          border: '1px solid var(--matcha-200)',
        }}
      >
        <div className="text-center py-4">
          <div className="text-sm" style={{ color: 'var(--text-muted)' }}>
            {text.calculating}
          </div>
        </div>
      </div>
    );
  }

  if (!scoreData) {
    return null;
  }

  const getScoreColor = (score: number) => {
    if (score >= 75) return 'var(--matcha-600)';
    if (score >= 50) return 'var(--matcha-500)';
    if (score >= 25) return 'var(--terra-500)';
    return 'var(--terra-600)';
  };

  const components = [
    { key: 'consistency', label: text.consistency, value: scoreData.components.consistency },
    { key: 'awareness', label: text.awareness, value: scoreData.components.awareness },
    { key: 'progress', label: text.progress, value: scoreData.components.progress },
    { key: 'engagement', label: text.engagement, value: scoreData.components.engagement },
  ];

  return (
    <div
      className="rounded-2xl p-5"
      style={{
        background: 'linear-gradient(135deg, var(--matcha-50) 0%, var(--cream-100) 100%)',
        border: '1px solid var(--matcha-200)',
      }}
    >
      <h3
        className="text-lg font-medium mb-4"
        style={{ color: 'var(--text-primary)' }}
      >
        {text.title}
      </h3>

      {/* Score Circle */}
      <div className="flex items-center justify-center mb-4">
        <div
          className="relative w-24 h-24 rounded-full flex items-center justify-center"
          style={{
            background: `conic-gradient(${getScoreColor(scoreData.score)} ${scoreData.score * 3.6}deg, var(--cream-200) 0deg)`,
          }}
        >
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center"
            style={{ background: 'var(--cream-50)' }}
          >
            <span
              className="text-2xl font-bold"
              style={{ color: getScoreColor(scoreData.score) }}
            >
              {scoreData.score}
            </span>
          </div>
        </div>
      </div>

      {/* Component Breakdown */}
      <div className="space-y-2">
        {components.map((comp) => (
          <div key={comp.key} className="flex items-center justify-between text-sm">
            <span style={{ color: 'var(--text-secondary)' }}>{comp.label}</span>
            <div className="flex items-center gap-2">
              <div
                className="w-16 h-1.5 rounded-full overflow-hidden"
                style={{ background: 'var(--cream-200)' }}
              >
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${(comp.value / 25) * 100}%`,
                    background: 'var(--matcha-500)',
                  }}
                />
              </div>
              <span
                className="w-6 text-right font-medium"
                style={{ color: 'var(--matcha-600)' }}
              >
                {comp.value}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
