"use client";

import React from 'react';

interface FormInputProps {
    label: string;
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
        <label htmlFor={name} className="text-label block mb-2">
            {label}
        </label>
        <input
            type={type}
            id={name}
            name={name}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            readOnly={readOnly}
            disabled={disabled}
            className={`w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-white text-sm placeholder-zinc-500
                focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/60 focus:outline-none transition
                ${readOnly ? 'opacity-60 cursor-default' : ''}
                ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
        />
    </div>
);
