
import React, { useState, useEffect, useCallback } from 'react';
import { Quiz, User, QuizAttempt, Question } from '../types';
import { Button } from './Button';

interface QuizTakingProps {
  quiz: Quiz;
  user: User;
  onCancel: () => void;
  onSubmit: (attempt: QuizAttempt) => void;
}

export const QuizTaking: React.FC<QuizTakingProps> = ({ quiz, user, onCancel, onSubmit }) => {
  const [shuffledQuestions, setShuffledQuestions] = useState<Question[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [timeLeft, setTimeLeft] = useState(quiz.durationMinutes * 60);
  const [startTime] = useState(Date.now());

  useEffect(() => {
    const questions = [...quiz.questions];
    // Shuffle questions
    for (let i = questions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [questions[i], questions[j]] = [questions[j], questions[i]];
    }
    setShuffledQuestions(questions);
  }, [quiz.questions]);

  const finishQuiz = useCallback(() => {
    const timeTaken = Math.floor((Date.now() - startTime) / 1000);
    let score = 0;
    shuffledQuestions.forEach(q => {
      if (answers[q.id] === q.correctAnswer) score++;
    });

    const attempt: QuizAttempt = {
      id: `att-${Date.now()}`,
      quizId: quiz.id,
      userId: user.id,
      userName: user.name,
      score,
      totalQuestions: shuffledQuestions.length,
      timeTaken,
      completedAt: new Date().toISOString(),
      answers
    };
    onSubmit(attempt);
  }, [shuffledQuestions, user, answers, startTime, quiz.id, onSubmit]);

  useEffect(() => {
    if (timeLeft <= 0) { finishQuiz(); return; }
    const t = setInterval(() => setTimeLeft(p => p - 1), 1000);
    return () => clearInterval(t);
  }, [timeLeft, finishQuiz]);

  if (shuffledQuestions.length === 0) return null;

  const q = shuffledQuestions[currentIdx];
  const progress = ((currentIdx + 1) / shuffledQuestions.length) * 100;

  return (
    <div className="min-h-screen flex flex-col bg-slate-100">
      <header className="px-8 py-4 bg-white border-b border-slate-200 flex justify-between items-center sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-blue-600 text-white rounded flex items-center justify-center font-bold text-lg">Q</div>
          <div>
            <h2 className="text-sm font-bold text-slate-800">{quiz.title}</h2>
            <p className="text-[10px] text-slate-400 font-medium uppercase">{user.name}</p>
          </div>
        </div>

        <div className={`px-6 py-2 rounded border font-mono font-bold text-lg ${timeLeft < 60 ? 'bg-red-50 border-red-200 text-red-600 animate-pulse' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
          {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
        </div>
      </header>

      <div className="h-1 bg-slate-200 w-full overflow-hidden">
        <div className="h-full bg-blue-600 transition-all duration-500" style={{ width: `${progress}%` }}></div>
      </div>

      <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-12">
        <div className="mb-12">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 block">Question {currentIdx + 1} of {shuffledQuestions.length}</span>
          <h1 className="text-2xl font-bold text-slate-800 leading-snug">{q.text}</h1>
        </div>

        <div className="space-y-4">
          {q.options.map((opt, i) => {
            const isSelected = answers[q.id] === i;
            return (
              <button
                key={i}
                onClick={() => setAnswers(prev => ({ ...prev, [q.id]: i }))}
                className={`
                  w-full p-6 text-left rounded-lg border-2 transition-all flex items-center gap-4
                  ${isSelected ? 'bg-blue-50 border-blue-600 shadow-sm' : 'bg-white border-slate-200 hover:border-slate-300'}
                `}
              >
                <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold ${isSelected ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-200 text-slate-400'}`}>
                  {String.fromCharCode(65 + i)}
                </div>
                <span className={`text-base font-medium ${isSelected ? 'text-blue-900' : 'text-slate-700'}`}>{opt}</span>
              </button>
            );
          })}
        </div>
      </main>

      <footer className="px-8 py-6 bg-white border-t border-slate-200 sticky bottom-0 flex justify-between items-center">
        <button onClick={() => { if (confirm('Exit quiz? Progress will not be saved.')) onCancel(); }} className="text-xs font-bold text-slate-400 hover:text-red-600 uppercase tracking-wider transition-colors">Abort Session</button>

        <div className="flex gap-4">
          <Button
            variant="outline"
            disabled={currentIdx === 0}
            onClick={() => setCurrentIdx(p => p - 1)}
          >
            Previous
          </Button>

          {currentIdx === shuffledQuestions.length - 1 ? (
            <Button onClick={finishQuiz} variant="primary" className="px-8">
              Submit Answers
            </Button>
          ) : (
            <Button
              disabled={answers[q.id] === undefined}
              onClick={() => setCurrentIdx(p => p + 1)}
              className="px-8"
            >
              Next Question
            </Button>
          )}
        </div>
      </footer>
    </div>
  );
};
