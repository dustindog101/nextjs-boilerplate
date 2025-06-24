"use client";
import React, { useState } from 'react';

// --- Type definition for the possible order statuses ---
type OrderStatus = 'in_progress' | 'shipped' | 'not_found' | null;

// In a real Next.js app, you would add the Google Fonts link to your layout.js or _document.js file's <head> tag:
// <link href="https://fonts.googleapis.com/css2?family=Uncial+Antiqua&family=Inter:wght@400;500;700&display=swap" rel="stylesheet">

// --- SVG Icons ---
const SearchIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 h-5 w-5">
        <circle cx="11" cy="11" r="8"></circle>
        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
    </svg>
);

const ShippingIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-blue-400">
        <path d="M5 18H3c-.6 0-1-.4-1-1V7c0-.6.4-1 1-1h10c.6 0 1 .4 1 1v11"></path>
        <path d="M14 9h7c.6 0 1 .4 1 1v10c0 .6-.4 1-1 1h-7c-.6 0-1-.4-1-1V10c0-.6.4-1 1-1Z"></path>
        <path d="M12 12H4"></path>
        <path d="m19 17-2.4-2.4"></path>
        <path d="m14 17 2.4-2.4"></path>
    </svg>
);

const BackArrowIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 h-5 w-5">
        <line x1="19" y1="12" x2="5" y2="12"></line>
        <polyline points="12 19 5 12 12 5"></polyline>
    </svg>
);


// --- Main App Component ---
export default function App() {
  const [orderNumber, setOrderNumber] = useState('');
  // Correctly type the useState hook to allow string values or null
  const [status, setStatus] = useState<OrderStatus>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleTrackOrder = () => {
    if (!orderNumber.trim()) {
        setStatus('not_found');
        return;
    }
    
    setIsLoading(true);
    setStatus(null);

    // Simulate an API call
    setTimeout(() => {
      // Mock logic: pretend to find some orders
      if (orderNumber.toLowerCase().includes('idp')) {
        setStatus('in_progress');
      } else {
        setStatus('not_found');
      }
      setIsLoading(false);
    }, 1500);
  };

  return (
    // Main container with dark background
    <div className="bg-gray-900 min-h-screen flex flex-col items-center justify-center p-4 text-center text-gray-200" style={{ fontFamily: "'Inter', sans-serif" }}>
      
      {/* This link should be in the <head> of your document for the font to work */}
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Uncial+Antiqua&family=Inter:wght@400;500;700&display=swap');
          .font-pirate-special {
            font-family: 'Uncial Antiqua', cursive;
          }
        `}
      </style>

      {/* Back Button - For Next.js, use the Link component. For this environment, a standard anchor tag is used. */}
      <div className="absolute top-4 left-4">
        <a href="/" className="flex items-center justify-center bg-gray-700/50 hover:bg-gray-700 text-gray-300 font-semibold py-2 px-4 rounded-lg transition-colors duration-300 shadow-md">
            <BackArrowIcon />
            Back to Home
        </a>
      </div>

      <main className="w-full max-w-md">
        {/* Main Heading */}
        <h1 className="font-pirate-special text-7xl md:text-8xl font-bold text-white tracking-wider mb-4">
          ID Pirate
        </h1>

        {/* Subheading */}
        <p className="mt-2 text-lg text-gray-400 mb-8">
          Track Your Treasure
        </p>

        {/* Tracking Input Section */}
        <div className="flex flex-col space-y-4">
          <input 
            type="text"
            value={orderNumber}
            onChange={(e) => setOrderNumber(e.target.value)}
            placeholder="Enter your order number..."
            className="w-full bg-gray-800 border-2 border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition"
          />
          <button 
            onClick={handleTrackOrder}
            disabled={isLoading}
            className="flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg transition-colors duration-300 text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 disabled:bg-gray-500 disabled:cursor-not-allowed"
          >
            {isLoading ? (
                <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Searching...
                </>
            ) : (
                <>
                    <SearchIcon />
                    Check Status
                </>
            )}
          </button>
        </div>

        {/* Status Display Section */}
        {status && (
            <div className="mt-8 p-6 bg-gray-800/70 rounded-lg shadow-lg border border-gray-700 animate-fade-in">
                {status === 'in_progress' && (
                    <div className="flex flex-col items-center">
                        <ShippingIcon />
                        <h2 className="text-xl font-bold text-yellow-400 mt-4">Order In Progress</h2>
                        <p className="text-gray-300 mt-2">Your treasure is being prepared and will be shipped soon.</p>
                    </div>
                )}
                 {status === 'not_found' && (
                    <div className="flex flex-col items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8 text-red-400">
                           <circle cx="12" cy="12" r="10"></circle>
                           <line x1="12" y1="8" x2="12" y2="12"></line>
                           <line x1="12" y1="16" x2="12.01" y2="16"></line>
                        </svg>
                        <h2 className="text-xl font-bold text-red-400 mt-4">Order Not Found</h2>
                        <p className="text-gray-300 mt-2">Please check your order number and try again.</p>
                    </div>
                )}
            </div>
        )}

      </main>

      {/* Footer */}
      <footer className="absolute bottom-4 text-gray-500 text-sm">
        &copy; {new Date().getFullYear()} ID Pirate. All rights reserved.
      </footer>
       <style jsx global>{`
            @keyframes fade-in {
                from { opacity: 0; transform: translateY(10px); }
                to { opacity: 1; transform: translateY(0); }
            }
            .animate-fade-in {
                animation: fade-in 0.5s ease-out forwards;
            }
        `}</style>
    </div>
  );
}
