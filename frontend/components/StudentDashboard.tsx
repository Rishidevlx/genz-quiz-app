import React, { useState, useEffect } from 'react';
import { User, Quiz, QuizAttempt } from '../types';
import { Card } from './Card';
import { Button } from './Button';
import { api } from '../services/api';

interface StudentDashboardProps {
  user: User;
  onStartQuiz: (quiz: Quiz) => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  user,
  onStartQuiz
}) => {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [q, a] = await Promise.all([
          api.quizzes.getAll(user.classYear),
          api.attempts.getByUser(user.id)
        ]);
        setQuizzes(q);
        setAttempts(a);
      } catch (error) {
        console.error("Failed to load student data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user.classYear, user.id]);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-slate-500">Loading your profile...</div>;

  return (
    <div className="max-w-5xl mx-auto py-10 px-6">
      <div className="mb-10 pb-6 border-b border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Welcome, {user.name}</h1>
          <p className="text-slate-500 text-sm mt-1">{user.classYear} Student | CS Department</p>
        </div>
        <div className="flex items-center gap-2 bg-green-50 text-green-700 px-4 py-2 rounded-full border border-green-100 text-xs font-semibold">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          Online Status: Active
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-lg font-bold text-slate-700 uppercase tracking-wider mb-6 flex items-center gap-3">
          Assigned Quizzes
          <span className="h-px bg-slate-200 flex-1"></span>
        </h2>

        <div className="space-y-4">
          {quizzes.length > 0 ? quizzes.map(quiz => {
            const userAttempts = attempts.filter(a => a.quizId === quiz.id);
            const attemptsLeft = quiz.maxAttempts - userAttempts.length;
            const isCompleted = attemptsLeft <= 0;

            return (
              <Card key={quiz.id} className={isCompleted ? 'bg-slate-50 opacity-75' : 'hover:border-blue-300'}>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-slate-800">{quiz.title}</h3>
                      {isCompleted && (
                        <span className="bg-slate-200 text-slate-600 text-[9px] font-bold px-2 py-0.5 rounded uppercase">Max Attempts Reached</span>
                      )}
                    </div>
                    <p className="text-slate-500 text-sm mb-4">{quiz.description}</p>

                    <div className="flex gap-4">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">🕒 {quiz.durationMinutes} Mins</span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">📝 {quiz.questions.length} Questions</span>
                      <span className={`text-[10px] font-bold uppercase ${attemptsLeft > 0 ? 'text-blue-600' : 'text-slate-400'}`}>
                        ✓ {attemptsLeft} Attempts Left
                      </span>
                    </div>
                  </div>

                  <div className="w-full md:w-auto">
                    <Button
                      onClick={() => onStartQuiz(quiz)}
                      disabled={isCompleted}
                      className={`w-full md:w-auto px-10 ${isCompleted ? 'bg-slate-300' : ''}`}
                    >
                      {isCompleted ? 'Completed' : 'Start Quiz'}
                    </Button>
                  </div>
                </div>
              </Card>
            );
          }) : (
            <div className="py-20 text-center border-2 border-dashed border-slate-200 rounded-lg">
              <p className="text-slate-400 font-medium">No quizzes assigned to your class yet.</p>
            </div>
          )}
        </div>
      </div>

      <div className="mt-20 pt-8 border-t border-slate-200 text-center">
        <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">Digital Assessment Framework</p>
      </div>
    </div>
  );
};
