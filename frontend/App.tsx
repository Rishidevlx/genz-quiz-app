
import React, { useState, useEffect } from 'react';
import { User, Quiz, QuizAttempt } from './types';
import { api } from './services/api';
import { Login } from './components/Login';
import { AdminDashboard } from './components/AdminDashboard';
import { StudentDashboard } from './components/StudentDashboard';
import { QuizTaking } from './components/QuizTaking';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(api.auth.getCurrentUser());
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);

  const handleLogin = async (user: User) => {
    setCurrentUser(user);
  };

  const handleLogout = () => {
    api.auth.logout();
    setCurrentUser(null);
    setActiveQuiz(null);
  };

  const handleSubmitAttempt = async (attempt: QuizAttempt) => {
    try {
      await api.attempts.save(attempt);
      setActiveQuiz(null);
    } catch (e) {
      alert('Failed to save attempt');
    }
  };

  if (!currentUser) {
    return <Login onLogin={handleLogin} />;
  }

  if (activeQuiz) {
    return (
      <QuizTaking
        quiz={activeQuiz}
        user={currentUser}
        onCancel={() => setActiveQuiz(null)}
        onSubmit={handleSubmitAttempt}
      />
    );
  }

  // We no longer pass data props, components fetch their own data
  return (
    <div className="min-h-screen">
      {/* Hide standard nav in AdminDashboard as it has its own sidebar */}
      {currentUser.role !== 'ADMIN' && (
        <nav className="glass border-b border-white/10 px-8 py-6 flex justify-between items-center sticky top-0 z-50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white text-purple-700 rounded-2xl flex items-center justify-center font-black text-2xl italic shadow-2xl">Q</div>
            <span className="text-2xl font-black text-white italic tracking-tighter uppercase">AI Quiz Pro</span>
          </div>
          <div className="flex items-center gap-8">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-black text-white italic">{currentUser.name}</p>
              <p className="text-[9px] font-black text-white/40 uppercase tracking-widest">{currentUser.classYear} Student</p>
            </div>
            <button
              onClick={handleLogout}
              className="w-12 h-12 glass rounded-2xl flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-all border border-white/10 shadow-xl"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
            </button>
          </div>
        </nav>
      )}

      <main className={`${currentUser.role === 'ADMIN' ? '' : 'max-w-7xl mx-auto p-4 sm:p-6 lg:p-12'}`}>
        {currentUser.role === 'ADMIN' ? (
          <AdminDashboard onLogout={handleLogout} />
        ) : (
          <StudentDashboard user={currentUser} onStartQuiz={setActiveQuiz} />
        )}
      </main>
    </div>
  );
};

export default App;
