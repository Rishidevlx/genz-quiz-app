
import React, { useState } from 'react';
import { User } from '../types';
import { Button } from './Button';
import { Card } from './Card';
import { api } from '../services/api';

interface LoginProps {
  onLogin: (user: User) => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      // Use the API service to login
      // The API now accepts either registerNumber or email as the first argument
      const user = await api.auth.login(identifier, password);
      onLogin(user);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Login failed. Please checks your credentials.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-100">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600 text-white rounded-lg mx-auto flex items-center justify-center font-bold text-3xl shadow-md mb-4">
            Q
          </div>
          <h1 className="text-2xl font-bold text-slate-800">AI Quiz Portal</h1>
          <p className="text-slate-500 text-sm mt-1">Computer Science Department</p>
        </div>

        <Card className="shadow-lg border-none">
          <form onSubmit={handleLogin} className="space-y-6">
            {error && (
              <div className="bg-red-50 text-red-700 p-3 rounded border border-red-200 text-xs font-medium">
                {error}
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Email / Register Number</label>
              <input
                type="text"
                className="w-full px-4 py-3 rounded border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder:text-slate-400"
                placeholder="Enter identifier"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Password</label>
              <input
                type="password"
                className="w-full px-4 py-3 rounded border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder:text-slate-400"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <Button type="submit" className="w-full py-3">
              Login to Account
            </Button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-400">
              Only authorized staff and students can access.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};
