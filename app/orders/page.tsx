"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { withAuth } from '../components/withAuth';
import { fetchUserOrders } from '../../lib/apiClient';
import {
  PackageIcon,
  CalendarIcon,
  HashIcon,
  DollarSignIcon,
} from '../components/icons';
import { Footer, Spinner } from '../components/ui';

// --- Type ---
interface OrderDetails {
  orderId: string;
  createdAt: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered';
  price: { total: number };
  numberOfIds: number;
}

const statusConfig: Record<string, { label: string; color: string; dot: string }> = {
  pending: { label: 'Order Created', color: 'text-amber-400', dot: 'bg-amber-400' },
  processing: { label: 'Processing', color: 'text-indigo-400', dot: 'bg-indigo-400' },
  shipped: { label: 'Shipped', color: 'text-sky-400', dot: 'bg-sky-400' },
  delivered: { label: 'Delivered', color: 'text-emerald-400', dot: 'bg-emerald-400' },
};

function MyOrdersPage() {
  const [orders, setOrders] = useState<OrderDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchUserOrders();
        const sorted = data.orders.sort(
          (a: OrderDetails, b: OrderDetails) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setOrders(sorted);
      } catch (err: any) {
        setFetchError(err.message || 'Failed to fetch orders.');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <div className="max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-12 flex-grow">

        <header className="mb-8 sm:mb-10 animate-fade-up">
          <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
            My Orders
          </h1>
          <p className="mt-2 text-sm text-zinc-400">
            {orders.length > 0 ? `${orders.length} order${orders.length !== 1 ? 's' : ''} total` : 'View and track your order history.'}
          </p>
        </header>

        {isLoading ? (
          <div className="glass p-12 flex flex-col items-center justify-center animate-fade-up">
            <Spinner size="lg" />
            <p className="mt-4 text-sm text-zinc-400">Loading your order history…</p>
          </div>
        ) : fetchError ? (
          <div className="glass p-8 text-center animate-fade-up">
            <p className="text-red-400 font-semibold mb-1">Error Fetching Orders</p>
            <p className="text-sm text-zinc-500">{fetchError}</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="glass p-8 text-center animate-fade-up">
            <p className="text-zinc-300 font-semibold text-lg mb-1">No orders found</p>
            <p className="text-sm text-zinc-500 mb-5">Ready to start your collection?</p>
            <Link href="/order" className="btn btn-primary px-6 py-2.5 text-sm inline-flex items-center gap-2">
              <PackageIcon className="h-4 w-4" /> Start New Order
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {orders.map((order, i) => {
              const cfg = statusConfig[order.status] || statusConfig.pending;
              return (
                <Link
                  key={order.orderId}
                  href={`/track?orderId=${order.orderId}`}
                  className="glass p-5 flex flex-col justify-between hover:border-indigo-500/30 transition-all group animate-fade-up"
                  style={{ animationDelay: `${50 * (i + 1)}ms` }}
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-bold text-white group-hover:text-indigo-300 transition-colors flex items-center gap-2">
                        <HashIcon className="h-4 w-4 text-zinc-500" />
                        #{order.orderId.substring(0, 8)}…
                      </h3>
                      <span className={`flex items-center gap-1.5 text-xs font-medium ${cfg.color}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
                        {cfg.label}
                      </span>
                    </div>

                    <div className="space-y-1.5 text-sm text-zinc-400">
                      <p className="flex items-center gap-2">
                        <CalendarIcon className="h-3.5 w-3.5" />
                        {new Date(order.createdAt).toLocaleDateString()}
                      </p>
                      <p>{order.numberOfIds} ID{order.numberOfIds !== 1 ? 's' : ''}</p>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between">
                    <span className="text-price font-bold flex items-center gap-1">
                      <DollarSignIcon className="h-3.5 w-3.5" />
                      ${order.price?.total ? order.price.total.toFixed(2) : 'N/A'}
                    </span>
                    <span className="text-xs text-zinc-500 group-hover:text-indigo-400 transition-colors">
                      View Details →
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}

export default withAuth(MyOrdersPage);