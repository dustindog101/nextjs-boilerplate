"use client";
import React, { useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { StatCard } from './StatCard';
import { ChartCard } from './ChartCard';
import { DollarSign, ShoppingCart, Users, Activity } from 'lucide-react';
import { Spinner } from '../../components/ui';
import { useAdminData } from '../AdminDataContext';

export const MetricsSection = () => {
  const { metrics, loadMetrics } = useAdminData();

  useEffect(() => { loadMetrics(); }, [loadMetrics]);

  if (metrics.isLoading) return <div className="p-12 flex items-center justify-center"><Spinner size="lg" /></div>;
  if (metrics.error) return <div className="p-6 text-center text-red-500">Error loading metrics: {metrics.error}</div>;
  if (!metrics.data) return null;

  const m = metrics.data;
  const statusData = Object.entries(m.statusBreakdown).map(([name, count]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    orders: count,
  }));

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Revenue" value={`$${m.totalRevenue.toLocaleString()}`} icon={<DollarSign size={20} />} />
        <StatCard title="Total Orders" value={String(m.totalOrders)} icon={<ShoppingCart size={20} />} />
        <StatCard title="Total Users" value={String(m.totalUsers)} icon={<Users size={20} />} />
        <StatCard title="Resellers" value={String(m.resellerCount)} icon={<Activity size={20} />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Orders by Status">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={statusData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="name" stroke="#94A3B8" fontSize={12} />
              <YAxis stroke="#94A3B8" fontSize={12} allowDecimals={false} />
              <Tooltip
                contentStyle={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                labelStyle={{ color: '#0F172A' }}
                itemStyle={{ color: '#2563EB' }}
              />
              <Bar dataKey="orders" fill="#2563EB" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
};