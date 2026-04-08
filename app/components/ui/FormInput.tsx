"use client";

import React from 'react';

interface FormInputProps {
    label?: string;
    name: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    placeholder?: string;
    type?: string;
    readOnly?: boolean;
    disabled?: boolean;
    className?: string;
}

export const FormInput: React.FC<FormInputProps> = ({
    label,
    name,
    value,
    onChange,
    placeholder = '',
    type = 'text',
    readOnly = false,
    disabled = false,
    className = '',
}) => (
    <div className={className}>
        {label && (
            <label htmlFor={name} className="text-label block mb-2">
                {label}
            </label>
        )}
        <input
            type={type}
            id={name}
            name={name}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            readOnly={readOnly}
            disabled={disabled}
            className={`w-full rounded-xl px-4 py-3 text-sm [color-scheme:dark]
                bg-white/[0.06] border border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)]
                focus:ring-2 focus:ring-[var(--accent)]/35 focus:border-[var(--accent)]/50 focus:outline-none transition
                ${readOnly ? 'opacity-60 cursor-default' : ''}
                ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
        />
    </div>
);
