"use client";
import React, { useState, useEffect } from 'react';

// --- Interface for JWT Payload (simplified for this example) ---
interface JwtPayload {
  userId: string;
  username: string;
  exp: number; // Expiration timestamp in seconds
}

// --- SVG Icons (reused or simplified) ---
const BackArrowIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 h-5 w-5">
    <line x1="19" y1="12" x2="5" y2="12"></line>
    <polyline points="12 19 5 12 12 5"></polyline>
  </svg>
);

const UserIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 mr-2">
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
    <circle cx="12" cy="7" r="4"></circle>
  </svg>
);


// --- Main Account Page Component ---
export default function AccountPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentView, setCurrentView] = useState<'login' | 'register'>('login'); // 'login' or 'register'
  
  // Form states (unified for cleaner handling)
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState(''); // Used for registration
  const [referrer, setReferrer] = useState(''); // Optional for registration

  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loggedInUsername, setLoggedInUsername] = useState<string | null>(null); // To display logged-in user

  // --- Lambda Function URL for the Consolidated Auth Handler ---
  // !!! IMPORTANT: REPLACE THIS WITH YOUR ACTUAL CONSOLIDATED AUTH LAMBDA URL !!!
  const AUTH_LAMBDA_URL = 'YOUR_AUTH_LAMBDA_URL_HERE'; 
  // Example: 'https://your-auth-handler.lambda-url.us-east-1.on.aws/'

  // --- Utility function to decode JWT (simple, for display purposes) ---
  const decodeJwt = (token: string): JwtPayload | null => {
    try {
      const payloadBase64 = token.split('.')[1];
      const decoded = JSON.parse(atob(payloadBase64));
      return decoded;
    } catch (error) {
      console.error('Failed to decode JWT:', error);
      return null;
    }
  };

  // --- Check login status on component mount ---
  useEffect(() => {
    const token = localStorage.getItem('idPirateAuthToken');
    if (token) {
      const decoded = decodeJwt(token);
      if (decoded && decoded.exp * 1000 > Date.now()) { // exp is in seconds, convert to ms
        setIsLoggedIn(true);
        setLoggedInUsername(decoded.username);
      } else {
        localStorage.removeItem('idPirateAuthToken'); // Token expired or invalid
      }
    }
  }, []);

  // --- Reset form fields ---
  const resetFormFields = () => {
    setUsername('');
    setPassword('');
    setConfirmPassword('');
    setReferrer('');
  };

  // --- Generic form submission handler for both Login and Register ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedbackMessage(null);
    setIsLoading(true);

    let payload: any = { username, password };
    let lambdaRequestType: 'login' | 'register';

    // Validation and Payload for Registration
    if (currentView === 'register') {
      lambdaRequestType = 'register';
      if (!username.trim() || !password.trim() || !confirmPassword.trim()) {
        setFeedbackMessage('Please fill in all required fields.');
        setIsLoading(false);
        return;
      }
      if (password !== confirmPassword) {
        setFeedbackMessage('Passwords do not match.');
        setIsLoading(false);
        return;
      }
      if (password.length < 8) { // Minimum password length validation
        setFeedbackMessage('Password must be at least 8 characters long.');
        setIsLoading(false);
        return;
      }
      payload.referrer = referrer.trim() || undefined; // Only send if not empty
    } 
    // Validation and Payload for Login
    else { // currentView === 'login'
      lambdaRequestType = 'login';
      if (!username.trim() || !password.trim()) {
        setFeedbackMessage('Please enter both username and password.');
        setIsLoading(false);
        return;
      }
    }

    // Add requestType to the payload for the consolidated Lambda
    payload.requestType = lambdaRequestType;

    try {
      const response = await fetch(AUTH_LAMBDA_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        mode: 'cors',
      });

      const data = await response.json();

      if (response.ok) {
        if (lambdaRequestType === 'login') {
          if (data.token) {
            localStorage.setItem('idPirateAuthToken', data.token);
            const decoded = decodeJwt(data.token);
            if (decoded) {
              setIsLoggedIn(true);
              setLoggedInUsername(decoded.username);
              setFeedbackMessage('Login successful!');
              // Clear form fields
              resetFormFields();
              // Optional: redirect to a protected page
              // window.location.href = '/order/new'; 
            } else {
              setFeedbackMessage('Login successful, but token decoding failed.');
            }
          } else {
            setFeedbackMessage('Login failed: No token received.');
          }
        } else { // Registration successful
          setFeedbackMessage('Registration successful! Please log in.');
          setCurrentView('login'); // Switch to login form
          resetFormFields();
        }
      } else {
        setFeedbackMessage(data.error || `${lambdaRequestType} failed. Please try again.`);
      }
    } catch (error: any) {
      console.error(`${lambdaRequestType} Network Error:`, error);
      setFeedbackMessage(`Network error during ${lambdaRequestType}: ${error.message || 'Please check your connection.'}`);
    } finally {
      setIsLoading(false);
    }
  };

  // --- Handle User Logout ---
  const handleLogout = () => {
    localStorage.removeItem('idPirateAuthToken');
    setIsLoggedIn(false);
    setLoggedInUsername(null);
    setFeedbackMessage('You have been logged out.');
    resetFormFields(); // Clear fields on logout
    setCurrentView('login'); // Return to login view
    // Optional: redirect to home page
    // window.location.href = '/'; 
  };

  return (
    <div className="bg-gray-900 min-h-screen text-gray-200 flex flex-col items-center justify-center p-4 font-inter">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Uncial+Antiqua&family=Inter:wght@400;500;700&display=swap');
        .font-pirate-special { font-family: 'Uncial Antiqua', cursive; }
        .font-inter { font-family: 'Inter', sans-serif; }
      `}</style>

      {/* Back Button */}
      <div className="absolute top-4 left-4">
        <a href="/" className="flex items-center justify-center bg-gray-700/50 hover:bg-gray-700 text-gray-300 font-semibold py-2 px-4 rounded-lg transition-colors duration-300 shadow-md">
          <BackArrowIcon />
          Back to Home
        </a>
      </div>

      <main className="w-full max-w-md bg-gray-800 p-8 rounded-lg shadow-xl border border-gray-700">
        <h1 className="font-pirate-special text-5xl md:text-6xl font-bold text-white tracking-wider text-center mb-6">
          Account
        </h1>

        {isLoggedIn ? (
          /* --- Logged In View --- */
          <div className="text-center">
            <h2 className="text-2xl font-bold text-green-400 flex items-center justify-center mb-4">
              <UserIcon /> Welcome, {loggedInUsername}!
            </h2>
            <p className="text-gray-300 mb-6">You are securely logged in.</p>
            
            <button 
              onClick={handleLogout}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-8 rounded-lg text-lg transition-colors shadow-lg"
            >
              Logout
            </button>
            {/* Future: Link to 'My Orders' etc. */}
            <p className="mt-4 text-gray-400">
              <a href="/user-orders" className="text-blue-400 hover:underline">View My Orders</a> {/* Placeholder for user-specific orders page */}
            </p>
          </div>
        ) : (
          /* --- Login/Register Forms --- */
          <>
            {/* View Toggler */}
            <div className="flex justify-center gap-4 mb-8">
              <button
                onClick={() => { setCurrentView('login'); setFeedbackMessage(null); resetFormFields(); }}
                className={`px-6 py-2 rounded-lg font-semibold transition ${currentView === 'login' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
              >
                Login
              </button>
              <button
                onClick={() => { setCurrentView('register'); setFeedbackMessage(null); resetFormFields(); }}
                className={`px-6 py-2 rounded-lg font-semibold transition ${currentView === 'register' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
              >
                Register
              </button>
            </div>

            {/* Feedback Message */}
            {feedbackMessage && (
              <div className={`p-3 mb-4 rounded-lg text-center ${feedbackMessage.includes('successful') ? 'bg-green-600' : 'bg-red-600'} text-white`}>
                {feedbackMessage}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="username" className="block text-sm font-medium text-gray-400 mb-1">Username</label>
                  <input
                    type="text"
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500"
                    placeholder="Your username"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-400 mb-1">Password</label>
                  <input
                    type="password"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500"
                    placeholder="Your password"
                    required
                  />
                </div>

                {currentView === 'register' && (
                  <>
                    <div>
                      <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-400 mb-1">Confirm Password</label>
                      <input
                        type="password"
                        id="confirm-password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500"
                        placeholder="Confirm your password"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="referrer" className="block text-sm font-medium text-gray-400 mb-1">Referrer (Optional)</label>
                      <input
                        type="text"
                        id="referrer"
                        value={referrer}
                        onChange={(e) => setReferrer(e.target.value)}
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500"
                        placeholder="Referral code or username"
                      />
                    </div>
                  </>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className={`w-full font-bold py-3 px-8 rounded-lg text-lg transition-colors shadow-lg flex items-center justify-center disabled:bg-gray-500 disabled:cursor-not-allowed
                    ${currentView === 'login' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-green-600 hover:bg-green-700'}`}
                >
                  {isLoading ? (
                    <svg className="animate-spin h-5 w-5 mr-3 text-white" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  ) : (
                    currentView === 'login' ? 'Login' : 'Register'
                  )}
                </button>
            </form>
          </>
        )}
      </main>

      <footer className="absolute bottom-4 text-gray-500 text-sm">
        &copy; {new Date().getFullYear()} ID Pirate. All rights reserved.
      </footer>
    </div>
  );
}
