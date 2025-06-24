"use client";
import React, { useState, useEffect } from 'react';

// --- SVG Icons ---
const LockIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 h-4 w-4">
    <rect width="18" height="11" x="3" y="11" rx="2" ry="2"></rect>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
  </svg>
);

const DocumentIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 h-5 w-5">
        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
        <polyline points="14 2 14 8 20 8"></polyline>
    </svg>
);

const BoxIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 h-5 w-5">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
        <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
        <line x1="12" y1="22.08" x2="12" y2="12"></line>
    </svg>
);

const CloseIcon = ({ onClick }) => (
    <button onClick={onClick} className="absolute top-4 right-4 text-gray-400 hover:text-white transition">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
    </button>
);


// --- Components ---

// Notification Toast Component
const Notification = ({ message, show }) => {
    if (!show) return null;
    return (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 bg-red-500 text-white py-2 px-5 rounded-lg shadow-lg animate-fade-in-out">
            {message}
        </div>
    );
};

// Login Modal Component
const LoginModal = ({ show, onClose, onLogin }) => {
    if (!show) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        onLogin(); // This will trigger the "Authentication Failed" message
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 animate-fade-in">
            <div className="bg-gray-800 rounded-lg shadow-xl p-8 w-full max-w-sm relative border border-gray-700">
                <CloseIcon onClick={onClose} />
                <h2 className="text-2xl font-bold text-white mb-6 text-center">Admin Login</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2" htmlFor="username">Username</label>
                        <input type="text" id="username" className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2" htmlFor="password">Password</label>
                        <input type="password" id="password" className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors">
                        Login
                    </button>
                </form>
            </div>
        </div>
    );
};

// Main App Component
export default function App() {
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [notification, setNotification] = useState({ show: false, message: '' });

    const showNotification = (message) => {
        setNotification({ show: true, message });
        setTimeout(() => {
            setNotification({ show: false, message: '' });
        }, 3000); // Hide after 3 seconds
    };

    const handleAdminLoginClick = () => {
        setShowLoginModal(true);
    };

    const handleOrderClick = () => {
        showNotification("You must be logged in to place an order.");
    };

    const handleLoginSubmit = () => {
        setShowLoginModal(false); // Close the modal
        showNotification("Authentication Failed"); // Show error message
    };

    return (
        <div className="bg-gray-900 min-h-screen flex flex-col items-center justify-center p-4 text-center text-gray-200 font-sans">
            <style>
            {`
                @import url('https://fonts.googleapis.com/css2?family=Uncial+Antiqua&family=Inter:wght@400;500;700&display=swap');
                .font-pirate-special {
                    font-family: 'Uncial Antiqua', cursive;
                }
                @keyframes fade-in {
                    from { opacity: 0; transform: scale(0.95); }
                    to { opacity: 1; transform: scale(1); }
                }
                @keyframes fade-in-out {
                    0% { opacity: 0; transform: translateY(20px) translateX(-50%); }
                    15% { opacity: 1; transform: translateY(0) translateX(-50%); }
                    85% { opacity: 1; transform: translateY(0) translateX(-50%); }
                    100% { opacity: 0; transform: translateY(20px) translateX(-50%); }
                }
                .animate-fade-in { animation: fade-in 0.3s ease-out forwards; }
                .animate-fade-in-out { animation: fade-in-out 3s ease-in-out forwards; }
            `}
            </style>

            <LoginModal 
                show={showLoginModal} 
                onClose={() => setShowLoginModal(false)} 
                onLogin={handleLoginSubmit} 
            />

            <Notification message={notification.message} show={notification.show} />

            <div className="absolute top-4 right-4">
                <button onClick={handleAdminLoginClick} className="flex items-center justify-center bg-gray-700/50 hover:bg-gray-700 text-gray-300 font-semibold py-2 px-4 rounded-lg transition-colors duration-300 shadow-md">
                    <LockIcon />
                    Admin Login
                </button>
            </div>

            <main className="flex flex-col items-center">
                <h1 className="font-pirate-special text-7xl md:text-8xl font-bold text-white tracking-wider mb-4">
                    ID Pirate
                </h1>
                <p className="mt-4 text-xl md:text-2xl text-yellow-400/80 bg-gray-800/50 px-4 py-2 rounded-md tracking-widest shadow-lg">
                    UNDER CONSTRUCTION
                </p>
                <p className="mt-2 text-lg text-gray-400">
                    Our new website is launching soon.
                </p>

                <div className="mt-12 flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-6">
                    <a href="/track" className="flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg transition-colors duration-300 text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 w-full">
                        <DocumentIcon />
                        Track
                    </a>
                    <button onClick={handleOrderClick} className="flex items-center justify-center bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-lg transition-colors duration-300 text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1">
                        <BoxIcon />
                        Order
                    </button>
                </div>
            </main>

            <footer className="absolute bottom-4 text-gray-500 text-sm">
                &copy; {new Date().getFullYear()} ID Pirate. All rights reserved.
            </footer>
        </div>
    );
}
