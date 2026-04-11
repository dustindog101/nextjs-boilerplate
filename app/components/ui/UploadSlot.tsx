"use client";

import React from 'react';
import { UploadIcon } from '../icons';

export type UploadSlotStatus = 'idle' | 'presigning' | 'uploading' | 'done' | 'error';

interface UploadSlotProps {
  label: string;
  name: 'photo' | 'signature';
  status: UploadSlotStatus;
  progress: number;
  error?: string;
  displayName?: string;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRetry: () => void;
}

export const UploadSlot: React.FC<UploadSlotProps> = ({
  label,
  name,
  status,
  progress,
  error,
  displayName,
  onFileChange,
  onRetry,
}) => {
  const busy = status === 'presigning' || status === 'uploading';
  const idleLabel =
    displayName ||
    (status === 'done' ? 'Uploaded' : undefined) ||
    'Click to upload';

  return (
    <div>
      <label className="text-label block mb-2">{label}</label>
      <label
        className={`flex flex-col items-center justify-center w-full min-h-[6rem] border-2 border-dashed rounded-xl transition-colors bg-white/[0.02] ${
          busy ? 'opacity-70 pointer-events-none border-white/[0.08]' : 'cursor-pointer border-white/[0.12] hover:border-indigo-500/40'
        } ${status === 'done' ? 'border-emerald-500/30 bg-emerald-500/5' : ''} ${status === 'error' ? 'border-red-500/25' : ''}`}
      >
        <UploadIcon className="h-5 w-5 text-zinc-500 mb-1" />
        <span className="text-xs text-zinc-500 text-center px-2">
          {status === 'presigning' && 'Preparing…'}
          {status === 'uploading' && `${progress}%`}
          {(status === 'idle' || status === 'done') && (
            <span className={status === 'done' ? 'text-emerald-400' : ''}>
              {status === 'done' ? `✓ ${displayName || 'Uploaded'}` : idleLabel}
            </span>
          )}
          {status === 'error' && <span className="text-red-400">{error || 'Upload failed'}</span>}
        </span>
        <input
          type="file"
          name={name}
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={onFileChange}
          disabled={busy}
        />
      </label>
      {status === 'uploading' && (
        <div className="mt-2 h-1.5 w-full rounded-full bg-white/[0.06] overflow-hidden">
          <div
            className="h-full bg-indigo-500 transition-[width] duration-150"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
      {status === 'error' && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-2 text-xs text-indigo-400 hover:text-indigo-300 font-medium"
        >
          Retry
        </button>
      )}
    </div>
  );
};
