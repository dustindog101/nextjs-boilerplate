"use client";

import React from 'react';
import { UploadIcon } from '../icons';

interface FileInputProps {
    label: string;
    name: string;
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
    fileName?: string;
    readOnly?: boolean;
    className?: string;
}

export const FileInput: React.FC<FileInputProps> = ({
    label,
    name,
    onChange,
    fileName,
    readOnly = false,
    className = '',
}) => (
    <div className={className}>
        <label className="text-label block mb-2">
            {label}
        </label>
        {readOnly ? (
            <div className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-zinc-400 flex items-center gap-2">
                <UploadIcon className="h-4 w-4" />
                {fileName || 'No file uploaded'}
            </div>
        ) : (
            <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-white/[0.12] rounded-xl cursor-pointer hover:border-indigo-500/40 transition-colors bg-white/[0.02]">
                <UploadIcon className="h-5 w-5 text-zinc-500 mb-1" />
                <span className="text-xs text-zinc-500">
                    {fileName || 'Click to upload'}
                </span>
                <input
                    type="file"
                    name={name}
                    onChange={onChange}
                    className="hidden"
                    accept="image/*"
                />
            </label>
        )}
    </div>
);
