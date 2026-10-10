import crypto from 'crypto';
import { cookies } from 'next/headers';
import { readDb } from '@/lib/db';
import { PublicUser, Role, User } from '@/types';

export const SESSION_COOKIE = 'quiz_session';
export const SESSION_MAX_AGE = 60 * 60 * 8; // 8 hours

const SECRET = process.env.SESSION_SECRET || 'dev-only-secret-change-me';

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(':');
  if (!salt || !hash) return false;
  const expected = Buffer.from(hash, 'hex');
  const actual = crypto.scryptSync(password, salt, 64);
  return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
}

function sign(payload: string): string {
  return crypto.createHmac('sha256', SECRET).update(payload).digest('hex');
}

export function createSessionToken(userId: string): string {
  const exp = Date.now() + SESSION_MAX_AGE * 1000;
  const payload = `${userId}.${exp}`;
  return `${payload}.${sign(payload)}`;
}

/** Returns the logged-in user from the session cookie, or null. */
export function getSessionUser(): User | null {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [userId, exp, sig] = parts;

  const a = Buffer.from(sig);
  const b = Buffer.from(sign(`${userId}.${exp}`));
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  if (Number(exp) < Date.now()) return null;

  return readDb().users.find((u) => u.id === userId) ?? null;
}

/** Returns the user only if they are logged in AND have the given role. */
export function requireRole(role: Role): User | null {
  const user = getSessionUser();
  return user && user.role === role ? user : null;
}

export function toPublicUser(u: User): PublicUser {
  return { id: u.id, name: u.name, loginId: u.loginId, role: u.role };
}
