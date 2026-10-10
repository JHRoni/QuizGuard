'use client';

import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';

export default function Navbar() {
  const { user, loading, logout } = useAuth();

  return (
    <nav className="bg-primary-600 text-white shadow-md">
      <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold tracking-tight">
          QuizApp
        </Link>

        <div className="flex items-center gap-4 text-sm font-medium">
          {loading ? null : user ? (
            <>
              <Link
                href={user.role === 'teacher' ? '/teacher' : '/join'}
                className="hover:text-primary-100"
              >
                {user.role === 'teacher' ? 'My quizzes' : 'My exams'}
              </Link>
              <span className="hidden sm:inline text-primary-100">
                {user.name} ({user.loginId}) · {user.role}
              </span>
              <button
                onClick={logout}
                className="bg-white text-primary-700 px-3 py-1 rounded-md hover:bg-primary-50"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="hover:text-primary-100">Login</Link>
              <Link href="/register" className="bg-white text-primary-700 px-3 py-1 rounded-md hover:bg-primary-50">
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
