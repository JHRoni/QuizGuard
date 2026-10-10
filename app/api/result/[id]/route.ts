import { NextRequest, NextResponse } from 'next/server';
import { readDb } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const user = getSessionUser();
  if (!user) return NextResponse.json({ error: 'Please log in.' }, { status: 401 });

  const db = readDb();
  const attempt = db.attempts.find((a) => a.id === params.id);
  if (!attempt) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const quiz = db.quizzes.find((q) => q.id === attempt.quizId);
  // Only the student who took it, or the teacher who owns the quiz, may see it
  const allowed = attempt.studentId === user.id || quiz?.teacherId === user.id;
  if (!allowed) return NextResponse.json({ error: 'Not allowed' }, { status: 403 });

  const maxTotal = quiz ? quiz.questions.reduce((s, q) => s + q.points, 0) : 0;
  return NextResponse.json({
    attempt: {
      id: attempt.id,
      status: attempt.status,
      autoScore: attempt.autoScore,
      manualScore: attempt.manualScore,
      pendingReview: attempt.pendingReview,
      autoSubmitted: attempt.autoSubmitted,
    },
    quizTitle: quiz?.title ?? 'Quiz',
    maxTotal,
  });
}
