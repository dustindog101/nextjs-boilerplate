"use client";

import React from 'react';
import { CryptoPayModal } from './CryptoPayModal';
import type { CryptoAssetId } from '@/lib/paymentConstants';
import type { OrderDetails } from '@/lib/types';

type OrderPaymentContext = Pick<
  OrderDetails,
  'orderId' | 'paymentStatus' | 'paymentMethod' | 'price' | 'cryptoTxHash'
>;

export interface OrderPayModalHostProps {
  payOrderId: string | null;
  payAsset: CryptoAssetId | null;
  payOrder?: OrderPaymentContext | null;
  payToken?: string | null;
  resellerView?: boolean;
  onClose: () => void;
  onPaid?: () => void;
}

export function OrderPayModalHost({
  payOrderId,
  payAsset,
  payOrder,
  payToken,
  resellerView,
  onClose,
  onPaid,
}: OrderPayModalHostProps) {
  if (!payOrderId) return null;

  return (
    <CryptoPayModal
      orderId={payOrderId}
      order={payOrder ?? undefined}
      open={!!payOrderId}
      onClose={onClose}
      onPaid={onPaid}
      defaultAsset={payAsset}
      payToken={payToken}
      resellerView={resellerView}
    />
  );
}
