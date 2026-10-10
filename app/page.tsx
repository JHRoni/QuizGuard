'use client';

import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';

export default function Home() {
  const { user, loading } = useAuth();

  return (
    <div className="text-center space-y-8 py-12">
      <h1 className="text-3xl font-bold text-gray-800">Create and take quizzes, the simple way</h1>
      <p className="text-gray-600 max-w-lg mx-auto">
        Teachers build a quiz with MCQ, written, or code questions and share a passkey.
        Students log in, enter the passkey and take the exam — once. Switching tabs auto-submits the exam.
      </p>

      {!loading && (
        <div className="flex justify-center gap-4">
          {user ? (
            <Link
              href={user.role === 'teacher' ? '/teacher' : '/join'}
              className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg font-semibold"
            >
              Go to {user.role === 'teacher' ? 'my quizzes' : 'my exams'}
            </Link>
          ) : (
            <>
              <Link href="/login" className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg font-semibold">
                Log in
              </Link>
              <Link href="/register" className="border-2 border-primary-600 text-primary-700 px-6 py-3 rounded-lg font-semibold hover:bg-primary-50">
                Register
              </Link>
            </>
          )}
        </div>
      )}
    </div>
  );
}
