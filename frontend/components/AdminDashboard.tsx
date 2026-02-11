
import React, { useState, useEffect } from 'react';
import { User, Quiz, QuizAttempt, ClassYear, Question } from '../types';
import { Card } from './Card';
import { Button } from './Button';
import { generateAIQuizQuestions } from '../services/geminiService';
import { api } from '../services/api';
import * as XLSX from 'xlsx';

interface AdminDashboardProps {
  onLogout: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  onLogout
}) => {
  const [users, setUsers] = useState<User[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<'quizzes' | 'users' | 'results'>('quizzes');
  const [showCreateQuiz, setShowCreateQuiz] = useState(false);
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [creationMode, setCreationMode] = useState<'ai' | 'manual'>('ai');
  const [isGenerating, setIsGenerating] = useState(false);

  const [selectedUserForHistory, setSelectedUserForHistory] = useState<User | null>(null);
  const [viewingAttemptDetails, setViewingAttemptDetails] = useState<QuizAttempt | null>(null);

  const [quizTopic, setQuizTopic] = useState('');
  const [quizDesc, setQuizDesc] = useState('');
  const [quizClass, setQuizClass] = useState<ClassYear>('1st Year');
  const [quizTiming, setQuizTiming] = useState(30);
  const [maxAttempts, setMaxAttempts] = useState(1);
  const [quizCount, setQuizCount] = useState(10);

  // Manual Creation States
  const [manualQuestions, setManualQuestions] = useState<Question[]>([]);
  const [isAddingManual, setIsAddingManual] = useState(true);
  const [currentManual, setCurrentManual] = useState({ text: '', options: ['', '', '', ''], correct: 0 });

  const [userName, setUserName] = useState('');
  const [userRegNo, setUserRegNo] = useState('');
  const [userClass, setUserClass] = useState<ClassYear>('1st Year');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [u, q, a] = await Promise.all([
        api.users.getAll(),
        api.quizzes.getAll(),
        api.attempts.getAll()
      ]);
      setUsers(u);
      setQuizzes(q);
      setAttempts(a);
    } catch (e) {
      console.error(e);
      alert('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setShowCreateQuiz(false);
    setQuizTopic('');
    setQuizDesc('');
    setManualQuestions([]);
    setIsAddingManual(true);
    setIsGenerating(false);
  };

  const handleCreateAI = async () => {
    if (!quizTopic || !quizDesc) return alert('Please enter both Topic and Description');
    setIsGenerating(true);
    try {
      // 1. Generate questions via Gemini
      const questions = await generateAIQuizQuestions(quizTopic, quizDesc, quizCount, quizClass);

      const newQuiz: Quiz = {
        id: `q-${Date.now()}`,
        title: quizTopic,
        description: quizDesc,
        classYear: quizClass,
        questions: questions,
        durationMinutes: quizTiming,
        maxAttempts: maxAttempts,
        createdAt: new Date().toISOString()
      };

      // 2. Save to DB
      await api.quizzes.create(newQuiz);

      // 3. Refresh list
      await fetchData();
      resetForm();
    } catch (e) {
      console.error(e);
      alert('AI Generation or Save failed.');
    } finally {
      setIsGenerating(false);
    }
  };

  const addManualQuestion = () => {
    if (!currentManual.text || currentManual.options.some(o => !o)) return alert('Fill all fields');
    const q: Question = {
      id: `mq-${Date.now()}`,
      text: currentManual.text,
      options: [...currentManual.options],
      correctAnswer: currentManual.correct
    };
    setManualQuestions([...manualQuestions, q]);
    setCurrentManual({ text: '', options: ['', '', '', ''], correct: 0 });
    setIsAddingManual(false); // Switch to list view with "Add Another" button
  };

  const removeManualQuestion = (id: string) => {
    setManualQuestions(manualQuestions.filter(q => q.id !== id));
  };

  const saveManualQuiz = async () => {
    if (!quizTopic) return alert('Topic is required');
    if (manualQuestions.length === 0) return alert('Add at least one question');

    try {
      const newQuiz: Quiz = {
        id: `q-${Date.now()}`,
        title: quizTopic,
        description: quizDesc,
        classYear: quizClass,
        questions: manualQuestions,
        durationMinutes: quizTiming,
        maxAttempts: maxAttempts,
        createdAt: new Date().toISOString()
      };

      await api.quizzes.create(newQuiz);
      await fetchData();
      resetForm();
    } catch (e) {
      alert('Failed to save quiz');
    }
  };

  const handleAddUser = async () => {
    try {
      const newUser = {
        id: `u-${Date.now()}`, // Backend ignores this usually and generates, or uses it
        name: userName,
        registerNumber: userRegNo,
        password: '123456',
        classYear: userClass,
        role: 'STUDENT'
      };
      await api.auth.register(newUser);
      await fetchData();
      setShowCreateUser(false);
      setUserName('');
      setUserRegNo('');
    } catch (e: any) {
      alert('Failed to add user: ' + e.message);
    }
  };

  const exportYearlyReport = (year: ClassYear) => {
    const yearAttempts = attempts.filter(a => {
      const student = users.find(u => u.id === a.userId);
      return student?.classYear === year;
    });

    if (yearAttempts.length === 0) {
      alert(`No results found for ${year}`);
      return;
    }

    const reportData = yearAttempts.map(a => {
      const student = users.find(u => u.id === a.userId);
      const quiz = quizzes.find(q => q.id === a.quizId);
      return {
        'Student Name': student?.name || a.userName,
        'Register Number': student?.registerNumber || 'N/A',
        'Class': student?.classYear || year,
        'Quiz Topic': quiz?.title || 'Unknown Quiz',
        'Score': `${a.score} / ${a.totalQuestions}`,
        'Time Taken': `${Math.floor(a.timeTaken / 60)}m ${a.timeTaken % 60}s`,
        'Completed At': new Date(a.completedAt).toLocaleString()
      };
    });

    const worksheet = (XLSX.utils as any).json_to_sheet(reportData);
    const workbook = (XLSX.utils as any).book_new();
    (XLSX.utils as any).book_append_sheet(workbook, worksheet, "Results");
    XLSX.writeFile(workbook, `${year}_Report.xlsx`);
  };

  const getStudentAttempts = (userId: string) => {
    return attempts.filter(a => a.userId === userId).sort((a, b) =>
      new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
    );
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-slate-500">Loading Dashboard...</div>;

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col fixed h-full shadow-lg">
        <div className="p-6 border-b border-slate-800 flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 text-white rounded flex items-center justify-center font-bold">Q</div>
          <span className="text-white font-bold tracking-tight">ADMIN PANEL</span>
        </div>

        <nav className="flex-1 py-4">
          <button onClick={() => setActiveTab('quizzes')} className={`w-full text-left px-6 py-3 text-sm font-medium flex items-center gap-3 transition-colors ${activeTab === 'quizzes' ? 'bg-slate-800 text-white border-l-4 border-blue-500' : 'hover:bg-slate-800 hover:text-white'}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
            Quizzes
          </button>
          <button onClick={() => setActiveTab('users')} className={`w-full text-left px-6 py-3 text-sm font-medium flex items-center gap-3 transition-colors ${activeTab === 'users' ? 'bg-slate-800 text-white border-l-4 border-blue-500' : 'hover:bg-slate-800 hover:text-white'}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
            Students
          </button>
          <button onClick={() => setActiveTab('results')} className={`w-full text-left px-6 py-3 text-sm font-medium flex items-center gap-3 transition-colors ${activeTab === 'results' ? 'bg-slate-800 text-white border-l-4 border-blue-500' : 'hover:bg-slate-800 hover:text-white'}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2" /></svg>
            Analytics
          </button>
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button onClick={onLogout} className="w-full flex items-center gap-3 px-4 py-2 text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            Logout
          </button>
        </div>
      </aside>

      <main className="flex-1 ml-64 p-8">
        <div className="flex justify-between items-center mb-8 pb-6 border-b border-slate-200">
          <h2 className="text-2xl font-bold text-slate-800">
            {activeTab === 'quizzes' ? 'Quiz Management' : activeTab === 'users' ? 'Student Registry' : 'Assessment Analytics'}
          </h2>
          <div className="flex gap-4">
            {activeTab === 'quizzes' && <Button onClick={() => setShowCreateQuiz(true)}>+ New Quiz</Button>}
            {activeTab === 'users' && <Button onClick={() => setShowCreateUser(true)}>+ Add Student</Button>}
          </div>
        </div>

        {activeTab === 'quizzes' && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {quizzes.map(q => (
              <Card key={q.id}>
                <div className="flex justify-between mb-2">
                  <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded uppercase">{q.classYear}</span>
                  <span className="text-[10px] font-medium text-slate-400">Timer: {q.durationMinutes}m</span>
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-2">{q.title}</h3>
                <p className="text-sm text-slate-500 mb-4 line-clamp-2">{q.description}</p>
                <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
                  <span className="text-xs text-slate-400 font-medium">{q.questions.length} Questions</span>
                  <span className="text-xs text-slate-400 font-medium">Max Attempts: {q.maxAttempts}</span>
                </div>
              </Card>
            ))}
          </div>
        )}

        {activeTab === 'users' && (
          <div className="bg-white border border-slate-200 rounded-lg shadow-sm">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase">Name</th>
                  <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase">Reg No</th>
                  <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase">Class</th>
                  <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase">Quiz History</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <button
                        onClick={() => setSelectedUserForHistory(u)}
                        className="text-sm font-semibold text-blue-600 hover:text-blue-800 hover:underline text-left"
                      >
                        {u.name}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">{u.registerNumber}</td>
                    <td className="px-6 py-4 text-sm text-slate-500">{u.classYear}</td>
                    <td className="px-6 py-4">
                      <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-1 rounded cursor-pointer hover:bg-slate-200" onClick={() => setSelectedUserForHistory(u)}>
                        {attempts.filter(a => a.userId === u.id).length} Attempts
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'results' && (
          <div className="space-y-6">
            <div className="flex gap-4">
              <Button variant="outline" onClick={() => exportYearlyReport('1st Year')}>Export 1st Year</Button>
              <Button variant="outline" onClick={() => exportYearlyReport('2nd Year')}>Export 2nd Year</Button>
              <Button variant="outline" onClick={() => exportYearlyReport('3rd Year')}>Export 3rd Year</Button>
            </div>
            <div className="bg-white border border-slate-200 rounded-lg shadow-sm">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase">Student</th>
                    <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase">Quiz</th>
                    <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase">Score</th>
                    <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {attempts.map(a => (
                    <tr key={a.id}>
                      <td className="px-6 py-4 text-sm font-semibold text-slate-700">{a.userName}</td>
                      <td className="px-6 py-4 text-sm text-slate-500">{quizzes.find(q => q.id === a.quizId)?.title}</td>
                      <td className="px-6 py-4 text-sm font-bold text-blue-600">{a.score} / {a.totalQuestions}</td>
                      <td className="px-6 py-4 text-xs text-slate-400">{new Date(a.completedAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* MODAL: Student History with Question Breakdown */}
      {selectedUserForHistory && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-6 z-[100] backdrop-blur-sm">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
            <div className="p-6 border-b flex justify-between items-center bg-slate-50 rounded-t-lg">
              <div>
                <h3 className="text-xl font-bold text-slate-800">{selectedUserForHistory.name}'s Records</h3>
                <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">{selectedUserForHistory.registerNumber} | {selectedUserForHistory.classYear}</p>
              </div>
              <button onClick={() => { setSelectedUserForHistory(null); setViewingAttemptDetails(null); }} className="text-slate-400 hover:text-slate-600 text-xl">✕</button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {!viewingAttemptDetails ? (
                <div className="space-y-4">
                  {getStudentAttempts(selectedUserForHistory.id).length > 0 ? (
                    getStudentAttempts(selectedUserForHistory.id).map(attempt => {
                      const quiz = quizzes.find(q => q.id === attempt.quizId);
                      return (
                        <div key={attempt.id} className="border border-slate-200 rounded-lg p-5 flex justify-between items-center hover:bg-slate-50 transition-colors">
                          <div className="space-y-1">
                            <h4 className="font-bold text-slate-800">{quiz?.title || 'Unknown Quiz'}</h4>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                              Completed: {new Date(attempt.completedAt).toLocaleString()}
                            </p>
                          </div>
                          <div className="text-right flex items-center gap-6">
                            <div>
                              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Score</p>
                              <p className="text-2xl font-black text-blue-600">{attempt.score}<span className="text-sm text-slate-300">/{attempt.totalQuestions}</span></p>
                            </div>
                            <Button variant="outline" size="sm" onClick={() => setViewingAttemptDetails(attempt)} className="!text-[10px] !py-1.5 font-bold">Show Questions & Answers</Button>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="py-12 text-center text-slate-400 italic">No quiz attempts found for this student.</div>
                  )}
                </div>
              ) : (
                <div className="space-y-6">
                  <button onClick={() => setViewingAttemptDetails(null)} className="text-xs font-bold text-blue-600 flex items-center gap-2 hover:underline mb-4">
                    ← Back to Attempt List
                  </button>

                  <div className="bg-blue-50 p-5 rounded-lg border border-blue-100 mb-8 flex justify-between items-center">
                    <div>
                      <h4 className="font-bold text-blue-900 mb-1">Attempt Review</h4>
                      <p className="text-xs text-blue-700 font-bold uppercase tracking-widest">
                        Topic: {quizzes.find(q => q.id === viewingAttemptDetails.quizId)?.title}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-blue-900">Score: {viewingAttemptDetails.score} / {viewingAttemptDetails.totalQuestions}</p>
                      <p className="text-[10px] text-blue-700 font-medium">Time Taken: {Math.floor(viewingAttemptDetails.timeTaken / 60)}m {viewingAttemptDetails.timeTaken % 60}s</p>
                    </div>
                  </div>

                  <div className="space-y-8">
                    {quizzes.find(q => q.id === viewingAttemptDetails.quizId)?.questions.map((q, idx) => {
                      const studentAnswerIdx = viewingAttemptDetails.answers[q.id];
                      const isCorrect = studentAnswerIdx === q.correctAnswer;

                      return (
                        <div key={q.id} className="border border-slate-200 rounded-xl p-6 relative overflow-hidden">
                          <div className={`absolute top-0 left-0 bottom-0 w-1.5 ${isCorrect ? 'bg-green-500' : 'bg-red-500'}`}></div>

                          <div className="flex justify-between items-start mb-4">
                            <p className="font-bold text-slate-800 leading-relaxed"><span className="text-slate-300 mr-2">#{idx + 1}</span> {q.text}</p>
                            {isCorrect ? (
                              <span className="bg-green-100 text-green-700 text-[9px] font-black px-2 py-0.5 rounded uppercase">Correct</span>
                            ) : (
                              <span className="bg-red-100 text-red-700 text-[9px] font-black px-2 py-0.5 rounded uppercase">Incorrect</span>
                            )}
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {q.options.map((opt, optIdx) => {
                              const isStudentChoice = studentAnswerIdx === optIdx;
                              const isCorrectChoice = q.correctAnswer === optIdx;

                              let styles = "p-4 rounded-lg border text-sm flex justify-between items-center transition-all ";

                              if (isCorrectChoice) {
                                styles += "bg-green-50 border-green-300 text-green-800 ring-2 ring-green-100 ring-offset-1";
                              } else if (isStudentChoice && !isCorrect) {
                                styles += "bg-red-50 border-red-300 text-red-800 ring-2 ring-red-100 ring-offset-1";
                              } else {
                                styles += "bg-white border-slate-100 text-slate-500";
                              }

                              return (
                                <div key={optIdx} className={styles}>
                                  <div className="flex items-center gap-3">
                                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold border ${isCorrectChoice ? 'bg-green-500 text-white border-green-500' : isStudentChoice ? 'bg-red-500 text-white border-red-500' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>
                                      {String.fromCharCode(65 + optIdx)}
                                    </div>
                                    <span className="font-medium">{opt}</span>
                                  </div>
                                  {isStudentChoice && (
                                    <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${isCorrect ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}`}>
                                      Student Choice
                                    </span>
                                  )}
                                  {isCorrectChoice && !isStudentChoice && (
                                    <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded bg-green-200 text-green-800">
                                      Right Answer
                                    </span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t bg-slate-50 rounded-b-lg flex justify-end">
              <Button onClick={() => { setSelectedUserForHistory(null); setViewingAttemptDetails(null); }}>Close Records</Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Configure Quiz */}
      {showCreateQuiz && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-6 z-[100] backdrop-blur-sm">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-8 overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">Configure Quiz</h3>
              <button onClick={resetForm} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <div className="grid grid-cols-2 gap-6 mb-6">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Topic</label>
                <input value={quizTopic} onChange={e => setQuizTopic(e.target.value)} className="w-full p-3 border rounded border-slate-300 text-sm" placeholder="e.g. Java Programming" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Class Year</label>
                <select value={quizClass} onChange={e => setQuizClass(e.target.value as ClassYear)} className="w-full p-3 border rounded border-slate-300 text-sm">
                  <option>1st Year</option>
                  <option>2nd Year</option>
                  <option>3rd Year</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Time (Mins)</label>
                <input type="number" value={quizTiming} onChange={e => setQuizTiming(Number(e.target.value))} className="w-full p-3 border rounded border-slate-300 text-sm" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Attempts</label>
                <input type="number" value={maxAttempts} onChange={e => setMaxAttempts(Number(e.target.value))} className="w-full p-3 border rounded border-slate-300 text-sm" />
              </div>
            </div>

            <div className="space-y-1 mb-6">
              <label className="text-xs font-bold text-slate-500 uppercase">Description</label>
              <textarea value={quizDesc} onChange={e => setQuizDesc(e.target.value)} className="w-full p-3 border rounded border-slate-300 h-24 text-sm" placeholder="Brief about the quiz..."></textarea>
            </div>

            <div className="flex gap-4 mb-6">
              <button onClick={() => setCreationMode('ai')} className={`flex-1 p-2 text-xs font-bold border-b-2 ${creationMode === 'ai' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400'}`}>AI Generate</button>
              <button onClick={() => setCreationMode('manual')} className={`flex-1 p-2 text-xs font-bold border-b-2 ${creationMode === 'manual' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400'}`}>Manual Type</button>
            </div>

            {creationMode === 'manual' ? (
              <div className="space-y-4 mb-8">
                {/* Existing manual questions list */}
                {manualQuestions.map((mq, idx) => (
                  <div key={mq.id} className="p-4 bg-slate-50 border border-slate-200 rounded-lg flex justify-between items-center group">
                    <div className="flex-1 min-w-0 pr-4">
                      <p className="text-xs font-bold text-slate-800 truncate">{idx + 1}. {mq.text}</p>
                      <p className="text-[10px] text-slate-400 font-medium">{mq.options.length} options</p>
                    </div>
                    <button
                      onClick={() => removeManualQuestion(mq.id)}
                      className="text-slate-300 hover:text-red-500 transition-colors"
                      title="Remove Question"
                    >
                      ✕
                    </button>
                  </div>
                ))}

                {isAddingManual ? (
                  <div className="bg-white p-6 rounded-lg border-2 border-blue-100 shadow-sm space-y-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-blue-600 uppercase">New Question</label>
                      <input value={currentManual.text} onChange={e => setCurrentManual({ ...currentManual, text: e.target.value })} className="w-full p-3 border rounded text-sm focus:ring-1 focus:ring-blue-500" placeholder="Enter Question Text" />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      {currentManual.options.map((opt, i) => (
                        <div key={i} className="space-y-1">
                          <label className="text-[9px] font-bold text-slate-400 uppercase">Option {String.fromCharCode(65 + i)}</label>
                          <input value={opt} onChange={e => {
                            const n = [...currentManual.options]; n[i] = e.target.value;
                            setCurrentManual({ ...currentManual, options: n });
                          }} className="w-full p-2 border rounded text-xs focus:ring-1 focus:ring-blue-500" placeholder={`Option ${i + 1}`} />
                        </div>
                      ))}
                    </div>

                    <div className="flex justify-between items-end gap-4 pt-2">
                      <div className="flex-1 space-y-1">
                        <label className="text-[9px] font-bold text-slate-400 uppercase">Correct Answer</label>
                        <select value={currentManual.correct} onChange={e => setCurrentManual({ ...currentManual, correct: Number(e.target.value) })} className="w-full p-2 border rounded text-xs">
                          <option value={0}>Option A is Correct</option>
                          <option value={1}>Option B is Correct</option>
                          <option value={2}>Option C is Correct</option>
                          <option value={3}>Option D is Correct</option>
                        </select>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => { setIsAddingManual(false); setCurrentManual({ text: '', options: ['', '', '', ''], correct: 0 }); }} className="!text-[10px] !py-2">Cancel</Button>
                        <Button variant="secondary" size="sm" onClick={addManualQuestion} className="!text-[10px] !py-2 px-6">Save Question</Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setIsAddingManual(true)}
                    className="w-full py-4 border-2 border-dashed border-slate-200 rounded-lg text-slate-400 font-bold text-xs hover:border-blue-400 hover:text-blue-500 hover:bg-blue-50 transition-all flex items-center justify-center gap-2"
                  >
                    <span className="text-lg">+</span> Add Another Question
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-1 mb-6">
                <label className="text-xs font-bold text-slate-500 uppercase">Question Count</label>
                <input type="number" value={quizCount} onChange={e => setQuizCount(Number(e.target.value))} className="w-full p-3 border rounded border-slate-300 text-sm" />
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t sticky bottom-0 bg-white">
              <Button variant="ghost" onClick={resetForm}>Cancel</Button>
              {creationMode === 'ai' ? (
                <Button isLoading={isGenerating} onClick={handleCreateAI}>Generate AI Quiz</Button>
              ) : (
                <Button onClick={saveManualQuiz} disabled={manualQuestions.length === 0}>Complete Quiz Setup</Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Add User */}
      {showCreateUser && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-6 z-[100] backdrop-blur-sm">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-8">
            <h3 className="text-xl font-bold mb-6">Add New Student</h3>
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Student Name</label>
                <input value={userName} onChange={e => setUserName(e.target.value)} className="w-full p-3 border rounded border-slate-300 text-sm" placeholder="Full Name" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Reg Number</label>
                <input value={userRegNo} onChange={e => setUserRegNo(e.target.value.toUpperCase())} className="w-full p-3 border rounded border-slate-300 text-sm" placeholder="e.g. CS24001" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Class Level</label>
                <select value={userClass} onChange={e => setUserClass(e.target.value as ClassYear)} className="w-full p-3 border rounded border-slate-300 text-sm">
                  <option>1st Year</option>
                  <option>2nd Year</option>
                  <option>3rd Year</option>
                </select>
              </div>
              <p className="text-[10px] text-slate-400 italic">Default password will be set to '123456'.</p>
              <div className="flex gap-3 pt-6">
                <Button variant="ghost" onClick={() => setShowCreateUser(false)} className="flex-1">Cancel</Button>
                <Button onClick={handleAddUser} className="flex-1">Add Student</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
