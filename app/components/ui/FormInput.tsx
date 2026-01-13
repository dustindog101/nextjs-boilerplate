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
    className = '',
}) => (
    <div className={className}>
        <label className="block text-sm font-medium text-gray-400 mb-1">
            {label}
        </label>
        <input
            type={type}
            name={name}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            readOnly={readOnly}
            className={`w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 ${readOnly ? 'cursor-not-allowed opacity-70' : ''
                }`}
        />
    </div>
);
