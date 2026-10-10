'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useRequireRole } from '@/components/AuthProvider';

export default function ResultPage() {
  const { user, ready } = useRequireRole('any');
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    if (!ready) return;
    fetch(`/api/result/${id}`).then((r) => r.json()).then(setData);
  }, [ready, id]);

  if (!ready || !data) return <p className="text-gray-500">Loading result...</p>;
  if (data.error) return <p className="text-red-600">{data.error}</p>;

  const { attempt, quizTitle, maxTotal } = data;
  const finalScore = attempt.autoScore + (attempt.manualScore ?? 0);

  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow p-6 space-y-4 text-center">
      <h1 className="text-2xl font-bold text-gray-800">{quizTitle}</h1>

      {attempt.status === 'in_progress' ? (
        <p className="text-yellow-600">Your exam has not been recorded as submitted. Please contact your teacher.</p>
      ) : (
        <>
          {attempt.autoSubmitted && (
            <p className="text-red-500 text-sm font-medium">
              This exam was auto-submitted because you left the exam tab.
            </p>
          )}
          <p className="text-5xl font-bold text-primary-600">
            {finalScore}
            <span className="text-2xl text-gray-400"> / {maxTotal}</span>
          </p>
          <p className="text-gray-500 text-sm">
            {attempt.pendingReview
              ? 'This is your auto-graded (MCQ) score. Written/code answers are pending teacher review, so your final score may increase.'
              : 'Final score'}
          </p>
        </>
      )}

      <Link
        href={user?.role === 'teacher' ? '/teacher' : '/join'}
        className="inline-block text-primary-600 text-sm font-semibold hover:underline"
      >
        ← Back
      </Link>
    </div>
  );
}
