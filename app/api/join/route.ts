import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { readDb, writeDb } from '@/lib/db';
import { requireRole } from '@/lib/auth';
import { Attempt } from '@/types';

export async function POST(req: NextRequest) {
  const student = requireRole('student');
  if (!student) return NextResponse.json({ error: 'Please log in as a student.' }, { status: 401 });

  const { passkey } = await req.json();
  const key = String(passkey ?? '').trim().toLowerCase();

  const db = readDb();
  const quiz = db.quizzes.find((q) => q.passkey.toLowerCase() === key);
  if (!quiz) return NextResponse.json({ error: 'Invalid passkey' }, { status: 404 });

  // One attempt per student per exam: block if they already started OR finished it.
  const existing = db.attempts.find((a) => a.quizId === quiz.id && a.studentId === student.id);
  if (existing) {
    return NextResponse.json(
      { error: 'You have already taken this exam. Each student can enter only once.', attemptId: existing.id },
      { status: 409 }
    );
  }

  // Record the start immediately, so leaving and re-entering does not give a second try.
  const attempt: Attempt = {
    id: uuidv4(),
    quizId: quiz.id,
    studentId: student.id,
    studentName: student.name,
    studentLoginId: student.loginId,
    status: 'in_progress',
    answers: [],
    autoScore: 0,
    maxAutoScore: 0,
    pendingReview: false,
    autoSubmitted: false,
    startedAt: new Date().toISOString(),
  };
  db.attempts.push(attempt);
  writeDb(db);

  // Never send correct answers to the student.
  const safeQuiz = {
    id: quiz.id,
    title: quiz.title,
    questions: quiz.questions.map((q) => ({
      id: q.id,
      type: q.type,
      text: q.text,
      points: q.points,
      options: q.options,
      language: q.language,
    })),
  };

  return NextResponse.json({ quiz: safeQuiz, attemptId: attempt.id, studentName: student.name });
}
