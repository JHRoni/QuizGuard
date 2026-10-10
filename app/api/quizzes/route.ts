import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { readDb, writeDb } from '@/lib/db';
import { requireRole } from '@/lib/auth';
import { Quiz } from '@/types';

export const dynamic = 'force-dynamic';

// Teacher: list ONLY my own quizzes
export async function GET() {
  const teacher = requireRole('teacher');
  if (!teacher) return NextResponse.json({ error: 'Not allowed' }, { status: 401 });

  const db = readDb();
  const mine = db.quizzes
    .filter((q) => q.teacherId === teacher.id)
    .map((q) => ({
      id: q.id,
      title: q.title,
      passkey: q.passkey,
      questionCount: q.questions.length,
      attemptCount: db.attempts.filter((a) => a.quizId === q.id).length,
      createdAt: q.createdAt,
    }));
  return NextResponse.json(mine);
}

export async function POST(req: NextRequest) {
  const teacher = requireRole('teacher');
  if (!teacher) return NextResponse.json({ error: 'Not allowed' }, { status: 401 });

  const body = await req.json();
  const title = String(body.title ?? '').trim();
  const passkey = String(body.passkey ?? '').trim();

  if (!title || !passkey || !Array.isArray(body.questions) || body.questions.length === 0) {
    return NextResponse.json({ error: 'Title, passkey and at least one question are required.' }, { status: 400 });
  }
  if (body.questions.some((q: any) => !String(q.text ?? '').trim())) {
    return NextResponse.json({ error: 'Every question needs some text.' }, { status: 400 });
  }

  const db = readDb();
  if (db.quizzes.some((q) => q.passkey.toLowerCase() === passkey.toLowerCase())) {
    return NextResponse.json({ error: 'Passkey already in use, choose another.' }, { status: 400 });
  }

  const quiz: Quiz = {
    id: uuidv4(),
    teacherId: teacher.id,
    title,
    passkey,
    questions: body.questions,
    createdAt: new Date().toISOString(),
  };
  db.quizzes.push(quiz);
  writeDb(db);

  return NextResponse.json({
    id: quiz.id,
    title: quiz.title,
    passkey: quiz.passkey,
    questionCount: quiz.questions.length,
    attemptCount: 0,
    createdAt: quiz.createdAt,
  });
}
