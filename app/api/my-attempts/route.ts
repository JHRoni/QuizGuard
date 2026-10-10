import { NextResponse } from 'next/server';
import { readDb } from '@/lib/db';
import { requireRole } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// Student: list the exams I have taken
export async function GET() {
  const student = requireRole('student');
  if (!student) return NextResponse.json({ error: 'Not allowed' }, { status: 401 });

  const db = readDb();
  const list = db.attempts
    .filter((a) => a.studentId === student.id)
    .map((a) => {
      const quiz = db.quizzes.find((q) => q.id === a.quizId);
      return {
        id: a.id,
        quizTitle: quiz?.title ?? 'Quiz',
        status: a.status,
        score: a.autoScore + (a.manualScore ?? 0),
        maxTotal: quiz ? quiz.questions.reduce((s, q) => s + q.points, 0) : 0,
        pendingReview: a.pendingReview,
        submittedAt: a.submittedAt ?? a.startedAt,
      };
    })
    .reverse();
  return NextResponse.json(list);
}
