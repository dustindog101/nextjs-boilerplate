"use client";
import React from 'react';
import Link from 'next/link';
import { Footer } from '../components/ui/Footer';
import { stateOptions, statePrices, defaultIdPrice } from '../../lib/constants';

// --- Type Definitions ---
interface StateId {
  name: string;
  slug: string;
  price: number;
  imageUrl: string;
  features: string[];
  duplicateInfo: string;
}

// --- Data for the ID Gallery (prices from lib/constants.ts) ---
const states: StateId[] = stateOptions.map(name => {
  const slug = name.toLowerCase().replace(/\s+/g, '-');
  return {
    name,
    slug,
    price: statePrices[name] ?? defaultIdPrice,
    imageUrl: `https://placehold.co/600x400/1F2937/E5E7EB?text=${encodeURIComponent(name)}`,
    features: ['Scannable Barcodes', 'Microprint', 'UV & OVI Holo'],
    duplicateInfo: 'FREE Duplicate',
  };
});

// --- Check icon ---
function Check() {
  return (
    <svg className="h-4 w-4 text-emerald-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

// --- Main Page Component ---
export default function OrderGalleryPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-12 flex-grow">
        <header className="text-center mb-10 sm:mb-12">
          <h1 className="font-pirate text-5xl sm:text-6xl md:text-7xl font-bold text-white tracking-wider animate-fade-up">
            Select Your State
          </h1>
          <p className="mt-3 text-sm sm:text-base text-zinc-400 animate-fade-up delay-1">
            Choose an ID from the gallery to begin your order. All states include scannable barcodes, UV & OVI holograms, and a free duplicate.
          </p>
        </header>

        {/* Gallery Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8">
          {states.map((state, i) => (
            <div
              key={state.slug}
              className={`glass glass-hover overflow-hidden flex flex-col animate-fade-up`}
              style={{ animationDelay: `${75 * (i % 8)}ms` }}
            >
              {/* Image Preview */}
              <div className="w-full bg-zinc-900 border-b border-white/[0.06]">
                <img
                  src={state.imageUrl}
                  alt={`${state.name} ID`}
                  className="w-full h-auto aspect-[3/2] object-cover opacity-90 hover:opacity-100 transition-opacity"
                  onError={(e) => { e.currentTarget.src = 'https://placehold.co/600x400/1F2937/ff0000?text=Image+Error'; }}
                />
              </div>

              <div className="p-5 flex flex-col flex-grow">
                {/* Name & Price */}
                <div className="mb-4 flex justify-between items-start">
                  <h2 className="text-xl font-bold text-white leading-tight">{state.name}</h2>
                  <p className="text-price text-2xl font-bold">${state.price}</p>
                </div>

                {/* Features */}
                <ul className="space-y-2 mb-6 flex-grow">
                  {state.features.map(feature => (
                    <li key={feature} className="flex items-center gap-2 text-sm text-zinc-300">
                      <Check /> {feature}
                    </li>
                  ))}
                  <li className="flex items-center gap-2 text-sm text-zinc-300">
                    <Check /> {state.duplicateInfo}
                  </li>
                </ul>

                {/* Order Button */}
                <Link href="/order/new" className="btn btn-primary w-full text-base font-bold shadow-lg shadow-indigo-500/20 mt-auto">
                  Order Now
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Footer />
    </div>
  );
}
