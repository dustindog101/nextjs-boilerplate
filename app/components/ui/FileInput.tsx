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
        <label className="block text-sm font-medium text-gray-400 mb-1">
            {label}
        </label>
        {readOnly ? (
            <div className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-3 py-2 text-gray-400 flex items-center">
                <UploadIcon className="h-4 w-4 mr-2" />
                {fileName || 'No file uploaded'}
            </div>
        ) : (
            <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-gray-600 rounded-lg cursor-pointer hover:border-blue-500 transition-colors bg-gray-700/30">
                <UploadIcon className="h-6 w-6 text-gray-400 mb-1" />
                <span className="text-sm text-gray-400">
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
