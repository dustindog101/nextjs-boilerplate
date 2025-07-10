// --- START OF FILE app/account/page.tsx (Fully Edited) ---

"use client";
import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth'; // Import our custom hook
import { loginUser, registerUser } from '../../lib/apiClient'; // Import our new API client functions

// --- SVG Icons ---
const BackArrowIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 h-5 w-5"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>;

// --- Main Account Page Component ---
export default function AccountPage() {
  // Global auth state from our context
  const { user, login, isLoading: isAuthLoading } = useAuth();

  // Local state for this page's form
  const [currentView, setCurrentView] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [referrer, setReferrer] = useState('');
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Effect to redirect if the user is already logged in
  useEffect(() => {
    if (!isAuthLoading && user) {
      window.location.href = '/dashboard';
    }
  }, [user, isAuthLoading]);

  const resetFormFields = () => {
    setUsername('');
    setPassword('');
    setConfirmPassword('');
    setReferrer('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedbackMessage(null);
    setIsSubmitting(true);

    try {
      if (currentView === 'login') {
        if (!username.trim() || !password.trim()) {
          throw new Error('Please enter both username and password.');
        }
        const data = await loginUser({ username, password });
        login(data.token); // This updates global state and handles storage
        // The useEffect above will now handle the redirect
      } else { // Registration logic
        if (!username.trim() || !password.trim() || !confirmPassword.trim()) {
          throw new Error('Please fill in all required fields.');
        }
        if (password !== confirmPassword) {
          throw new Error('Passwords do not match.');
        }
        if (password.length < 8) {
          throw new Error('Password must be at least 8 characters long.');
        }
        
        // THIS IS THE CORRECTED CALL, PASSING confirmPassword
        await registerUser({ username, password, confirmPassword, referrer: referrer.trim() || undefined });
        
        setFeedbackMessage('Registration successful! Please log in.');
        setCurrentView('login');
        resetFormFields();
      }
    } catch (error: any) {
      // The error message is thrown from our apiClient
      setFeedbackMessage(error.message || 'An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // If auth is still being checked or if the user is logged in and about to be redirected, show a loader.
  if (isAuthLoading || user) {
    return (
      <div className="bg-gray-900 min-h-screen flex flex-col items-center justify-center">
        <svg className="animate-spin h-10 w-10 text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
        <p className="mt-4 text-xl text-gray-300">Loading account...</p>
      </div>
    );
  }

  // Render the Login/Register form if not loading and not logged in
  return (
    <div className="bg-gray-900 min-h-screen text-gray-200 flex flex-col items-center justify-center p-4 font-inter">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Uncial+Antiqua&family=Inter:wght@400;500;700&display=swap');
        .font-pirate-special { font-family: 'Uncial Antiqua', cursive; }
        .font-inter { font-family: 'Inter', sans-serif; }
      `}</style>

      <div className="absolute top-4 left-4">
        <a href="/" className="flex items-center justify-center bg-gray-700/50 hover:bg-gray-700 text-gray-300 font-semibold py-2 px-4 rounded-lg transition-colors duration-300 shadow-md">
          <BackArrowIcon /> Back to Home
        </a>
      </div>

      <main className="w-full max-w-md bg-gray-800 p-8 rounded-lg shadow-xl border border-gray-700">
        <h1 className="font-pirate-special text-5xl md:text-6xl font-bold text-white tracking-wider text-center mb-6">
          Account
        </h1>
        
        <div className="flex justify-center gap-4 mb-8">
          <button onClick={() => { setCurrentView('login'); setFeedbackMessage(null); resetFormFields(); }} className={`px-6 py-2 rounded-lg font-semibold transition ${currentView === 'login' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}>
            Login
          </button>
          <button onClick={() => { setCurrentView('register'); setFeedbackMessage(null); resetFormFields(); }} className={`px-6 py-2 rounded-lg font-semibold transition ${currentView === 'register' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}>
            Register
          </button>
        </div>

        {feedbackMessage && (
          <div className={`p-3 mb-4 rounded-lg text-center ${feedbackMessage.includes('successful') ? 'bg-green-600' : 'bg-red-600'} text-white`}>
            {feedbackMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-400 mb-1">Username</label>
              <input type="text" id="username" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500" placeholder="Your username" required />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-400 mb-1">Password</label>
              <input type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500" placeholder="Your password" required />
            </div>

            {currentView === 'register' && (
              <>
                <div>
                  <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-400 mb-1">Confirm Password</label>
                  <input type="password" id="confirm-password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500" placeholder="Confirm your password" required />
                </div>
                <div>
                  <label htmlFor="referrer" className="block text-sm font-medium text-gray-400 mb-1">Referrer (Optional)</label>
                  <input type="text" id="referrer" value={referrer} onChange={(e) => setReferrer(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500" placeholder="Referral code or username" />
                </div>
              </>
            )}

            <button type="submit" disabled={isSubmitting} className={`w-full font-bold py-3 px-8 rounded-lg text-lg transition-colors shadow-lg flex items-center justify-center disabled:bg-gray-500 disabled:cursor-not-allowed ${currentView === 'login' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-green-600 hover:bg-green-700'}`}>
              {isSubmitting ? <svg className="animate-spin h-5 w-5 mr-3 text-white" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> : (currentView === 'login' ? 'Login' : 'Register')}
            </button>
        </form>
      </main>

      <footer className="absolute bottom-4 text-gray-500 text-sm">
        © {new Date().getFullYear()} ID Pirate. All rights reserved.
      </footer>
    </div>
  );
}

// --- END OF FILE app/account/page.tsx (Fully Edited) ---