"use client";

import React, { useState } from 'react';
import { UploadIcon } from '../icons';
import { ACCEPTED_IMAGE_INPUT_ACCEPT } from '@/lib/constants';
import { SignaturePad } from './SignaturePad';

export type UploadSlotStatus = 'idle' | 'presigning' | 'uploading' | 'done' | 'error';

interface UploadSlotProps {
  label: string;
  name: 'photo' | 'signature';
  status: UploadSlotStatus;
  progress: number;
  error?: string;
  displayName?: string;
  accept?: string;
  previewUrl?: string | null;
  onPreviewOpen?: () => void;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRetry: () => void;
  onSignatureFile?: (file: File) => void | Promise<void>;
  /** Default `dark` (main app). Use `light` on reseller portal light mode. */
  appearance?: 'dark' | 'light';
}

export const UploadSlot: React.FC<UploadSlotProps> = ({
  label,
  name,
  status,
  progress,
  error,
  displayName,
  accept = ACCEPTED_IMAGE_INPUT_ACCEPT,
  previewUrl,
  onPreviewOpen,
  onFileChange,
  onRetry,
  onSignatureFile,
  appearance = 'dark',
}) => {
  const busy = status === 'presigning' || status === 'uploading';
  const [sigMode, setSigMode] = useState<'draw' | 'upload'>('draw');
  const light = appearance === 'light';

  const idleLabel =
    displayName ||
    (status === 'done' ? 'Uploaded' : undefined) ||
    'Tap to choose a file';

  const hasDrawSignature = name === 'signature' && Boolean(onSignatureFile);
  /** While editing: segmented Draw | Upload inside one card. After success, card hides until Replace. */
  const showSigEditor = hasDrawSignature && status !== 'done';

  const tabBtn = (active: boolean) =>
    `min-h-[44px] sm:min-h-[40px] rounded-lg text-sm font-semibold transition-all flex items-center justify-center px-2 ${
      light
        ? active
          ? 'bg-blue-100 text-blue-900 border border-blue-300 shadow-sm'
          : 'text-slate-600 border border-transparent hover:text-slate-900 hover:bg-slate-100'
        : active
          ? 'bg-indigo-500/20 text-white border border-indigo-500/35 shadow-sm'
          : 'text-zinc-400 border border-transparent hover:text-zinc-200 hover:bg-white/[0.04]'
    } ${busy ? 'opacity-50 pointer-events-none' : ''}`;

  const dashedUploadClasses = light
    ? `flex flex-col items-center justify-center w-full min-h-[6.5rem] sm:min-h-[6rem] border-2 border-dashed rounded-xl transition-colors bg-white ${
        busy
          ? 'opacity-70 pointer-events-none border-slate-200'
          : 'cursor-pointer border-slate-300 hover:border-blue-400 hover:bg-slate-50 active:border-blue-500'
      } ${status === 'done' ? 'border-emerald-400 bg-emerald-50/80' : ''} ${status === 'error' ? 'border-red-300 bg-red-50/50' : ''}`
    : `flex flex-col items-center justify-center w-full min-h-[6.5rem] sm:min-h-[6rem] border-2 border-dashed rounded-xl transition-colors bg-white/[0.02] ${
        busy ? 'opacity-70 pointer-events-none border-white/[0.08]' : 'cursor-pointer border-white/[0.12] hover:border-indigo-500/40 active:border-indigo-500/50'
      } ${status === 'done' ? 'border-emerald-500/30 bg-emerald-500/5' : ''} ${status === 'error' ? 'border-red-500/25' : ''}`;

  const renderClassicDashed = (opts?: { minHClass?: string; subcopy?: string }) => (
    <label className={`${dashedUploadClasses} ${opts?.minHClass ?? ''}`}>
      <UploadIcon className={`h-5 w-5 mb-1 ${light ? 'text-slate-500' : 'text-zinc-500'}`} />
      <span className={`text-xs text-center px-2 ${light ? 'text-slate-600' : 'text-zinc-500'}`}>
        {status === 'presigning' && 'Preparing…'}
        {status === 'uploading' && `${progress}%`}
        {(status === 'idle' || status === 'done') && (
          <span className={status === 'done' ? (light ? 'text-emerald-700' : 'text-emerald-400') : ''}>
            {status === 'done' ? `✓ ${displayName || 'Uploaded'}` : idleLabel}
          </span>
        )}
        {status === 'error' && <span className={light ? 'text-red-600' : 'text-red-400'}>{error || 'Upload failed'}</span>}
      </span>
      {opts?.subcopy && (
        <span className={`text-[11px] mt-1 px-2 text-center ${light ? 'text-slate-500' : 'text-zinc-500'}`}>{opts.subcopy}</span>
      )}
      <input type="file" name={name} accept={accept} className="hidden" onChange={onFileChange} disabled={busy} />
    </label>
  );

  return (
    <div>
      <label
        className={`block mb-2 text-xs font-semibold uppercase tracking-wider ${light ? 'text-slate-500' : 'text-label'}`}
      >
        {label}
      </label>

      {/* ── Photo: single dashed target ── */}
      {name === 'photo' && renderClassicDashed()}

      {/* ── Signature + draw API: one glass card, Draw | Upload, no duplicate drop zone ── */}
      {hasDrawSignature && (
        <>
          {showSigEditor && (
            <div
              className={
                light
                  ? 'rounded-xl border border-slate-200 bg-slate-50/90 p-3 sm:p-4 mb-3 shadow-sm'
                  : 'glass rounded-xl border border-white/[0.08] p-3 sm:p-4 mb-3'
              }
            >
              <div
                className={
                  light
                    ? 'grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-white border border-slate-200 mb-3'
                    : 'grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-white/[0.04] border border-white/[0.06] mb-3'
                }
                role="tablist"
                aria-label="Signature source"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={sigMode === 'draw'}
                  className={tabBtn(sigMode === 'draw')}
                  onClick={() => setSigMode('draw')}
                >
                  Draw
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={sigMode === 'upload'}
                  className={tabBtn(sigMode === 'upload')}
                  onClick={() => setSigMode('upload')}
                >
                  Upload file
                </button>
              </div>

              {sigMode === 'draw' && onSignatureFile && (
                <SignaturePad
                  onCommit={(f) => void onSignatureFile(f)}
                  disabled={busy}
                  compact
                  appearance={light ? 'light' : 'dark'}
                />
              )}

              {sigMode === 'upload' && (
                <label
                  className={
                    light
                      ? `flex flex-col items-center justify-center w-full min-h-[7.5rem] border-2 border-dashed rounded-xl transition-colors bg-white ${
                          busy
                            ? 'opacity-70 pointer-events-none border-slate-200'
                            : 'cursor-pointer border-slate-300 hover:border-blue-400 hover:bg-slate-50 active:border-blue-500'
                        } ${status === 'error' ? 'border-red-300 bg-red-50/40' : ''}`
                      : `flex flex-col items-center justify-center w-full min-h-[7.5rem] border-2 border-dashed rounded-xl transition-colors bg-white/[0.02] ${
                          busy ? 'opacity-70 pointer-events-none border-white/[0.08]' : 'cursor-pointer border-white/[0.12] active:border-indigo-500/50'
                        } ${status === 'error' ? 'border-red-500/25' : ''}`
                  }
                >
                  <UploadIcon className={`h-6 w-6 mb-2 ${light ? 'text-slate-500' : 'text-zinc-500'}`} />
                  <span className={`text-xs text-center px-3 leading-snug ${light ? 'text-slate-600' : 'text-zinc-400'}`}>
                    Photo or scan of your signature
                  </span>
                  <span className={`text-[11px] mt-1.5 ${light ? 'text-slate-500' : 'text-zinc-500'}`}>JPG, PNG, HEIC, WebP…</span>
                  <input type="file" name={name} accept={accept} className="hidden" onChange={onFileChange} disabled={busy} />
                </label>
              )}
            </div>
          )}

          {!showSigEditor && status === 'done' && (
            <p className={`text-[11px] mb-2 px-0.5 ${light ? 'text-slate-500' : 'text-zinc-500'}`}>
              Saved. Preview below — or replace.
            </p>
          )}
        </>
      )}

      {/* ── Signature without draw API (edge): classic only ── */}
      {name === 'signature' && !onSignatureFile && renderClassicDashed()}

      {status === 'uploading' && (
        <div className={`mt-2 h-1.5 w-full rounded-full overflow-hidden ${light ? 'bg-slate-200' : 'bg-white/[0.06]'}`}>
          <div
            className={`h-full transition-[width] duration-150 ${light ? 'bg-blue-600' : 'bg-indigo-500'}`}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {previewUrl && onPreviewOpen && (status === 'done' || status === 'uploading' || status === 'presigning') && (
        <button
          type="button"
          onClick={onPreviewOpen}
          className={`mt-3 w-full min-h-[44px] rounded-xl overflow-hidden focus:outline-none sm:max-w-[220px] active:opacity-95 ${
            light
              ? 'border border-slate-200 focus:ring-2 focus:ring-blue-500/30 bg-white'
              : 'border border-white/[0.08] focus:ring-2 focus:ring-indigo-500/40'
          }`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewUrl}
            alt=""
            className={`max-h-32 sm:max-h-36 w-full object-contain mx-auto ${
              name === 'signature'
                ? light
                  ? 'bg-slate-100 brightness-105 contrast-105'
                  : 'bg-white/[0.08] brightness-110 contrast-105'
                : ''
            }`}
          />
          <span className={`block text-[11px] py-2 text-center font-medium ${light ? 'text-slate-500' : 'text-zinc-400'}`}>
            Tap for full size
          </span>
        </button>
      )}

      {status === 'error' && (
        <div className="mt-3 space-y-2">
          {error && (
            <p className={`text-xs text-center leading-snug px-1 ${light ? 'text-red-600' : 'text-red-400'}`}>{error}</p>
          )}
          <button
            type="button"
            onClick={onRetry}
            className={
              light
                ? 'min-h-[44px] w-full sm:w-auto px-4 rounded-xl text-sm text-blue-700 hover:text-blue-800 font-semibold border border-blue-200 bg-blue-50'
                : 'min-h-[44px] w-full sm:w-auto px-4 rounded-xl text-sm text-indigo-400 hover:text-indigo-300 font-semibold border border-indigo-500/25 bg-indigo-500/5'
            }
          >
            Try again
          </button>
        </div>
      )}

      {status === 'done' && hasDrawSignature && (
        <button
          type="button"
          onClick={onRetry}
          className={
            light
              ? 'mt-3 w-full min-h-[44px] rounded-xl text-sm font-semibold text-slate-700 border border-slate-300 bg-white hover:bg-slate-50 active:scale-[0.99] transition-all'
              : 'mt-3 w-full min-h-[44px] rounded-xl text-sm font-semibold text-zinc-300 border border-white/[0.1] bg-white/[0.04] hover:bg-white/[0.07] active:scale-[0.99] transition-all'
          }
        >
          Replace signature
        </button>
      )}
    </div>
  );
};
