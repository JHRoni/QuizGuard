'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useRequireRole } from '@/components/AuthProvider';

interface MyAttempt {
  id: string;
  quizTitle: string;
  status: 'in_progress' | 'submitted';
  score: number;
  maxTotal: number;
  pendingReview: boolean;
  submittedAt: string;
}

export default function JoinPage() {
  const { user, ready } = useRequireRole('student');
  const router = useRouter();
  const [passkey, setPasskey] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [history, setHistory] = useState<MyAttempt[]>([]);

  useEffect(() => {
    if (!ready) return;
    fetch('/api/my-attempts')
      .then((r) => r.json())
      .then((d) => Array.isArray(d) && setHistory(d));
  }, [ready]);

  async function handleJoin() {
    setError('');
    setBusy(true);
    const res = await fetch('/api/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ passkey }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(data.error || 'Could not join quiz.');
      return;
    }
    sessionStorage.setItem('activeQuiz', JSON.stringify(data.quiz));
    sessionStorage.setItem('attemptId', data.attemptId);
    sessionStorage.setItem('studentName', data.studentName);
    router.push('/quiz/take');
  }

  if (!ready || !user) return <p className="text-gray-500">Loading...</p>;

  return (
    <div className="max-w-md mx-auto space-y-8">
      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        <h1 className="text-2xl font-bold text-gray-800">Enter an exam</h1>
        <p className="text-sm text-gray-600">
          Logged in as <strong>{user.name}</strong> ({user.loginId})
        </p>
        <div>
          <label className="block text-sm font-medium text-gray-700">Exam passkey</label>
          <input
            className="mt-1 w-full border rounded-md px-3 py-2 font-mono"
            value={passkey}
            onChange={(e) => setPasskey(e.target.value)}
          />
        </div>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button
          onClick={handleJoin}
          disabled={busy}
          className="w-full bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white px-4 py-3 rounded-lg font-semibold"
        >
          {busy ? 'Starting...' : 'Start exam'}
        </button>
        <p className="text-xs text-gray-500">
          You can enter each exam only once. Leaving the tab, minimizing or closing the window
          auto-submits your exam and you cannot re-enter.
        </p>
      </div>

      <div>
        <h2 className="text-lg font-bold text-gray-800 mb-2">My exams</h2>
        <div className="space-y-2">
          {history.map((h) => (
            <div key={h.id} className="bg-white rounded-lg shadow p-3 flex justify-between items-center">
              <div>
                <p className="font-medium">{h.quizTitle}</p>
                <p className="text-xs text-gray-500">{new Date(h.submittedAt).toLocaleString()}</p>
              </div>
              {h.status === 'submitted' ? (
                <Link href={`/result/${h.id}`} className="text-primary-600 text-sm font-semibold hover:underline">
                  {h.score} / {h.maxTotal}{h.pendingReview ? '+' : ''}
                </Link>
              ) : (
                <span className="text-xs text-yellow-600">not submitted</span>
              )}
            </div>
          ))}
          {history.length === 0 && <p className="text-sm text-gray-500">You haven&apos;t taken any exams yet.</p>}
        </div>
      </div>
    </div>
  );
}
