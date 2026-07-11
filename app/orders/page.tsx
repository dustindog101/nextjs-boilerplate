"use client";

import React, { Suspense, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { withAuth } from '../components/withAuth';
import { fetchUserOrders } from '../../lib/apiClient';
import { PackageIcon } from '../components/icons';
import { Footer, Spinner } from '../components/ui';
import { OrderListCard } from '../components/order/OrderListCard';
import { OrderPayModalHost } from '../components/payments/OrderPayModalHost';
import { useOrderPayModal } from '../hooks/useOrderPayModal';
import type { OrderDetails } from '@/lib/types';

function MyOrdersContent() {
  const [orders, setOrders] = useState<OrderDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const {
    payOrderId,
    payAsset,
    payOrder,
    openPayModal,
    closePayModal,
    syncPayOrderFromList,
  } = useOrderPayModal({ cleanUrlPath: '/orders', ready: !isLoading });

  const loadOrders = useCallback(async () => {
    try {
      const data = await fetchUserOrders();
      const sorted = (data.orders as OrderDetails[]).sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setOrders(sorted);
      setFetchError(null);
      return sorted;
    } catch (err: unknown) {
      setFetchError(err instanceof Error ? err.message : 'Failed to fetch orders.');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  useEffect(() => {
    syncPayOrderFromList(orders);
  }, [orders, syncPayOrderFromList]);

  const handlePaid = () => {
    loadOrders();
  };

  const modalOrder = payOrder ?? orders.find((o) => o.orderId === payOrderId) ?? null;

  return (
    <>
      <div className="min-h-screen flex flex-col">
        <div className="max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-12 flex-grow">
          <header className="mb-8 sm:mb-10 animate-fade-up">
            <h1 className="text-3xl sm:text-4xl font-bold text-[var(--text-primary)] tracking-tight">
              My Orders
            </h1>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              {orders.length > 0
                ? `${orders.length} order${orders.length !== 1 ? 's' : ''} total`
                : 'View and track your order history.'}
            </p>
          </header>

          {isLoading ? (
            <div className="glass p-12 flex flex-col items-center justify-center animate-fade-up">
              <Spinner size="lg" />
              <p className="mt-4 text-sm text-[var(--text-secondary)]">Loading your order history…</p>
            </div>
          ) : fetchError ? (
            <div className="glass p-8 text-center animate-fade-up">
              <p className="text-red-400 font-semibold mb-1">Error Fetching Orders</p>
              <p className="text-sm text-[var(--text-secondary)]">{fetchError}</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="glass p-8 text-center animate-fade-up">
              <p className="text-[var(--text-primary)] font-semibold text-lg mb-1">No orders found</p>
              <p className="text-sm text-[var(--text-secondary)] mb-5">Ready to start your collection?</p>
              <Link
                href="/order"
                className="btn btn-primary px-6 py-2.5 text-sm inline-flex items-center gap-2"
              >
                <PackageIcon className="h-4 w-4" /> Start New Order
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {orders.map((order, i) => (
                <OrderListCard
                  key={order.orderId}
                  order={order}
                  index={i}
                  viewHref={`/order/view?orderId=${order.orderId}`}
                />
              ))}
            </div>
          )}
        </div>

        <Footer />
      </div>

      <OrderPayModalHost
        payOrderId={payOrderId}
        payAsset={payAsset}
        payOrder={modalOrder}
        onClose={closePayModal}
        onPaid={handlePaid}
      />
    </>
  );
}

function MyOrdersPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Spinner size="lg" />
        </div>
      }
    >
      <MyOrdersContent />
    </Suspense>
  );
}

export default withAuth(MyOrdersPage);
