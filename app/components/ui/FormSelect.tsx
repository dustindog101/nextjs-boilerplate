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
    className?: string;
}

export const FormSelect: React.FC<FormSelectProps> = ({
    label,
    name,
    value,
    onChange,
    options,
    readOnly = false,
    className = '',
}) => (
    <div className={className}>
        {label && (
            <label className="block text-sm font-medium text-gray-400 mb-1">
                {label}
            </label>
        )}
        <div className="relative">
            <select
                name={name}
                value={value}
                onChange={onChange}
                disabled={readOnly}
                className={`w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 appearance-none ${readOnly ? 'cursor-not-allowed opacity-70' : ''
                    }`}
            >
                <option value="">Select...</option>
                {options.map((opt) => (
                    <option key={opt} value={opt}>
                        {opt}
                    </option>
                ))}
            </select>
            <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
        </div>
    </div>
);
