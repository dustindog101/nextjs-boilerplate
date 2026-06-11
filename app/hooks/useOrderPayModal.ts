"use client";

import { useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getStorageItem } from '@/lib/storage';
import { cryptoAssetFromOrder, isCryptoOrder, isOrderUnpaid } from '@/lib/payments/orderHelpers';
import { createPaySession } from '@/lib/payments/paySession';
import type { CryptoAssetId } from '@/lib/paymentConstants';
import type { OrderDetails } from '@/lib/types';

export interface UseOrderPayModalOptions {
  /** Path to strip pay param from after opening modal (e.g. '/orders', '/dashboard') */
  cleanUrlPath?: string;
  /** Wait until orders/data loaded before cleaning URL */
  ready?: boolean;
  /** Single order context (track page) — used when pay=1 */
  order?: OrderDetails | null;
  /** Reseller dashboard — uses reseller-scoped intent API */
  resellerView?: boolean;
}

export function useOrderPayModal(options: UseOrderPayModalOptions = {}) {
  const { cleanUrlPath, ready = true, order: orderContext, resellerView = false } = options;
  const router = useRouter();
  const searchParams = useSearchParams();

  const [payOrderId, setPayOrderId] = useState<string | null>(null);
  const [payAsset, setPayAsset] = useState<CryptoAssetId | null>(null);
  const [payOrder, setPayOrder] = useState<OrderDetails | null>(null);
  const [payToken, setPayToken] = useState<string | null>(null);

  const needsGuestPayToken = useCallback(
    (order?: OrderDetails | null) => {
      if (resellerView) return false;
      if (getStorageItem('idPirateAuthToken')) return false;
      return !!(order && isOrderUnpaid(order) && isCryptoOrder(order));
    },
    [resellerView]
  );

  const ensurePayToken = useCallback(
    async (orderId: string, order?: OrderDetails | null) => {
      if (!needsGuestPayToken(order)) {
        setPayToken(null);
        return;
      }
      const session = await createPaySession(orderId);
      setPayToken(session.payToken);
    },
    [needsGuestPayToken]
  );

  const openPayModal = useCallback(
    async (orderId: string, asset: CryptoAssetId | null, order?: OrderDetails | null) => {
      try {
        await ensurePayToken(orderId, order);
      } catch {
        // Logged-in users do not need pay token
      }
      setPayOrderId(orderId);
      setPayAsset(asset);
      if (order) setPayOrder(order);
    },
    [ensurePayToken]
  );

  const closePayModal = useCallback(() => {
    setPayOrderId(null);
    setPayAsset(null);
    setPayOrder(null);
    setPayToken(null);
  }, []);

  const resolveOrderFromList = useCallback(
    (orders: OrderDetails[], orderId: string): OrderDetails | undefined =>
      orders.find((o) => o.orderId === orderId),
    []
  );

  useEffect(() => {
    const payParam = searchParams.get('pay');
    if (!payParam || !ready) return;

    const openFromDeepLink = async () => {
      if (payParam === '1' && orderContext) {
        try {
          await ensurePayToken(orderContext.orderId, orderContext);
        } catch {
          // Deep link may still open modal; user can retry
        }
        setPayOrderId(orderContext.orderId);
        setPayAsset(cryptoAssetFromOrder(orderContext));
        setPayOrder(orderContext);
      } else if (payParam !== '1') {
        setPayOrderId(payParam);
      }

      if (cleanUrlPath) {
        const params = new URLSearchParams(searchParams.toString());
        params.delete('pay');
        const qs = params.toString();
        router.replace(`${cleanUrlPath}${qs ? `?${qs}` : ''}`, { scroll: false });
      }
    };

    void openFromDeepLink();
  }, [searchParams, ready, orderContext, cleanUrlPath, router, ensurePayToken]);

  const syncPayOrderFromList = useCallback(
    (orders: OrderDetails[]) => {
      if (!payOrderId || payOrderId === '1') return;
      const found = resolveOrderFromList(orders, payOrderId);
      if (found) {
        setPayOrder(found);
        if (!payAsset) setPayAsset(cryptoAssetFromOrder(found));
      }
    },
    [payOrderId, payAsset, resolveOrderFromList]
  );

  return {
    payOrderId,
    payAsset,
    payOrder,
    payToken,
    openPayModal,
    closePayModal,
    syncPayOrderFromList,
    setPayOrder,
  };
}
