"use client";

import React, { useEffect } from 'react';

interface ImageLightboxProps {
  url: string;
  label: string;
  onClose: () => void;
}

export function ImageLightbox({ url, label, onClose }: ImageLightboxProps) {
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-sm pt-[env(safe-area-inset-top,0px)] pb-[env(safe-area-inset-bottom,0px)] pl-[env(safe-area-inset-left,0px)] pr-[env(safe-area-inset-right,0px)]"
      role="dialog"
      aria-modal="true"
      aria-label={label}
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute z-10 min-h-[44px] min-w-[44px] rounded-xl text-sm font-semibold text-white bg-white/12 hover:bg-white/20 active:scale-[0.98] transition-all flex items-center justify-center px-4"
        style={{
          top: 'max(0.75rem, env(safe-area-inset-top, 0px))',
          right: 'max(0.75rem, env(safe-area-inset-right, 0px))',
        }}
      >
        Close
      </button>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url}
        alt={label}
        className="max-w-[min(94vw,1200px)] max-h-[min(85dvh,900px)] w-auto h-auto object-contain rounded-lg shadow-2xl mx-auto px-2"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
}
