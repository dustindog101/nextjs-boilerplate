"use client";

import React, { useEffect, useState } from 'react';
import { Spinner } from '../ui/Spinner';

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
 * Loads short-lived presigned URLs and shows thumbnails for R2 object keys.
 */
export function OrderR2ImageStrip({ slots, resolveUrl, className = '' }: OrderR2ImageStripProps) {
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const keysSig = slots.map((s) => s.objectKey || '').join('|');

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

    (async () => {
      try {
        const next: Record<string, string> = {};
        for (const s of withKeys) {
          next[s.objectKey!] = await resolveUrl(s.objectKey!);
        }
        if (!cancelled) setUrls(next);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Failed to load images.');
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
    return (
      <p className="text-xs text-red-400 py-1">{error}</p>
    );
  }

  return (
    <div className={`flex flex-wrap gap-4 ${className}`}>
      {slots.map((slot) => {
        if (!slot.objectKey) return null;
        const href = urls[slot.objectKey];
        if (!href) return null;
        return (
          <div key={`${slot.label}-${slot.objectKey}`} className="flex flex-col gap-1.5 min-w-[120px]">
            <span className="text-label">{slot.label}</span>
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="block rounded-xl overflow-hidden border border-[var(--border)] bg-[var(--bg-secondary)] max-w-[200px]"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={href}
                alt={slot.label}
                className="max-h-40 w-full object-contain"
              />
            </a>
            <span className="text-[10px] font-mono truncate max-w-[200px]" style={{ color: 'var(--text-tertiary)' }}>
              {slot.objectKey}
            </span>
          </div>
        );
      })}
    </div>
  );
}
