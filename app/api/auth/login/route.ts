import { NextRequest, NextResponse } from 'next/server';
import { readDb } from '@/lib/db';
import { createSessionToken, SESSION_COOKIE, SESSION_MAX_AGE, toPublicUser, verifyPassword } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const loginId = String(body.loginId ?? '').trim().toLowerCase();
  const password = String(body.password ?? '');

  const user = readDb().users.find((u) => u.loginId === loginId);
  if (!user || !verifyPassword(password, user.passwordHash)) {
    return NextResponse.json({ error: 'Wrong ID or password.' }, { status: 401 });
  }

  const res = NextResponse.json({ user: toPublicUser(user) });
  res.cookies.set(SESSION_COOKIE, createSessionToken(user.id), {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE,
  });
  return res;
}
