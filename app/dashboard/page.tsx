"use client";
import React, { Suspense, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { withAuth } from '../components/withAuth';
import { useAuth } from '../hooks/useAuth';
import { fetchUserOrders } from '../../lib/apiClient';
import {
  PackageIcon,
  CalendarIcon,
  HashIcon,
  DollarSignIcon,
} from '../components/icons';
import { Footer, Spinner } from '../components/ui';
import { OrderListCard } from '../components/order/OrderListCard';
import { OrderPayModalHost } from '../components/payments/OrderPayModalHost';
import { useOrderPayModal } from '../hooks/useOrderPayModal';
import type { OrderDetails } from '@/lib/types';

function DashboardContent() {
  const { user } = useAuth();
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
  } = useOrderPayModal({ cleanUrlPath: '/dashboard', ready: !isLoading });

  const loadOrders = useCallback(async () => {
    try {
      const data = await fetchUserOrders();
      const sorted = (data.orders as OrderDetails[]).sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setOrders(sorted);
      setFetchError(null);
    } catch (err: unknown) {
      setFetchError(err instanceof Error ? err.message : 'Failed to fetch orders.');
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

  const totalSpent = orders.reduce((s, o) => s + (o.price?.total ?? 0), 0);
  const totalIds = orders.reduce((s, o) => s + (o.numberOfIds ?? 0), 0);
  const activeOrders = orders.filter(o => o.status !== 'delivered').length;
  const modalOrder = payOrder ?? orders.find((o) => o.orderId === payOrderId) ?? null;

  return (
    <div className="min-h-screen flex flex-col">
      <div className="max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-12 flex-grow">

        <header className="mb-8 sm:mb-10 animate-fade-up">
          <h1 className="text-3xl sm:text-4xl font-bold text-[var(--text-primary)] tracking-tight">
            Welcome back{user?.username ? `, ${user.username}` : ''}
          </h1>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            Here&apos;s an overview of your orders.
          </p>
        </header>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-8 sm:mb-10">
          {[
            { label: 'Total Orders', value: orders.length, icon: <PackageIcon className="h-5 w-5" /> },
            { label: 'Total IDs', value: totalIds, icon: <HashIcon className="h-5 w-5" /> },
            { label: 'Active', value: activeOrders, icon: <CalendarIcon className="h-5 w-5" /> },
            { label: 'Total Spent', value: `$${totalSpent.toFixed(0)}`, icon: <DollarSignIcon className="h-5 w-5" />, isPrice: true },
          ].map((stat, i) => (
            <div
              key={stat.label}
              className="glass p-4 animate-fade-up"
              style={{ animationDelay: `${50 * (i + 1)}ms` }}
            >
              <div className="flex items-center gap-2 text-[var(--text-secondary)] mb-2">
                {stat.icon}
                <span className="text-xs font-medium uppercase tracking-wider">{stat.label}</span>
              </div>
              <p className={`text-2xl font-bold ${stat.isPrice ? 'text-price' : 'text-[var(--text-primary)]'}`}>
                {stat.value}
              </p>
            </div>
          ))}
        </div>

        <section>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-[var(--text-primary)]">Recent Orders</h2>
            <Link href="/order" className="text-xs text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors">
              + New Order
            </Link>
          </div>

          {isLoading ? (
            <div className="glass p-12 flex flex-col items-center justify-center">
              <Spinner size="lg" />
              <p className="mt-4 text-sm text-[var(--text-secondary)]">Loading orders…</p>
            </div>
          ) : fetchError ? (
            <div className="glass p-8 text-center border border-red-500/20">
              <p className="text-red-400 font-semibold mb-1">Failed to load orders</p>
              <p className="text-sm text-[var(--text-secondary)]">{fetchError}</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="glass p-8 text-center">
              <p className="text-[var(--text-primary)] font-semibold mb-1">No orders yet</p>
              <p className="text-sm text-[var(--text-secondary)] mb-5">Ready to start your collection?</p>
              <Link href="/order" className="btn btn-primary px-6 py-2.5 text-sm">
                Browse IDs
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {orders.map((order, i) => (
                <OrderListCard
                  key={order.orderId}
                  order={order}
                  index={i}
                  viewHref={`/order/view?orderId=${order.orderId}${user?.isReseller ? '&from=reseller' : ''}`}
                  onPay={(orderId, asset) => openPayModal(orderId, asset, order)}
                />
              ))}
            </div>
          )}
        </section>
      </div>

      <Footer />

      <OrderPayModalHost
        payOrderId={payOrderId}
        payAsset={payAsset}
        payOrder={modalOrder}
        onClose={closePayModal}
        onPaid={loadOrders}
      />
    </div>
  );
}

function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Spinner size="lg" />
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}

export default withAuth(DashboardPage);
