import { NextRequest, NextResponse } from 'next/server';
import { readDb, writeDb } from '@/lib/db';
import { requireRole } from '@/lib/auth';
import { gradeAutoPart } from '@/lib/grading';
import { Answer } from '@/types';

export async function POST(req: NextRequest) {
  const student = requireRole('student');
  if (!student) return NextResponse.json({ error: 'Please log in as a student.' }, { status: 401 });

  const { attemptId, answers, autoSubmitted } = await req.json();

  const db = readDb();
  const attempt = db.attempts.find((a) => a.id === attemptId && a.studentId === student.id);
  if (!attempt) return NextResponse.json({ error: 'Attempt not found' }, { status: 404 });
  if (attempt.status === 'submitted') {
    return NextResponse.json({ error: 'This exam was already submitted.', id: attempt.id }, { status: 409 });
  }

  const quiz = db.quizzes.find((q) => q.id === attempt.quizId);
  if (!quiz) return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });

  // Keep only answers for real questions of this quiz
  const validIds = new Set(quiz.questions.map((q) => q.id));
  const cleanAnswers: Answer[] = (Array.isArray(answers) ? answers : [])
    .filter((a: any) => a && validIds.has(a.questionId))
    .map((a: any) => ({ questionId: a.questionId, value: String(a.value ?? '') }));

  const { autoScore, maxAutoScore, pendingReview } = gradeAutoPart(quiz.questions, cleanAnswers);

  attempt.answers = cleanAnswers;
  attempt.autoScore = autoScore;
  attempt.maxAutoScore = maxAutoScore;
  attempt.pendingReview = pendingReview;
  attempt.autoSubmitted = !!autoSubmitted;
  attempt.status = 'submitted';
  attempt.submittedAt = new Date().toISOString();
  writeDb(db);

  return NextResponse.json({ id: attempt.id });
}
