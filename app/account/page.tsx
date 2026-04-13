"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../hooks/useAuth';
import { loginUser, registerUser } from '../../lib/apiClient';
import { Footer } from '../components/ui';
import { Spinner } from '../components/ui/Spinner';

export default function AccountPage() {
  const { user, login, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();

  const [currentView, setCurrentView] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [referrer, setReferrer] = useState('');
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isAuthLoading && user) {
      router.push('/dashboard');
    }
  }, [user, isAuthLoading, router]);

  const resetFormFields = () => {
    setUsername('');
    setPassword('');
    setConfirmPassword('');
    setReferrer('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedbackMessage(null);
    setIsSuccess(false);
    setIsSubmitting(true);

    try {
      if (currentView === 'login') {
        if (!username.trim() || !password.trim()) {
          throw new Error('Please enter both username and password.');
        }
        const data = await loginUser({ username, password });
        login(data.token);
      } else {
        if (!username.trim() || !password.trim() || !confirmPassword.trim()) {
          throw new Error('Please fill in all required fields.');
        }
        if (password !== confirmPassword) {
          throw new Error('Passwords do not match.');
        }
        if (password.length < 8) {
          throw new Error('Password must be at least 8 characters long.');
        }

        await registerUser({ username, password, confirmPassword, referrer: referrer.trim() || undefined });

        setFeedbackMessage('Registration successful! Please log in.');
        setIsSuccess(true);
        setCurrentView('login');
        resetFormFields();
      }
    } catch (error: any) {
      setFeedbackMessage(error.message || 'An unexpected error occurred.');
      setIsSuccess(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isAuthLoading || user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <Spinner size="lg" className="text-[var(--text-tertiary)]" />
        <p className="mt-4 text-sm text-[var(--text-secondary)]">Loading account...</p>
      </div>
    );
  }

  const inputClasses =
    'w-full rounded-xl px-4 py-3 text-sm [color-scheme:dark] bg-white/[0.06] border border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:ring-2 focus:ring-[var(--accent)]/35 focus:border-[var(--accent)]/50 focus:outline-none transition';

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-grow flex items-center justify-center px-4 py-12 sm:py-20">
        <main className="w-full max-w-sm animate-fade-up">
          {/* Tab Switcher */}
          <div className="flex mb-6 glass overflow-hidden">
            <button
              onClick={() => { setCurrentView('login'); setFeedbackMessage(null); resetFormFields(); }}
              className={`flex-1 py-3 text-sm font-semibold transition-all cursor-pointer ${currentView === 'login'
                ? 'bg-[var(--accent)] text-[var(--text-on-accent)]'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/[0.06]'
                }`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setCurrentView('register'); setFeedbackMessage(null); resetFormFields(); }}
              className={`flex-1 py-3 text-sm font-semibold transition-all cursor-pointer ${currentView === 'register'
                ? 'bg-[var(--accent)] text-[var(--text-on-accent)]'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/[0.06]'
                }`}
            >
              Register
            </button>
          </div>

          {/* Form Card */}
          <div className="glass p-6 sm:p-8">
            <h1 className="text-2xl font-bold text-[var(--text-primary)] text-center mb-6">
              {currentView === 'login' ? 'Welcome back' : 'Create account'}
            </h1>

            {feedbackMessage && (
              <div className={`p-3 mb-5 rounded-xl text-center text-sm ${isSuccess
                ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                : 'bg-red-500/10 border border-red-500/20 text-red-400'
                }`}>
                {feedbackMessage}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="username" className="text-label block mb-2">Username</label>
                <input
                  type="text"
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className={inputClasses}
                  placeholder="Enter username"
                  required
                />
              </div>
              <div>
                <label htmlFor="password" className="text-label block mb-2">Password</label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={inputClasses}
                  placeholder="Enter password"
                  required
                />
              </div>

              {currentView === 'register' && (
                <>
                  <div>
                    <label htmlFor="confirm-password" className="text-label block mb-2">Confirm Password</label>
                    <input
                      type="password"
                      id="confirm-password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className={inputClasses}
                      placeholder="Confirm password"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="referrer" className="text-label block mb-2">Referrer <span className="text-[var(--text-tertiary)]">(optional)</span></label>
                    <input
                      type="text"
                      id="referrer"
                      value={referrer}
                      onChange={(e) => setReferrer(e.target.value)}
                      className={inputClasses}
                      placeholder="Referral code or username"
                    />
                  </div>
                </>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="btn btn-primary w-full py-3 text-base mt-2"
              >
                {isSubmitting ? (
                  <><Spinner size="sm" className="text-white" /> Processing...</>
                ) : (
                  currentView === 'login' ? 'Sign In' : 'Create Account'
                )}
              </button>
            </form>
          </div>
        </main>
      </div>

      <Footer />
    </div>
  );
}