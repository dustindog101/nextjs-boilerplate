'use client';

import React from 'react';
import { productSelectGroups } from '@/lib/productCatalog';

interface ProductSelectProps {
    name: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    className?: string;
    label?: string;
    labelClassName?: string;
    disabled?: boolean;
}

export function ProductSelect({
    name,
    value,
    onChange,
    className,
    label,
    labelClassName,
    disabled,
}: ProductSelectProps) {
    const groups = productSelectGroups();

    return (
        <div>
            {label && <label className={labelClassName}>{label}</label>}
            <select name={name} value={value} onChange={onChange} className={className} disabled={disabled}>
                {groups.map((group) => (
                    <optgroup key={group.label} label={group.label}>
                        {group.options.map((opt) => (
                            <option key={opt.id} value={opt.id}>
                                {opt.label}
                            </option>
                        ))}
                    </optgroup>
                ))}
            </select>
        </div>
    );
}
