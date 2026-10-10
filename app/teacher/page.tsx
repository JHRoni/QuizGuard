'use client';

import { useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import Link from 'next/link';
import { useRequireRole } from '@/components/AuthProvider';

type QType = 'mcq' | 'written' | 'code';

interface DraftQuestion {
  id: string;
  type: QType;
  text: string;
  points: number;
  options: string[];
  correctOptionIndex: number;
  language?: string;
}

interface QuizSummary {
  id: string;
  title: string;
  passkey: string;
  questionCount: number;
  attemptCount?: number;
  createdAt: string;
}

function emptyQuestion(type: QType): DraftQuestion {
  return {
    id: uuidv4(),
    type,
    text: '',
    points: 1,
    options: type === 'mcq' ? ['', '', '', ''] : [],
    correctOptionIndex: 0,
    language: type === 'code' ? 'javascript' : undefined,
  };
}

export default function TeacherPage() {
  const { ready } = useRequireRole('teacher');
  const [title, setTitle] = useState('');
  const [passkey, setPasskey] = useState('');
  const [questions, setQuestions] = useState<DraftQuestion[]>([]);
  const [quizzes, setQuizzes] = useState<QuizSummary[]>([]);
  const [error, setError] = useState('');
  const [created, setCreated] = useState<QuizSummary | null>(null);

  function loadQuizzes() {
    fetch('/api/quizzes')
      .then((r) => r.json())
      .then((d) => Array.isArray(d) && setQuizzes(d));
  }

  useEffect(() => {
    if (ready) loadQuizzes();
  }, [ready]);

  function addQuestion(type: QType) {
    setQuestions([...questions, emptyQuestion(type)]);
  }

  function updateQuestion(id: string, patch: Partial<DraftQuestion>) {
    setQuestions(questions.map((q) => (q.id === id ? { ...q, ...patch } : q)));
  }

  function removeQuestion(id: string) {
    setQuestions(questions.filter((q) => q.id !== id));
  }

  function updateOption(qId: string, idx: number, value: string) {
    setQuestions(
      questions.map((q) =>
        q.id === qId ? { ...q, options: q.options.map((o, i) => (i === idx ? value : o)) } : q
      )
    );
  }

  async function handleSubmit() {
    setError('');
    if (!title.trim() || !passkey.trim() || questions.length === 0) {
      setError('Title, passkey and at least one question are required.');
      return;
    }
    const res = await fetch('/api/quizzes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, passkey, questions }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || 'Something went wrong.');
      return;
    }
    setCreated(data);
    setTitle('');
    setPasskey('');
    setQuestions([]);
    loadQuizzes();
  }

  if (!ready) return <p className="text-gray-500">Loading...</p>;

  return (
    <div className="space-y-10">
      <h1 className="text-2xl font-bold text-gray-800">Create a quiz</h1>

      {created && (
        <div className="bg-primary-50 border border-primary-300 text-primary-800 rounded-lg p-4">
          Quiz &quot;<strong>{created.title}</strong>&quot; created. Share this passkey with students:{' '}
          <span className="font-mono font-bold">{created.passkey}</span>
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Quiz title</label>
          <input
            className="mt-1 w-full border rounded-md px-3 py-2"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Midterm - Data Structures"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Passkey (students use this to join)</label>
          <input
            className="mt-1 w-full border rounded-md px-3 py-2 font-mono"
            value={passkey}
            onChange={(e) => setPasskey(e.target.value)}
            placeholder="e.g. CS101-EXAM"
          />
        </div>

        <div className="space-y-4">
          {questions.map((q, idx) => (
            <div key={q.id} className="border rounded-lg p-4 space-y-3 bg-gray-50">
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold text-primary-700 uppercase">
                  Q{idx + 1} · {q.type}
                </span>
                <button onClick={() => removeQuestion(q.id)} className="text-red-500 text-sm hover:underline">
                  Remove
                </button>
              </div>
              <textarea
                className="w-full border rounded-md px-3 py-2"
                placeholder="Question text"
                value={q.text}
                onChange={(e) => updateQuestion(q.id, { text: e.target.value })}
              />
              <div className="flex items-center gap-2 flex-wrap">
                <label className="text-sm text-gray-600">Points</label>
                <input
                  type="number"
                  min={1}
                  className="w-20 border rounded-md px-2 py-1"
                  value={q.points}
                  onChange={(e) => updateQuestion(q.id, { points: Number(e.target.value) })}
                />
                {q.type === 'code' && (
                  <>
                    <label className="text-sm text-gray-600 ml-4">Language</label>
                    <input
                      className="border rounded-md px-2 py-1"
                      value={q.language}
                      onChange={(e) => updateQuestion(q.id, { language: e.target.value })}
                    />
                  </>
                )}
              </div>

              {q.type === 'mcq' && (
                <div className="space-y-2">
                  {q.options.map((opt, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input
                        type="radio"
                        checked={q.correctOptionIndex === i}
                        onChange={() => updateQuestion(q.id, { correctOptionIndex: i })}
                      />
                      <input
                        className="flex-1 border rounded-md px-2 py-1"
                        placeholder={`Option ${i + 1}`}
                        value={opt}
                        onChange={(e) => updateOption(q.id, i, e.target.value)}
                      />
                    </div>
                  ))}
                  <p className="text-xs text-gray-500">Select the radio button next to the correct option.</p>
                </div>
              )}

              {q.type === 'written' && (
                <p className="text-xs text-gray-500">
                  Written answers are graded manually by you after submission.
                </p>
              )}
              {q.type === 'code' && (
                <p className="text-xs text-gray-500">
                  Students get a code editor box. This starter doesn&apos;t auto-run code — you review submissions manually.
                </p>
              )}
            </div>
          ))}
        </div>

        <div className="flex gap-2 flex-wrap">
          <button onClick={() => addQuestion('mcq')} className="bg-primary-100 text-primary-700 px-3 py-2 rounded-md text-sm font-medium hover:bg-primary-200">
            + MCQ question
          </button>
          <button onClick={() => addQuestion('written')} className="bg-primary-100 text-primary-700 px-3 py-2 rounded-md text-sm font-medium hover:bg-primary-200">
            + Written question
          </button>
          <button onClick={() => addQuestion('code')} className="bg-primary-100 text-primary-700 px-3 py-2 rounded-md text-sm font-medium hover:bg-primary-200">
            + Code question
          </button>
        </div>

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <button onClick={handleSubmit} className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg font-semibold">
          Create quiz
        </button>
      </div>

      <div>
        <h2 className="text-xl font-bold text-gray-800 mb-3">Your quizzes</h2>
        <div className="space-y-2">
          {quizzes.map((q) => (
            <div key={q.id} className="bg-white rounded-lg shadow p-4 flex justify-between items-center">
              <div>
                <p className="font-semibold">{q.title}</p>
                <p className="text-sm text-gray-500">
                  {q.questionCount} questions · {q.attemptCount ?? 0} students entered · passkey: <span className="font-mono">{q.passkey}</span>
                </p>
              </div>
              <Link href={`/teacher/${q.id}`} className="text-primary-600 text-sm font-medium hover:underline">
                View results
              </Link>
            </div>
          ))}
          {quizzes.length === 0 && <p className="text-gray-500 text-sm">No quizzes yet.</p>}
        </div>
      </div>
    </div>
  );
}
