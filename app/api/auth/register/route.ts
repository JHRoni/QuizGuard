import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { readDb, writeDb } from '@/lib/db';
import { createSessionToken, hashPassword, SESSION_COOKIE, SESSION_MAX_AGE, toPublicUser } from '@/lib/auth';
import { User } from '@/types';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const name = String(body.name ?? '').trim();
  const loginId = String(body.loginId ?? '').trim().toLowerCase();
  const password = String(body.password ?? '');
  const role = body.role;

  if (!name || !loginId || !password) {
    return NextResponse.json({ error: 'Name, ID and password are required.' }, { status: 400 });
  }
  if (role !== 'teacher' && role !== 'student') {
    return NextResponse.json({ error: 'Invalid role.' }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json({ error: 'Password must be at least 6 characters.' }, { status: 400 });
  }

  // Optional: if TEACHER_SIGNUP_CODE is set in .env.local, teachers must know it.
  const requiredCode = process.env.TEACHER_SIGNUP_CODE;
  if (role === 'teacher' && requiredCode && body.teacherCode !== requiredCode) {
    return NextResponse.json({ error: 'Invalid teacher signup code.' }, { status: 403 });
  }

  const db = readDb();
  if (db.users.some((u) => u.loginId === loginId)) {
    return NextResponse.json({ error: 'That ID is already registered.' }, { status: 409 });
  }

  const user: User = {
    id: uuidv4(),
    name,
    loginId,
    role,
    passwordHash: hashPassword(password),
    createdAt: new Date().toISOString(),
  };
  db.users.push(user);
  writeDb(db);

  const res = NextResponse.json({ user: toPublicUser(user) });
  res.cookies.set(SESSION_COOKIE, createSessionToken(user.id), {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE,
  });
  return res;
}
