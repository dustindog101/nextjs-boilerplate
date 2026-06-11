"use client";

import { useEffect, useState } from 'react';
import { listCryptoMethods } from '@/lib/payments';
import type { CryptoMethodPublic } from '@/lib/paymentTypes';

/**
 * Loads enabled crypto methods. Never throws — returns [] if gateway is off or unreachable.
 * Safe to use on checkout without breaking manual payment flows.
 */
export function useCryptoPaymentMethods() {
  const [methods, setMethods] = useState<CryptoMethodPublic[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    listCryptoMethods()
      .then((res) => {
        if (!cancelled) setMethods(res.methods ?? []);
      })
      .catch(() => {
        if (!cancelled) setMethods([]);
      })
      .finally(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { methods, loaded, cryptoAvailable: methods.length > 0 };
}
