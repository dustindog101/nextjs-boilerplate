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
                className={`w-full rounded-xl px-4 py-3 text-sm appearance-none [color-scheme:dark]
                    bg-white/[0.06] border border-[var(--border)] text-[var(--text-primary)]
                    focus:ring-2 focus:ring-[var(--accent)]/35 focus:border-[var(--accent)]/50 focus:outline-none transition
                    ${readOnly || disabled ? 'cursor-not-allowed opacity-50' : ''}`}
            >
                <option value="" style={{ backgroundColor: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}>
                    Select...
                </option>
                {options.map((opt) => (
                    <option key={opt} value={opt} style={{ backgroundColor: 'var(--bg-elevated)', color: 'var(--text-primary)' }}>
                        {opt}
                    </option>
                ))}
            </select>
            <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-tertiary)] pointer-events-none" />
        </div>
    </div>
);
