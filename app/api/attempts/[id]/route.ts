import { NextRequest, NextResponse } from 'next/server';
import { readDb, writeDb } from '@/lib/db';
import { requireRole } from '@/lib/auth';

function findOwned(db: ReturnType<typeof readDb>, attemptId: string, teacherId: string) {
  const attempt = db.attempts.find((a) => a.id === attemptId);
  if (!attempt) return null;
  const quiz = db.quizzes.find((q) => q.id === attempt.quizId && q.teacherId === teacherId);
  return quiz ? { attempt, quiz } : null;
}

// Teacher awards points for written/code answers
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const teacher = requireRole('teacher');
  if (!teacher) return NextResponse.json({ error: 'Not allowed' }, { status: 401 });

  const db = readDb();
  const found = findOwned(db, params.id, teacher.id);
  if (!found) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const { manualScore } = await req.json();
  const maxManual = found.quiz.questions.filter((q) => q.type !== 'mcq').reduce((s, q) => s + q.points, 0);
  const value = Math.max(0, Math.min(Number(manualScore) || 0, maxManual));

  found.attempt.manualScore = value;
  found.attempt.pendingReview = false;
  writeDb(db);
  return NextResponse.json({ ok: true });
}

// Teacher deletes an attempt -> that student may enter the exam again (e.g. their PC crashed)
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const teacher = requireRole('teacher');
  if (!teacher) return NextResponse.json({ error: 'Not allowed' }, { status: 401 });

  const db = readDb();
  const found = findOwned(db, params.id, teacher.id);
  if (!found) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  db.attempts = db.attempts.filter((a) => a.id !== params.id);
  writeDb(db);
  return NextResponse.json({ ok: true });
}
