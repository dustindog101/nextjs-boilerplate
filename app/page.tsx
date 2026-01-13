"use client";
import React, { useState } from 'react';
import { LockIcon, DocumentIcon, BoxIcon, CloseIcon } from './components/icons';
import { Notification, Footer } from './components/ui';

// --- Login Modal Component ---
interface LoginModalProps {
    show: boolean;
    onClose: () => void;
    onLogin: () => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ show, onClose, onLogin }) => {
    if (!show) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onLogin();
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 animate-fade-in">
            <div className="bg-gray-800 rounded-lg shadow-xl p-8 w-full max-w-sm relative border border-gray-700">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-white transition"
                >
                    <CloseIcon className="h-6 w-6" />
                </button>
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

// --- Main App Component ---
export default function HomePage() {
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [notification, setNotification] = useState({ show: false, message: '' });

    const showNotificationMessage = (message: string) => {
        setNotification({ show: true, message });
        setTimeout(() => {
            setNotification({ show: false, message: '' });
        }, 3000);
    };

    const handleAdminLoginClick = () => {
        setShowLoginModal(true);
    };

    const handleLoginSubmit = () => {
        setShowLoginModal(false);
        showNotificationMessage("Authentication Failed");
    };

    return (
        <div className="bg-gray-900 min-h-screen flex flex-col items-center justify-center p-4 text-center text-gray-200 font-sans">
            <LoginModal
                show={showLoginModal}
                onClose={() => setShowLoginModal(false)}
                onLogin={handleLoginSubmit}
            />

            <Notification message={notification.message} show={notification.show} />

            <div className="absolute top-4 right-4">
                <button onClick={handleAdminLoginClick} className="flex items-center justify-center bg-gray-700/50 hover:bg-gray-700 text-gray-300 font-semibold py-2 px-4 rounded-lg transition-colors duration-300 shadow-md">
                    <LockIcon className="mr-2 h-4 w-4" />
                    Admin Login
                </button>
            </div>

            <main className="flex flex-col items-center">
                <h1 className="font-pirate text-7xl md:text-8xl font-bold text-white tracking-wider mb-4">
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
                        <DocumentIcon className="mr-2 h-5 w-5" />
                        Track
                    </a>

                    <a href="/order" className="flex items-center justify-center bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-lg transition-colors duration-300 text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1">
                        <BoxIcon className="mr-2 h-5 w-5" />
                        Order
                    </a>
                </div>
            </main>

            <Footer className="absolute bottom-4" />
        </div>
    );
}
