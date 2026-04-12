"use client";

import { useCallback, useState } from 'react';
import type { SortDirection } from '@/lib/tableSort';

/** Toggle: new column → asc; same column → flip asc/desc. */
export function useTableSortState<K extends string>(
  defaultKey: K,
  defaultDir: SortDirection = 'desc'
) {
  const [sortKey, setSortKey] = useState<K>(defaultKey);
  const [direction, setDirection] = useState<SortDirection>(defaultDir);

  const toggleSort = useCallback(
    (key: string) => {
      if (sortKey !== key) {
        setSortKey(key as K);
        setDirection('asc');
      } else {
        setDirection(d => (d === 'asc' ? 'desc' : 'asc'));
      }
    },
    [sortKey]
  );

  return { sortKey, direction, toggleSort };
}
