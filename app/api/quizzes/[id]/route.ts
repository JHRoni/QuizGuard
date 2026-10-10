import { NextRequest, NextResponse } from 'next/server';
import { readDb } from '@/lib/db';
import { requireRole } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const teacher = requireRole('teacher');
  if (!teacher) return NextResponse.json({ error: 'Not allowed' }, { status: 401 });

  const db = readDb();
  const quiz = db.quizzes.find((q) => q.id === params.id && q.teacherId === teacher.id);
  if (!quiz) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const attempts = db.attempts.filter((a) => a.quizId === quiz.id);
  return NextResponse.json({ quiz, attempts });
}
