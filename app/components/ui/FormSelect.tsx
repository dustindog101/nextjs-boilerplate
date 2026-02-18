"use client";

import React from 'react';
import { ChevronDownIcon } from '../icons';

interface FormSelectProps {
    label?: string;
    name: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    options: string[];
    readOnly?: boolean;
    disabled?: boolean;
    className?: string;
}

export const FormSelect: React.FC<FormSelectProps> = ({
    label,
    name,
    value,
    onChange,
    options,
    readOnly = false,
    disabled = false,
    className = '',
}) => (
    <div className={className}>
        {label && (
            <label className="text-label block mb-2">
                {label}
            </label>
        )}
        <div className="relative">
            <select
                name={name}
                value={value}
                onChange={onChange}
                disabled={readOnly || disabled}
                className={`w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-white text-sm
                    focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/60 focus:outline-none transition appearance-none
                    ${readOnly || disabled ? 'cursor-not-allowed opacity-50' : ''}`}
            >
                <option value="">Select...</option>
                {options.map((opt) => (
                    <option key={opt} value={opt}>
                        {opt}
                    </option>
                ))}
            </select>
            <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 pointer-events-none" />
        </div>
    </div>
);
