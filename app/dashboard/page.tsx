"use client";
import React, { useState, useEffect } from 'react';
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

// --- Type ---
interface OrderDetails {
  orderId: string;
  createdAt: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered';
  price: { total: number };
  numberOfIds: number;
}

/* ── Status helpers ── */
const statusConfig: Record<string, { label: string; color: string; dot: string }> = {
  pending: { label: 'Order Created', color: 'text-amber-600', dot: 'bg-amber-500' },
  processing: { label: 'Processing', color: 'text-blue-600', dot: 'bg-blue-500' },
  shipped: { label: 'Shipped', color: 'text-sky-600', dot: 'bg-sky-500' },
  delivered: { label: 'Delivered', color: 'text-emerald-600', dot: 'bg-emerald-500' },
};

function DashboardPage() {
  const { user } = useAuth();
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

  /* ── Stats ── */
  const totalSpent = orders.reduce((s, o) => s + (o.price?.total ?? 0), 0);
  const totalIds = orders.reduce((s, o) => s + (o.numberOfIds ?? 0), 0);
  const activeOrders = orders.filter(o => o.status !== 'delivered').length;

  return (
    <div className="min-h-screen flex flex-col">
      <div className="max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-12 flex-grow">

        {/* ── Welcome Header ── */}
        <header className="mb-8 sm:mb-10 animate-fade-up">
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
            Welcome back{user?.username ? `, ${user.username}` : ''}
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Here&apos;s an overview of your orders.
          </p>
        </header>

        {/* ── Stat Cards ── */}
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
              <div className="flex items-center gap-2 text-slate-400 mb-2">
                {stat.icon}
                <span className="text-xs font-medium uppercase tracking-wider">{stat.label}</span>
              </div>
              <p className={`text-2xl font-bold ${stat.isPrice ? 'text-price' : 'text-slate-900'}`}>
                {stat.value}
              </p>
            </div>
          ))}
        </div>

        {/* ── Orders Section ── */}
        <section>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-slate-900">Recent Orders</h2>
            <Link href="/order" className="text-xs text-blue-600 hover:text-blue-700 transition-colors">
              + New Order
            </Link>
          </div>

          {isLoading ? (
            <div className="glass p-12 flex flex-col items-center justify-center">
              <Spinner size="lg" />
              <p className="mt-4 text-sm text-slate-500">Loading orders…</p>
            </div>
          ) : fetchError ? (
            <div className="glass p-8 text-center border-red-200">
              <p className="text-red-500 font-semibold mb-1">Failed to load orders</p>
              <p className="text-sm text-slate-500">{fetchError}</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="glass p-8 text-center">
              <p className="text-slate-600 font-semibold mb-1">No orders yet</p>
              <p className="text-sm text-slate-500 mb-5">Ready to start your collection?</p>
              <Link href="/order" className="btn btn-primary px-6 py-2.5 text-sm">
                Browse IDs
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {orders.map((order, i) => {
                const cfg = statusConfig[order.status] || statusConfig.pending;
                return (
                  <Link
                    key={order.orderId}
                    href={`/order/view?orderId=${order.orderId}`}
                    className="glass p-5 flex flex-col justify-between hover:border-blue-200 transition-all group animate-fade-up"
                    style={{ animationDelay: `${50 * (i + 1)}ms` }}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors flex items-center gap-2">
                          <HashIcon className="h-4 w-4 text-slate-400" />
                          #{order.orderId.substring(0, 8)}…
                        </h3>
                        <span className={`flex items-center gap-1.5 text-xs font-medium ${cfg.color}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
                          {cfg.label}
                        </span>
                      </div>

                      <div className="space-y-1.5 text-sm text-slate-500">
                        <p className="flex items-center gap-2">
                          <CalendarIcon className="h-3.5 w-3.5" />
                          {new Date(order.createdAt).toLocaleDateString()}
                        </p>
                        <p>{order.numberOfIds} ID{order.numberOfIds !== 1 ? 's' : ''}</p>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-price font-bold">
                        ${order.price?.total ? order.price.total.toFixed(0) : 'N/A'}
                      </span>
                      <span className="text-xs text-slate-400 group-hover:text-blue-600 transition-colors">
                        View Details →
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      </div>

      <Footer />
    </div>
  );
}

export default withAuth(DashboardPage);
