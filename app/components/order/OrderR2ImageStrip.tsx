"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { Spinner } from '../ui/Spinner';
import { ImageLightbox } from '../ui/ImageLightbox';
import { getBlobDisplayUrlForKey } from '@/lib/viewImageCache';

export interface R2ImageSlot {
  label: string;
  objectKey?: string;
}

interface OrderR2ImageStripProps {
  slots: R2ImageSlot[];
  resolveUrl: (objectKey: string) => Promise<string>;
  className?: string;
}

/**
 * Loads images via cached presigned GET → blob URL (same-origin display; right-click open shows blob:).
 */
export function OrderR2ImageStrip({ slots, resolveUrl, className = '' }: OrderR2ImageStripProps) {
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imgBroken, setImgBroken] = useState<Record<string, boolean>>({});
  const [lightbox, setLightbox] = useState<{ url: string; label: string } | null>(null);

  const keysSig = slots.map((s) => s.objectKey || '').join('|');

  const closeLightbox = useCallback(() => setLightbox(null), []);

  useEffect(() => {
    let cancelled = false;
    const withKeys = slots.filter((s) => s.objectKey);
    if (withKeys.length === 0) {
      setLoading(false);
      setUrls({});
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    setImgBroken({});

    (async () => {
      try {
        const next: Record<string, string> = {};
        for (const s of withKeys) {
          next[s.objectKey!] = await getBlobDisplayUrlForKey(s.objectKey!, resolveUrl);
        }
        if (!cancelled) setUrls(next);
      } catch {
        if (!cancelled) {
          setError('Could not load images.');
          setUrls({});
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [keysSig, resolveUrl]);

  const hasAnyKey = slots.some((s) => s.objectKey);
  if (!hasAnyKey) {
    return (
      <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
        No photo/signature on file for this ID.
      </p>
    );
  }

  if (loading) {
    return (
      <div className={`flex items-center gap-2 py-2 ${className}`}>
        <Spinner size="sm" />
        <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
          Loading images…
        </span>
      </div>
    );
  }

  if (error) {
    return <p className="text-xs text-red-400 py-1">{error}</p>;
  }

  return (
    <>
      <div className={`flex flex-wrap gap-4 ${className}`}>
        {slots.map((slot) => {
          if (!slot.objectKey) return null;
          const href = urls[slot.objectKey];
          if (!href) return null;
          const isSig = slot.label.toLowerCase().includes('sign');
          return (
            <div key={`${slot.label}-${slot.objectKey}`} className="flex flex-col gap-1.5 min-w-[120px]">
              <span className="text-label">{slot.label}</span>
              <button
                type="button"
                onClick={() => setLightbox({ url: href, label: slot.label })}
                aria-label={`View ${slot.label} full size`}
                className={`block min-h-[10rem] w-full max-w-[200px] rounded-xl overflow-hidden border border-[var(--border)] text-left focus:outline-none focus:ring-2 focus:ring-indigo-500/50 ${
                  isSig ? 'bg-white/[0.08]' : 'bg-[var(--bg-secondary)]'
                }`}
              >
                {imgBroken[slot.objectKey] ? (
                  <div className="flex min-h-[10rem] items-center justify-center px-2 py-4 text-center text-xs text-red-400/90">
                    Image failed to load.
                  </div>
                ) : (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={href}
                    alt=""
                    className={`max-h-48 min-h-[8rem] w-full object-contain ${isSig ? 'brightness-110 contrast-105 saturate-50' : ''}`}
                    onError={() =>
                      setImgBroken((prev) => ({ ...prev, [slot.objectKey!]: true }))
                    }
                  />
                )}
              </button>
            </div>
          );
        })}
      </div>

      {lightbox && (
        <ImageLightbox
          url={lightbox.url}
          label={lightbox.label}
          onClose={closeLightbox}
        />
      )}
    </>
  );
}
