"use client";
import React from 'react';

// --- Type Definitions ---
interface StateId {
  name: string;
  slug: string;
  imageUrl: string;
  price: number;
  features: string[];
  duplicateInfo: string;
}

// --- Data for the ID Gallery ---

// Added price and features based on the provided screenshot.
const states: StateId[] = [
    { name: 'Pennsylvania', slug: 'pennsylvania', imageUrl: 'https://placehold.co/600x400/1F2937/E5E7EB?text=Pennsylvania', price: 90, features: ['Scannable Barcodes', 'Microprint', 'UV & OVI Holo'], duplicateInfo: 'Duplicate Price: FREE' },
    { name: 'New Jersey', slug: 'new-jersey', imageUrl: 'https://placehold.co/600x400/1F2937/E5E7EB?text=New+Jersey', price: 100, features: ['Scannable Barcodes', 'Microprint', 'UV & OVI Holo'], duplicateInfo: 'Duplicate Price: FREE' },
    { name: 'Old Maine', slug: 'old-maine', imageUrl: 'https://placehold.co/600x400/1F2937/E5E7EB?text=Old+Maine', price: 85, features: ['Scannable Barcodes', 'Microprint', 'UV & OVI Holo'], duplicateInfo: 'Duplicate Price: FREE' },
    { name: 'Washington', slug: 'washington', imageUrl: 'https://placehold.co/600x400/1F2937/E5E7EB?text=Washington', price: 85, features: ['Scannable Barcodes', 'Microprint', 'UV & OVI Holo'], duplicateInfo: 'Duplicate Price: FREE' },
    { name: 'Oregon', slug: 'oregon', imageUrl: 'https://placehold.co/600x400/1F2937/E5E7EB?text=Oregon', price: 85, features: ['Scannable Barcodes', 'Microprint', 'UV & OVI Holo'], duplicateInfo: 'Duplicate Price: FREE' },
    { name: 'South Carolina', slug: 'south-carolina', imageUrl: 'https://placehold.co/600x400/1F2937/E5E7EB?text=South+Carolina', price: 85, features: ['Scannable Barcodes', 'Microprint', 'UV & OVI Holo'], duplicateInfo: 'Duplicate Price: FREE' },
    { name: 'Missouri', slug: 'missouri', imageUrl: 'https://placehold.co/600x400/1F2937/E5E7EB?text=Missouri', price: 85, features: ['Scannable Barcodes', 'Microprint', 'UV & OVI Holo'], duplicateInfo: 'Duplicate Price: FREE' },
    { name: 'Illinois', slug: 'illinois', imageUrl: 'https://placehold.co/600x400/1F2937/E5E7EB?text=Illinois', price: 90, features: ['Scannable Barcodes', 'Microprint', 'UV & OVI Holo'], duplicateInfo: 'Duplicate Price: FREE' },
    { name: 'Connecticut', slug: 'connecticut', imageUrl: 'https://placehold.co/600x400/1F2937/E5E7EB?text=Connecticut', price: 90, features: ['Scannable Barcodes', 'Microprint', 'UV & OVI Holo'], duplicateInfo: 'Duplicate Price: FREE' },
    { name: 'Arizona', slug: 'arizona', imageUrl: 'https://placehold.co/600x400/1F2937/E5E7EB?text=Arizona', price: 90, features: ['Scannable Barcodes', 'Microprint', 'UV & OVI Holo'], duplicateInfo: 'Duplicate Price: FREE' },
    { name: 'Florida', slug: 'florida', imageUrl: 'https://placehold.co/600x400/1F2937/E5E7EB?text=Florida', price: 100, features: ['Scannable Barcodes', 'Microprint', 'UV & OVI Holo'], duplicateInfo: 'Duplicate Price: FREE' },
    { name: 'Texas', slug: 'texas', imageUrl: 'https://placehold.co/600x400/1F2937/E5E7EB?text=Texas', price: 100, features: ['Scannable Barcodes', 'Microprint', 'UV & OVI Holo'], duplicateInfo: 'Duplicate Price: FREE' },
];


// --- SVG Icons ---
const BackArrowIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 h-5 w-5">
        <line x1="19" y1="12" x2="5" y2="12"></line>
        <polyline points="12 19 5 12 12 5"></polyline>
    </svg>
);

const CheckmarkIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-green-400 mr-2 flex-shrink-0">
        <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
);


// --- Main Page Component ---
export default function OrderGalleryPage() {
  return (
    <div className="bg-gray-900 min-h-screen text-gray-200">
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Uncial+Antiqua&family=Inter:wght@400;500;700&display=swap');
          .font-pirate-special {
            font-family: 'Uncial Antiqua', cursive;
          }
        `}
      </style>
        
      <div className="container mx-auto p-4 sm:p-8">
          {/* Back Button */}
          <div className="mb-8">
            <a href="/">
              <button className="flex items-center justify-center bg-gray-700/50 hover:bg-gray-700 text-gray-300 font-semibold py-2 px-4 rounded-lg transition-colors duration-300 shadow-md">
                <BackArrowIcon />
                Back to Home
              </button>
            </a>
          </div>
      
          <header className="text-center mb-12">
            <h1 className="font-pirate-special text-6xl md:text-7xl font-bold text-white tracking-wider">
              Select Your State
            </h1>
            <p className="mt-2 text-lg text-gray-400">Choose an ID from the gallery to begin your order.</p>
          </header>

          {/* Gallery Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {states.map((state) => (
              <div key={state.slug} className="bg-gray-800 rounded-lg overflow-hidden shadow-lg border border-gray-700/50 flex flex-col">
                {/* Top Bar with Name and Price */}
                <div className="bg-gray-900 p-4 text-center">
                    <h2 className="text-xl font-bold text-white truncate">[New] {state.name}</h2>
                    <p className="text-4xl font-bold text-green-400 mt-1">${state.price}</p>
                </div>

                {/* Image */}
                <div className="p-2 bg-gray-700/20">
                    <img 
                      src={state.imageUrl} 
                      alt={`${state.name} ID`} 
                      className="w-full h-auto aspect-[3/2] object-cover rounded"
                      onError={(e) => { e.currentTarget.src = 'https://placehold.co/600x400/1F2937/ff0000?text=Image+Error'; }}
                    />
                </div>

                {/* Features and Order Button */}
                <div className="p-6 flex flex-col flex-grow">
                    <ul className="space-y-3 text-gray-300 mb-6">
                        {state.features.map(feature => (
                            <li key={feature} className="flex items-center">
                                <CheckmarkIcon />
                                <span>{feature}</span>
                            </li>
                        ))}
                         <li className="flex items-center">
                            <CheckmarkIcon />
                            <span>{state.duplicateInfo}</span>
                        </li>
                    </ul>
{/* old order bbutton //<a href={`/order/${state.slug}`} className="block">*/}
                    <div className="mt-auto">
                      <a href={`/order/new`} className="block">
                        
                            <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-colors duration-300 text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1">
                                Order
                            </button>
                        </a>
                    </div>
                </div>
              </div>
            ))}
          </div>
      </div>

       <footer className="text-center py-8 text-gray-500 text-sm">
        &copy; {new Date().getFullYear()} ID Pirate. All rights reserved.
      </footer>
    </div>
  );
}
