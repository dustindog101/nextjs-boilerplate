"use client";
import React from 'react';
import Link from 'next/link';
import { Footer } from '../components/ui/Footer';

// --- Type Definitions ---
interface StateId {
  name: string;
  slug: string;
  price: number;
  features: string[];
  duplicateInfo: string;
}

// --- Data for the ID Gallery ---
const states: StateId[] = [
  { name: 'Pennsylvania', slug: 'pennsylvania', price: 90, features: ['Scannable Barcodes', 'Microprint', 'UV & OVI Holo'], duplicateInfo: 'FREE Duplicate' },
  { name: 'New Jersey', slug: 'new-jersey', price: 100, features: ['Scannable Barcodes', 'Microprint', 'UV & OVI Holo'], duplicateInfo: 'FREE Duplicate' },
  { name: 'Old Maine', slug: 'old-maine', price: 85, features: ['Scannable Barcodes', 'Microprint', 'UV & OVI Holo'], duplicateInfo: 'FREE Duplicate' },
  { name: 'Washington', slug: 'washington', price: 85, features: ['Scannable Barcodes', 'Microprint', 'UV & OVI Holo'], duplicateInfo: 'FREE Duplicate' },
  { name: 'Oregon', slug: 'oregon', price: 85, features: ['Scannable Barcodes', 'Microprint', 'UV & OVI Holo'], duplicateInfo: 'FREE Duplicate' },
  { name: 'South Carolina', slug: 'south-carolina', price: 85, features: ['Scannable Barcodes', 'Microprint', 'UV & OVI Holo'], duplicateInfo: 'FREE Duplicate' },
  { name: 'Missouri', slug: 'missouri', price: 85, features: ['Scannable Barcodes', 'Microprint', 'UV & OVI Holo'], duplicateInfo: 'FREE Duplicate' },
  { name: 'Illinois', slug: 'illinois', price: 90, features: ['Scannable Barcodes', 'Microprint', 'UV & OVI Holo'], duplicateInfo: 'FREE Duplicate' },
  { name: 'Connecticut', slug: 'connecticut', price: 90, features: ['Scannable Barcodes', 'Microprint', 'UV & OVI Holo'], duplicateInfo: 'FREE Duplicate' },
  { name: 'Arizona', slug: 'arizona', price: 90, features: ['Scannable Barcodes', 'Microprint', 'UV & OVI Holo'], duplicateInfo: 'FREE Duplicate' },
  { name: 'Florida', slug: 'florida', price: 100, features: ['Scannable Barcodes', 'Microprint', 'UV & OVI Holo'], duplicateInfo: 'FREE Duplicate' },
  { name: 'Texas', slug: 'texas', price: 100, features: ['Scannable Barcodes', 'Microprint', 'UV & OVI Holo'], duplicateInfo: 'FREE Duplicate' },
];

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
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white tracking-tight animate-fade-up">
            Select Your State
          </h1>
          <p className="mt-3 text-sm sm:text-base text-zinc-400 animate-fade-up delay-1">
            Choose an ID from the gallery to begin your order. All states include scannable barcodes, UV & OVI holograms, and a free duplicate.
          </p>
        </header>

        {/* Gallery Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
          {states.map((state, i) => (
            <div
              key={state.slug}
              className={`glass glass-hover p-5 flex flex-col animate-fade-up`}
              style={{ animationDelay: `${75 * (i % 8)}ms` }}
            >
              {/* Name & Price */}
              <div className="mb-4">
                <h2 className="text-lg font-bold text-white">{state.name}</h2>
                <p className="text-price text-2xl mt-1">${state.price}</p>
              </div>

              {/* Features */}
              <ul className="space-y-2 mb-5 flex-grow">
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
              <Link href="/order/new" className="btn btn-primary w-full text-sm mt-auto">
                Order
              </Link>
            </div>
          ))}
        </div>
      </div>

      <Footer />
    </div>
  );
}
