'use client';

import { useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useLanguage } from './LanguageProvider';

interface Exercise {
  id: string;
  biasType: string;
  title: string;
  description: string;
  steps: string[];
  estimatedMinutes: number;
  completed: boolean;
}

interface ExerciseCardProps {
  exercise: Exercise;
  onComplete?: () => void;
}

export function ExerciseCard({ exercise, onComplete }: ExerciseCardProps) {
  const { getToken } = useAuth();
  const { language } = useLanguage();
  const [expanded, setExpanded] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [completed, setCompleted] = useState(exercise.completed);

  const handleComplete = async () => {
    setCompleting(true);
    try {
      const token = await getToken();
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/exercises/${exercise.id}/complete`,
        {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!res.ok) throw new Error('Failed to complete exercise');
      setCompleted(true);
      onComplete?.();
    } catch (err) {
      console.error('Failed to complete exercise:', err);
    } finally {
      setCompleting(false);
    }
  };

  const t = {
    en: {
      mins: 'min',
      forBias: 'For:',
      markComplete: 'Mark as Complete',
      completing: 'Completing...',
      completed: 'Completed',
      showSteps: 'Show steps',
      hideSteps: 'Hide steps',
    },
    fr: {
      mins: 'min',
      forBias: 'Pour:',
      markComplete: 'Marquer comme termine',
      completing: 'En cours...',
      completed: 'Termine',
      showSteps: 'Voir les etapes',
      hideSteps: 'Masquer les etapes',
    },
  };

  const text = language === 'fr' ? t.fr : t.en;

  return (
    <div
      className={`rounded-2xl p-4 transition-all ${completed ? 'opacity-60' : ''}`}
      style={{
        background: completed
          ? 'var(--cream-100)'
          : 'linear-gradient(135deg, var(--cream-50) 0%, var(--matcha-50) 100%)',
        border: `1px solid ${completed ? 'var(--cream-200)' : 'var(--matcha-200)'}`,
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <h4
            className="font-medium text-sm mb-1"
            style={{ color: 'var(--text-primary)' }}
          >
            {exercise.title}
          </h4>
          <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
            <span>{exercise.estimatedMinutes} {text.mins}</span>
            <span>|</span>
            <span>{text.forBias} {exercise.biasType}</span>
          </div>
        </div>
        {completed && (
          <div
            className="px-2 py-0.5 rounded-full text-xs"
            style={{ background: 'var(--matcha-200)', color: 'var(--matcha-700)' }}
          >
            {text.completed}
          </div>
        )}
      </div>

      {/* Description */}
      <p
        className="text-sm mb-3"
        style={{ color: 'var(--text-secondary)', lineHeight: 1.5 }}
      >
        {exercise.description}
      </p>

      {/* Expandable Steps */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="text-xs font-medium mb-2"
        style={{ color: 'var(--matcha-600)' }}
      >
        {expanded ? text.hideSteps : text.showSteps}
      </button>

      {expanded && (
        <ol className="space-y-2 mb-3 pl-4">
          {exercise.steps.map((step, i) => (
            <li
              key={i}
              className="text-sm"
              style={{
                color: 'var(--text-secondary)',
                listStyleType: 'decimal',
              }}
            >
              {step}
            </li>
          ))}
        </ol>
      )}

      {/* Complete Button */}
      {!completed && (
        <button
          onClick={handleComplete}
          disabled={completing}
          className="w-full py-2 rounded-xl text-sm font-medium transition-all"
          style={{
            background: 'var(--matcha-500)',
            color: 'white',
          }}
        >
          {completing ? text.completing : text.markComplete}
        </button>
      )}
    </div>
  );
}

// Component to display list of exercises with generate button
interface ExerciseListProps {
  exercises: Exercise[];
  onExerciseComplete?: () => void;
  onGenerateNew?: () => void;
  generating?: boolean;
}

export function ExerciseList({
  exercises,
  onExerciseComplete,
  onGenerateNew,
  generating,
}: ExerciseListProps) {
  const { language } = useLanguage();

  const t = {
    en: {
      title: 'Your Exercises',
      empty: 'No exercises yet. Generate one based on your recent patterns!',
      generate: 'Generate Exercise',
      generating: 'Generating...',
    },
    fr: {
      title: 'Vos Exercices',
      empty: 'Pas encore d\'exercices. Generez-en un base sur vos patterns recents!',
      generate: 'Generer un exercice',
      generating: 'Generation...',
    },
  };

  const text = language === 'fr' ? t.fr : t.en;

  return (
    <div
      className="rounded-3xl p-6"
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-soft)',
        boxShadow: 'var(--shadow-md)',
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <h3
          className="text-lg"
          style={{
            fontFamily: 'var(--font-dm-serif), Georgia, serif',
            color: 'var(--text-primary)',
          }}
        >
          {text.title}
        </h3>
        {onGenerateNew && (
          <button
            onClick={onGenerateNew}
            disabled={generating}
            className="px-3 py-1.5 rounded-lg text-sm font-medium"
            style={{
              background: 'var(--matcha-100)',
              color: 'var(--matcha-700)',
            }}
          >
            {generating ? text.generating : text.generate}
          </button>
        )}
      </div>

      {exercises.length === 0 ? (
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          {text.empty}
        </p>
      ) : (
        <div className="space-y-3">
          {exercises.map((exercise) => (
            <ExerciseCard
              key={exercise.id}
              exercise={exercise}
              onComplete={onExerciseComplete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
