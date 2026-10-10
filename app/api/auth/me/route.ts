import { NextResponse } from 'next/server';
import { getSessionUser, toPublicUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  const user = getSessionUser();
  return NextResponse.json({ user: user ? toPublicUser(user) : null });
}
