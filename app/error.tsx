"use client";
import React from 'react';

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return (
        <div className="min-h-screen flex items-center justify-center px-4">
            <div className="glass p-8 sm:p-10 max-w-md w-full text-center animate-fade-up">
                <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center">
                    <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                </div>
                <h2 className="text-xl font-bold text-slate-900 mb-2">Something went wrong</h2>
                <p className="text-sm text-slate-500 mb-6">
                    {error.message || 'An unexpected error occurred.'}
                </p>
                <button
                    onClick={reset}
                    className="btn btn-primary px-6 py-2.5 text-sm"
                >
                    Try Again
                </button>
            </div>
        </div>
    );
}
