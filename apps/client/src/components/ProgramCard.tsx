'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useLanguage } from './LanguageProvider';

interface Program {
  id: string;
  slug: string;
  name: string;
  description: string;
  durationDays: number;
}

interface Enrollment {
  id: string;
  programId: string;
  currentDay: number;
  completedDays: number[];
  completedAt: string | null;
  program: Program;
}

interface ProgramModule {
  day: number;
  title: string;
  content: string;
  exercise: {
    title: string;
    steps: string[];
  };
}

export function ProgramList() {
  const { getToken } = useAuth();
  const { language } = useLanguage();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = await getToken();
      const [programsRes, enrollmentsRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/programs`),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/programs/enrollments/me`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (programsRes.ok) {
        setPrograms(await programsRes.json());
      }
      if (enrollmentsRes.ok) {
        setEnrollments(await enrollmentsRes.json());
      }
    } catch (err) {
      console.error('Failed to fetch programs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async (slug: string) => {
    setEnrolling(slug);
    try {
      const token = await getToken();
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/programs/${slug}/enroll`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        await fetchData();
      }
    } catch (err) {
      console.error('Failed to enroll:', err);
    } finally {
      setEnrolling(null);
    }
  };

  const t = {
    en: {
      title: 'CBT Programs',
      days: 'days',
      enroll: 'Start Program',
      enrolling: 'Enrolling...',
      enrolled: 'Enrolled',
      day: 'Day',
      completed: 'Completed',
      progress: 'progress',
      noPrograms: 'No programs available',
    },
    fr: {
      title: 'Programmes CBT',
      days: 'jours',
      enroll: 'Commencer',
      enrolling: 'Inscription...',
      enrolled: 'Inscrit',
      day: 'Jour',
      completed: 'Termine',
      progress: 'progression',
      noPrograms: 'Aucun programme disponible',
    },
  };

  const text = language === 'fr' ? t.fr : t.en;

  if (loading) {
    return (
      <div
        className="rounded-3xl p-6"
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-soft)',
        }}
      >
        <div className="animate-pulse space-y-3">
          <div className="h-6 bg-cream-200 rounded w-1/3" />
          <div className="h-20 bg-cream-100 rounded" />
        </div>
      </div>
    );
  }

  const enrolledProgramIds = enrollments.map(e => e.programId);

  return (
    <div
      className="rounded-3xl p-6"
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-soft)',
        boxShadow: 'var(--shadow-md)',
      }}
    >
      <h3
        className="text-lg mb-4"
        style={{
          fontFamily: 'var(--font-dm-serif), Georgia, serif',
          color: 'var(--text-primary)',
        }}
      >
        {text.title}
      </h3>

      {/* Active Enrollments */}
      {enrollments.length > 0 && (
        <div className="space-y-3 mb-4">
          {enrollments.map((enrollment) => (
            <EnrollmentCard
              key={enrollment.id}
              enrollment={enrollment}
              onUpdate={fetchData}
            />
          ))}
        </div>
      )}

      {/* Available Programs */}
      <div className="space-y-3">
        {programs
          .filter(p => !enrolledProgramIds.includes(p.id))
          .map((program) => (
            <div
              key={program.id}
              className="p-4 rounded-xl"
              style={{
                background: 'var(--cream-50)',
                border: '1px solid var(--cream-200)',
              }}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4
                    className="font-medium mb-1"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {program.name}
                  </h4>
                  <p
                    className="text-sm mb-2"
                    style={{ color: 'var(--text-secondary)', lineHeight: 1.5 }}
                  >
                    {program.description.length > 100
                      ? program.description.substring(0, 100) + '...'
                      : program.description}
                  </p>
                  <div
                    className="text-xs"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    {program.durationDays} {text.days}
                  </div>
                </div>
                <button
                  onClick={() => handleEnroll(program.slug)}
                  disabled={enrolling === program.slug}
                  className="px-3 py-1.5 rounded-lg text-sm font-medium ml-3"
                  style={{
                    background: 'var(--matcha-500)',
                    color: 'white',
                  }}
                >
                  {enrolling === program.slug ? text.enrolling : text.enroll}
                </button>
              </div>
            </div>
          ))}

        {programs.length === 0 && enrollments.length === 0 && (
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            {text.noPrograms}
          </p>
        )}
      </div>
    </div>
  );
}

function EnrollmentCard({
  enrollment,
  onUpdate,
}: {
  enrollment: Enrollment;
  onUpdate: () => void;
}) {
  const { getToken } = useAuth();
  const { language } = useLanguage();
  const [completing, setCompleting] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [moduleData, setModuleData] = useState<ProgramModule | null>(null);

  const completedDays = enrollment.completedDays || [];
  const progress = Math.round((completedDays.length / enrollment.program.durationDays) * 100);
  const isComplete = enrollment.completedAt !== null;

  const t = {
    en: {
      day: 'Day',
      of: 'of',
      completed: 'Completed!',
      completeDay: 'Complete Day',
      completing: 'Completing...',
      showToday: 'Show today\'s content',
      hideContent: 'Hide content',
    },
    fr: {
      day: 'Jour',
      of: 'sur',
      completed: 'Termine!',
      completeDay: 'Terminer le jour',
      completing: 'En cours...',
      showToday: 'Voir le contenu du jour',
      hideContent: 'Masquer le contenu',
    },
  };

  const text = language === 'fr' ? t.fr : t.en;

  const handleCompleteDay = async () => {
    setCompleting(true);
    try {
      const token = await getToken();
      await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/programs/enrollments/${enrollment.programId}/complete-day`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      onUpdate();
    } catch (err) {
      console.error('Failed to complete day:', err);
    } finally {
      setCompleting(false);
    }
  };

  const fetchModuleData = async () => {
    try {
      const token = await getToken();
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/programs/enrollments/${enrollment.programId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.ok) {
        const data = await res.json();
        setModuleData(data.currentModule);
      }
    } catch (err) {
      console.error('Failed to fetch module:', err);
    }
  };

  useEffect(() => {
    if (expanded && !moduleData) {
      fetchModuleData();
    }
  }, [expanded]);

  return (
    <div
      className="p-4 rounded-xl"
      style={{
        background: 'linear-gradient(135deg, var(--matcha-50) 0%, var(--cream-100) 100%)',
        border: '1px solid var(--matcha-200)',
      }}
    >
      <div className="flex items-center justify-between mb-2">
        <h4
          className="font-medium"
          style={{ color: 'var(--text-primary)' }}
        >
          {enrollment.program.name}
        </h4>
        {isComplete ? (
          <span
            className="px-2 py-0.5 rounded-full text-xs"
            style={{ background: 'var(--matcha-200)', color: 'var(--matcha-700)' }}
          >
            {text.completed}
          </span>
        ) : (
          <span
            className="text-sm"
            style={{ color: 'var(--matcha-600)' }}
          >
            {text.day} {enrollment.currentDay} {text.of} {enrollment.program.durationDays}
          </span>
        )}
      </div>

      {/* Progress bar */}
      <div
        className="h-2 rounded-full mb-3 overflow-hidden"
        style={{ background: 'var(--cream-200)' }}
      >
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${progress}%`,
            background: 'var(--matcha-500)',
          }}
        />
      </div>

      {!isComplete && (
        <>
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-sm font-medium mb-2"
            style={{ color: 'var(--matcha-600)' }}
          >
            {expanded ? text.hideContent : text.showToday}
          </button>

          {expanded && moduleData && (
            <div className="mt-3 p-3 rounded-lg" style={{ background: 'var(--cream-50)' }}>
              <h5 className="font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                {moduleData.title}
              </h5>
              <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                {moduleData.content}
              </p>
              <div className="p-3 rounded-lg" style={{ background: 'var(--matcha-50)' }}>
                <h6 className="text-sm font-medium mb-2" style={{ color: 'var(--matcha-700)' }}>
                  {moduleData.exercise.title}
                </h6>
                <ol className="space-y-1">
                  {moduleData.exercise.steps.map((step, i) => (
                    <li
                      key={i}
                      className="text-sm"
                      style={{ color: 'var(--text-secondary)', listStyleType: 'decimal', marginLeft: '1rem' }}
                    >
                      {step}
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          )}

          <button
            onClick={handleCompleteDay}
            disabled={completing}
            className="w-full mt-3 py-2 rounded-lg text-sm font-medium"
            style={{
              background: 'var(--matcha-500)',
              color: 'white',
            }}
          >
            {completing ? text.completing : text.completeDay}
          </button>
        </>
      )}
    </div>
  );
}
