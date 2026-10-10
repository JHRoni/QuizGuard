'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useAuth } from '@/components/AuthProvider';

export default function AuthForm({ mode }: { mode: 'login' | 'register' }) {
  const router = useRouter();
  const { setUser } = useAuth();
  const [role, setRole] = useState<'teacher' | 'student'>('student');
  const [name, setName] = useState('');
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [teacherCode, setTeacherCode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setBusy(true);
    const res = await fetch(`/api/auth/${mode}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, loginId, password, role, teacherCode }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(data.error || 'Something went wrong.');
      return;
    }
    setUser(data.user);
    router.push(data.user.role === 'teacher' ? '/teacher' : '/join');
  }

  const isRegister = mode === 'register';

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto bg-white rounded-lg shadow p-6 space-y-4">
      <h1 className="text-2xl font-bold text-gray-800">{isRegister ? 'Create account' : 'Log in'}</h1>

      {isRegister && (
        <div className="flex rounded-lg overflow-hidden border border-primary-600">
          {(['student', 'teacher'] as const).map((r) => (
            <button
              type="button"
              key={r}
              onClick={() => setRole(r)}
              className={`flex-1 py-2 text-sm font-semibold capitalize ${
                role === r ? 'bg-primary-600 text-white' : 'bg-white text-primary-700 hover:bg-primary-50'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      )}

      {isRegister && (
        <div>
          <label className="block text-sm font-medium text-gray-700">Full name</label>
          <input className="mt-1 w-full border rounded-md px-3 py-2" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700">
          {isRegister ? (role === 'student' ? 'Student ID (e.g. roll number)' : 'Teacher ID') : 'Your ID'}
        </label>
        <input
          className="mt-1 w-full border rounded-md px-3 py-2 font-mono"
          value={loginId}
          onChange={(e) => setLoginId(e.target.value)}
          autoComplete="username"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Password</label>
        <input
          type="password"
          className="mt-1 w-full border rounded-md px-3 py-2"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete={isRegister ? 'new-password' : 'current-password'}
        />
      </div>

      {isRegister && role === 'teacher' && (
        <div>
          <label className="block text-sm font-medium text-gray-700">Teacher signup code (if your school set one)</label>
          <input className="mt-1 w-full border rounded-md px-3 py-2" value={teacherCode} onChange={(e) => setTeacherCode(e.target.value)} />
        </div>
      )}

      {error && <p className="text-red-600 text-sm">{error}</p>}

      <button
        type="submit"
        disabled={busy}
        className="w-full bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white px-4 py-3 rounded-lg font-semibold"
      >
        {busy ? 'Please wait...' : isRegister ? 'Register' : 'Log in'}
      </button>

      <p className="text-sm text-gray-500 text-center">
        {isRegister ? (
          <>Already have an account? <Link href="/login" className="text-primary-600 font-medium">Log in</Link></>
        ) : (
          <>New here? <Link href="/register" className="text-primary-600 font-medium">Create an account</Link></>
        )}
      </p>
    </form>
  );
}
