export type QuestionType = 'mcq' | 'written' | 'code';
export type Role = 'teacher' | 'student';

export interface User {
  id: string;
  name: string;
  loginId: string; // unique, stored lowercase (e.g. roll number or teacher id)
  role: Role;
  passwordHash: string;
  createdAt: string;
}

export interface PublicUser {
  id: string;
  name: string;
  loginId: string;
  role: Role;
}

export interface Question {
  id: string;
  type: QuestionType;
  text: string;
  points: number;
  options?: string[];
  correctOptionIndex?: number;
  language?: string;
}

export interface Quiz {
  id: string;
  teacherId: string;
  title: string;
  passkey: string;
  questions: Question[];
  createdAt: string;
}

export interface Answer {
  questionId: string;
  value: string;
}

export interface Attempt {
  id: string;
  quizId: string;
  studentId: string;
  studentName: string;
  studentLoginId: string;
  status: 'in_progress' | 'submitted';
  answers: Answer[];
  autoScore: number;
  maxAutoScore: number;
  manualScore?: number;
  pendingReview: boolean;
  autoSubmitted: boolean;
  startedAt: string;
  submittedAt?: string;
}

export interface DB {
  users: User[];
  quizzes: Quiz[];
  attempts: Attempt[];
}
