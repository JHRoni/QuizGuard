'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useRequireRole } from '@/components/AuthProvider';

export default function QuizResultsPage() {
  const { ready } = useRequireRole('teacher');
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<any>(null);
  const [saving, setSaving] = useState<string | null>(null);

  const load = useCallback(() => {
    fetch(`/api/quizzes/${id}`).then((r) => r.json()).then(setData);
  }, [id]);

  useEffect(() => {
    if (ready) load();
  }, [ready, load]);

  async function saveManualScore(attemptId: string, value: number) {
    setSaving(attemptId);
    await fetch(`/api/attempts/${attemptId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ manualScore: value }),
    });
    load();
    setSaving(null);
  }

  async function allowRetake(attemptId: string, name: string) {
    if (!confirm(`Delete ${name}'s attempt and let them enter this exam again?`)) return;
    await fetch(`/api/attempts/${attemptId}`, { method: 'DELETE' });
    load();
  }

  if (!ready || !data) return <p className="text-gray-500">Loading...</p>;
  if (data.error) return <p className="text-red-600">{data.error}</p>;

  const { quiz, attempts } = data;
  const maxTotal = quiz.questions.reduce((s: number, q: any) => s + q.points, 0);

  return (
    <div className="space-y-6">
      <Link href="/teacher" className="text-sm text-primary-600 hover:underline">← Back to my quizzes</Link>
      <h1 className="text-2xl font-bold text-gray-800">{quiz.title} — results</h1>
      <p className="text-sm text-gray-500">
        Passkey: <span className="font-mono">{quiz.passkey}</span> · {attempts.length} student(s) entered
      </p>

      {attempts.length === 0 && <p className="text-gray-500">No students have entered yet.</p>}

      <div className="space-y-4">
        {attempts.map((a: any) => {
          const finalScore = a.autoScore + (a.manualScore ?? 0);
          return (
            <div key={a.id} className="bg-white rounded-lg shadow p-4 space-y-3">
              <div className="flex justify-between items-start gap-4">
                <div>
                  <p className="font-semibold">{a.studentName}</p>
                  <p className="text-xs text-gray-500 font-mono">ID: {a.studentLoginId}</p>
                </div>
                <div className="text-right text-sm">
                  {a.status === 'in_progress' ? (
                    <span className="text-yellow-600 font-medium">In progress / never submitted</span>
                  ) : (
                    <>
                      {a.autoSubmitted && (
                        <span className="block text-red-500 font-medium">Auto-submitted (left the tab)</span>
                      )}
                      <span className="text-gray-700 font-semibold">{finalScore} / {maxTotal}</span>
                    </>
                  )}
                </div>
              </div>

              {a.status === 'submitted' &&
                quiz.questions.map((q: any) => {
                  if (q.type === 'mcq') return null;
                  const ans = a.answers.find((x: any) => x.questionId === q.id);
                  return (
                    <div key={q.id} className="border-t pt-2">
                      <p className="text-sm font-medium text-gray-700">
                        {q.text} <span className="text-xs text-gray-400">({q.points} pts)</span>
                      </p>
                      <pre className="bg-gray-50 rounded p-2 text-sm whitespace-pre-wrap mt-1">
                        {ans?.value || '(no answer)'}
                      </pre>
                    </div>
                  );
                })}

              <div className="flex items-center justify-between gap-2 flex-wrap">
                {a.status === 'submitted' && a.pendingReview ? (
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-gray-600">Award points for written/code:</label>
                    <input
                      type="number"
                      min={0}
                      className="w-20 border rounded-md px-2 py-1"
                      defaultValue={a.manualScore ?? 0}
                      onBlur={(e) => saveManualScore(a.id, Number(e.target.value))}
                    />
                    {saving === a.id && <span className="text-xs text-gray-400">saving...</span>}
                  </div>
                ) : (
                  <span />
                )}
                <button
                  onClick={() => allowRetake(a.id, a.studentName)}
                  className="text-xs text-red-500 hover:underline"
                >
                  Allow retake
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
