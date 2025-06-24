import React from 'react';

// You can place these SVG components in their own files for better organization
// Or keep them here for a single-file component.

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


// Main App Component
export default function App() {
  return (
    // Main container with dark background
    <div className="bg-gray-900 min-h-screen flex flex-col items-center justify-center p-4 text-center text-gray-200 font-sans">
      
      {/* Admin Login Button - Top Right Corner */}
      <div className="absolute top-4 right-4">
        <button className="flex items-center justify-center bg-gray-700/50 hover:bg-gray-700 text-gray-300 font-semibold py-2 px-4 rounded-lg transition-colors duration-300 shadow-md">
          <LockIcon />
          Admin Login
        </button>
      </div>
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Uncial+Antiqua&family=Inter:wght@400;500;700&display=swap');
          .font-pirate-special {
            font-family: 'Uncial Antiqua', cursive;
          }
        `}
      </style>

      <main className="flex flex-col items-center">
        {/* Main Heading */}
        <h1 className="font-pirate-special text-7xl md:text-8xl font-bold text-white tracking-wider mb-4">
          ID Pirate
        </h1>

        {/* Subheading */}
        <p className="mt-4 text-xl md:text-2xl text-yellow-400/80 bg-gray-800/50 px-4 py-2 rounded-md tracking-widest shadow-lg">
          UNDER CONSTRUCTION
        </p>
        <p className="mt-2 text-lg text-gray-400">
          Our new website is launching soon.
        </p>

        {/* Buttons Section */}
        <div className="mt-12 flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-6">
          <button className="flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg transition-colors duration-300 text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1">
            <DocumentIcon />
            Invoices
          </button>
          <a href="/track" className="flex items-center justify-center bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-lg transition-colors duration-300 text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 w-full">
            <BoxIcon />
            Order
          </button>
        </div>
      </main>

      {/* Footer */}
      <footer className="absolute bottom-4 text-gray-500 text-sm">
        &copy; {new Date().getFullYear()} ID Pirate. All rights reserved.
      </footer>
    </div>
  );
}
