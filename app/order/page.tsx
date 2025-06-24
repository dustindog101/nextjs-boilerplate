"use client";
import React from 'react';

// --- Type Definitions ---
interface StateId {
  name: string;
  slug: string;
  imageUrl: string;
}

// --- Data for the ID Gallery ---
// In a real application, this data might come from an API.
const states: StateId[] = [
    { name: 'Pennsylvania', slug: 'pennsylvania', imageUrl: 'https://placehold.co/600x400/1F2937/E5E7EB?text=Pennsylvania' },
    { name: 'New Jersey', slug: 'new-jersey', imageUrl: 'https://placehold.co/600x400/1F2937/E5E7EB?text=New+Jersey' },
    { name: 'Old Maine', slug: 'old-maine', imageUrl: 'https://placehold.co/600x400/1F2937/E5E7EB?text=Old+Maine' },
    { name: 'Washington', slug: 'washington', imageUrl: 'https://placehold.co/600x400/1F2937/E5E7EB?text=Washington' },
    { name: 'Oregon', slug: 'oregon', imageUrl: 'https://placehold.co/600x400/1F2937/E5E7EB?text=Oregon' },
    { name: 'South Carolina', slug: 'south-carolina', imageUrl: 'https://placehold.co/600x400/1F2937/E5E7EB?text=South+Carolina' },
    { name: 'Missouri', slug: 'missouri', imageUrl: 'https://placehold.co/600x400/1F2937/E5E7EB?text=Missouri' },
    { name: 'Illinois', slug: 'illinois', imageUrl: 'https://placehold.co/600x400/1F2937/E5E7EB?text=Illinois' },
    { name: 'Connecticut', slug: 'connecticut', imageUrl: 'https://placehold.co/600x400/1F2937/E5E7EB?text=Connecticut' },
    { name: 'Arizona', slug: 'arizona', imageUrl: 'https://placehold.co/600x400/1F2937/E5E7EB?text=Arizona' },
    { name: 'Florida', slug: 'florida', imageUrl: 'https://placehold.co/600x400/1F2937/E5E7EB?text=Florida' },
    { name: 'Texas', slug: 'texas', imageUrl: 'https://placehold.co/600x400/1F2937/E5E7EB?text=Texas' },
    { name: 'California', slug: 'california', imageUrl: 'https://placehold.co/600x400/1F2937/E5E7EB?text=California' },
    { name: 'New York', slug: 'new-york', imageUrl: 'https://placehold.co/600x400/1F2937/E5E7EB?text=New+York' },
    { name: 'Ohio', slug: 'ohio', imageUrl: 'https://placehold.co/600x400/1F2937/E5E7EB?text=Ohio' },
    { name: 'Georgia', slug: 'georgia', imageUrl: 'https://placehold.co/600x400/1F2937/E5E7EB?text=Georgia' },
    { name: 'Colorado', slug: 'colorado', imageUrl: 'https://placehold.co/600x400/1F2937/E5E7EB?text=Colorado' },
    { name: 'Nevada', slug: 'nevada', imageUrl: 'https://placehold.co/600x400/1F2937/E5E7EB?text=Nevada' },
    { name: 'Michigan', slug: 'michigan', imageUrl: 'https://placehold.co/600x400/1F2937/E5E7EB?text=Michigan' },
    { name: 'Virginia', slug: 'virginia', imageUrl: 'https://placehold.co/600x400/1F2937/E5E7EB?text=Virginia' },
];


// --- SVG Icons ---
const BackArrowIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 h-5 w-5">
        <line x1="19" y1="12" x2="5" y2="12"></line>
        <polyline points="12 19 5 12 12 5"></polyline>
    </svg>
);


// --- Main Page Component ---
export default function OrderGalleryPage() {
  return (
    <div className="bg-gray-900 min-h-screen text-gray-200 p-4 sm:p-8">
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Uncial+Antiqua&family=Inter:wght@400;500;700&display=swap');
          .font-pirate-special {
            font-family: 'Uncial Antiqua', cursive;
          }
        `}
      </style>

      {/* Back Button */}
      <div className="absolute top-4 left-4 z-10">
        <a href="/">
          <button className="flex items-center justify-center bg-gray-700/50 hover:bg-gray-700 text-gray-300 font-semibold py-2 px-4 rounded-lg transition-colors duration-300 shadow-md">
            <BackArrowIcon />
            Back to Home
          </button>
        </a>
      </div>
      
      <main className="container mx-auto pt-16">
        <header className="text-center mb-12">
          <h1 className="font-pirate-special text-6xl md:text-7xl font-bold text-white tracking-wider">
            Select Your State
          </h1>
          <p className="mt-2 text-lg text-gray-400">Choose an ID from the gallery to begin your order.</p>
        </header>

        {/* Gallery Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 md:gap-8">
          {states.map((state) => (
            <a key={state.slug} href={`/order/${state.slug}`} className="group block">
              <div className="bg-gray-800 rounded-lg overflow-hidden shadow-lg border border-gray-700/50 transform transition-transform duration-300 group-hover:scale-105 group-hover:shadow-blue-500/20">
                <img 
                  src={state.imageUrl} 
                  alt={`${state.name} ID`} 
                  className="w-full h-auto aspect-[3/2] object-cover"
                  onError={(e) => { e.currentTarget.src = 'https://placehold.co/600x400/1F2937/ff0000?text=Image+Error'; }}
                />
                <div className="p-4">
                  <h3 className="text-lg font-bold text-white text-center truncate">{state.name}</h3>
                </div>
              </div>
            </a>
          ))}
        </div>
      </main>

       <footer className="text-center mt-16 text-gray-500 text-sm">
        &copy; {new Date().getFullYear()} ID Pirate. All rights reserved.
      </footer>
    </div>
  );
}
