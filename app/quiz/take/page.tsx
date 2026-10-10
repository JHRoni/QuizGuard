'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useRequireRole } from '@/components/AuthProvider';

interface Question {
  id: string;
  type: 'mcq' | 'written' | 'code';
  text: string;
  points: number;
  options?: string[];
  language?: string;
}

interface Quiz {
  id: string;
  title: string;
  questions: Question[];
}

export default function TakeQuizPage() {
  const { ready } = useRequireRole('student');
  const router = useRouter();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [studentName, setStudentName] = useState('');
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const answersRef = useRef(answers);
  answersRef.current = answers;
  const attemptIdRef = useRef<string | null>(null);
  const doneRef = useRef(false);

  // Load the exam that /join stored for this tab
  useEffect(() => {
    if (!ready) return;
    const stored = sessionStorage.getItem('activeQuiz');
    const attemptId = sessionStorage.getItem('attemptId');
    const name = sessionStorage.getItem('studentName');
    if (!stored || !attemptId) {
      router.replace('/join');
      return;
    }
    attemptIdRef.current = attemptId;
    setQuiz(JSON.parse(stored));
    setStudentName(name || '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  // Auto-submit the moment the student leaves this tab / minimizes / closes the window
  useEffect(() => {
    if (!quiz) return;
    function onVisibility() {
      if (document.hidden) doSubmit(true);
    }
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quiz]);

  async function doSubmit(autoSubmitted: boolean) {
    const attemptId = attemptIdRef.current;
    if (doneRef.current || !attemptId) return;
    doneRef.current = true;
    setSubmitting(true);

    // Clear the stored exam FIRST so a refresh/back can never reopen it
    sessionStorage.removeItem('activeQuiz');
    sessionStorage.removeItem('attemptId');
    sessionStorage.removeItem('studentName');

    const answerList = Object.entries(answersRef.current).map(([questionId, value]) => ({ questionId, value }));

    try {
      // keepalive lets the request finish even if the tab is being closed
      await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        keepalive: true,
        body: JSON.stringify({ attemptId, answers: answerList, autoSubmitted }),
      });
    } catch {
      // ignore: the attempt stays "in progress" and the teacher can see it
    }
    router.push(`/result/${attemptId}`);
  }

  if (!ready || !quiz) return <p className="text-gray-500">Loading exam...</p>;

  return (
    <div className="space-y-6">
      <div className="bg-yellow-50 border border-yellow-300 text-yellow-800 text-sm rounded-lg p-3">
        Do not switch tabs or minimize this window — doing so will auto-submit your exam immediately and you cannot re-enter.
      </div>
      <h1 className="text-2xl font-bold text-gray-800">{quiz.title}</h1>
      <p className="text-gray-600">Student: {studentName}</p>

      <div className="space-y-6">
        {quiz.questions.map((q, idx) => (
          <div key={q.id} className="bg-white rounded-lg shadow p-4 space-y-3">
            <p className="font-medium text-gray-800">
              Q{idx + 1}. {q.text} <span className="text-xs text-gray-400">({q.points} pts)</span>
            </p>

            {q.type === 'mcq' && (
              <div className="space-y-2">
                {q.options?.map((opt, i) => (
                  <label key={i} className="flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name={q.id}
                      checked={answers[q.id] === String(i)}
                      onChange={() => setAnswers({ ...answers, [q.id]: String(i) })}
                    />
                    {opt}
                  </label>
                ))}
              </div>
            )}

            {q.type === 'written' && (
              <textarea
                className="w-full border rounded-md px-3 py-2 min-h-[100px]"
                value={answers[q.id] || ''}
                onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                placeholder="Type your answer..."
              />
            )}

            {q.type === 'code' && (
              <textarea
                className="w-full border rounded-md px-3 py-2 min-h-[160px] font-mono text-sm bg-gray-900 text-green-300"
                value={answers[q.id] || ''}
                onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                placeholder={`// Write your ${q.language || 'code'} here`}
                spellCheck={false}
              />
            )}
          </div>
        ))}
      </div>

      <button
        onClick={() => doSubmit(false)}
        disabled={submitting}
        className="bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white px-6 py-3 rounded-lg font-semibold"
      >
        {submitting ? 'Submitting...' : 'Submit exam'}
      </button>
    </div>
  );
}
