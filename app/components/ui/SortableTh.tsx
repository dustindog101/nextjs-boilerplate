"use client";

import React from 'react';
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import type { SortDirection } from '@/lib/tableSort';

interface SortableThProps {
  columnKey: string;
  sortKey: string;
  direction: SortDirection;
  onSort: (key: string) => void;
  children: React.ReactNode;
  align?: 'left' | 'right' | 'center';
  className?: string;
  style?: React.CSSProperties;
}

export const SortableTh: React.FC<SortableThProps> = ({
  columnKey,
  sortKey,
  direction,
  onSort,
  children,
  align = 'left',
  className = '',
  style,
}) => {
  const active = sortKey === columnKey;
  const alignCls = align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left';

  return (
    <th
      className={`${alignCls} ${className}`.trim()}
      style={style}
      aria-sort={active ? (direction === 'asc' ? 'ascending' : 'descending') : 'none'}
      scope="col"
    >
      <button
        type="button"
        onClick={() => onSort(columnKey)}
        className="inline-flex items-center gap-1.5 max-w-full uppercase tracking-wider font-semibold text-xs text-inherit hover:opacity-90 transition-opacity w-full min-w-0 rounded-md focus:outline-none focus-visible:ring-1 focus-visible:ring-[var(--border-accent)] focus-visible:ring-offset-0"
        style={align === 'right' ? { justifyContent: 'flex-end' } : align === 'center' ? { justifyContent: 'center' } : { justifyContent: 'flex-start' }}
      >
        <span className="truncate">{children}</span>
        {active ? (
          direction === 'asc' ? (
            <ArrowUp className="h-3.5 w-3.5 shrink-0 opacity-90" aria-hidden />
          ) : (
            <ArrowDown className="h-3.5 w-3.5 shrink-0 opacity-90" aria-hidden />
          )
        ) : (
          <ArrowUpDown className="h-3.5 w-3.5 shrink-0 opacity-40" aria-hidden />
        )}
      </button>
    </th>
  );
};
