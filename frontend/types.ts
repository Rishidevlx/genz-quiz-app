
export type UserRole = 'ADMIN' | 'STUDENT';
export type ClassYear = '1st Year' | '2nd Year' | '3rd Year';

export interface User {
  id: string;
  email?: string;
  registerNumber?: string;
  password?: string;
  name: string;
  role: UserRole;
  classYear?: ClassYear;
}

export interface Question {
  id: string;
  text: string;
  options: string[];
  correctAnswer: number;
}

export interface Quiz {
  id: string;
  title: string;
  description: string;
  classYear: ClassYear;
  questions: Question[];
  durationMinutes: number;
  maxAttempts: number; // Added: Admin sets the limit
  createdAt: string;
}

export interface QuizAttempt {
  id: string;
  quizId: string;
  userId: string;
  userName: string;
  score: number;
  totalQuestions: number;
  timeTaken: number;
  completedAt: string;
  answers: Record<string, number>;
}
