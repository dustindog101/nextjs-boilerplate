"use client";
import React, { useState, useEffect } from 'react';
import { LineChart, BarChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { StatCard } from './StatCard';
import { ChartCard } from './ChartCard';
import { DollarSign, ShoppingCart, Users, Activity } from 'lucide-react';
import { adminGetMetrics, AdminMetrics } from '../../../lib/apiClient';
import { Spinner } from '../../components/ui';

export const MetricsSection = () => {
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await adminGetMetrics();
        setMetrics(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  if (isLoading) return <div className="p-12 flex items-center justify-center"><Spinner size="lg" /></div>;
  if (error) return <div className="p-6 text-center text-red-400">Error loading metrics: {error}</div>;
  if (!metrics) return null;

  // Build chart data from status breakdown
  const statusData = Object.entries(metrics.statusBreakdown).map(([name, count]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    orders: count,
  }));

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Revenue" value={`$${metrics.totalRevenue.toLocaleString()}`} icon={<DollarSign size={20} />} />
        <StatCard title="Total Orders" value={String(metrics.totalOrders)} icon={<ShoppingCart size={20} />} />
        <StatCard title="Total Users" value={String(metrics.totalUsers)} icon={<Users size={20} />} />
        <StatCard title="Resellers" value={String(metrics.resellerCount)} icon={<Activity size={20} />} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Orders by Status">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={statusData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="name" stroke="#71717a" fontSize={12} />
              <YAxis stroke="#71717a" fontSize={12} allowDecimals={false} />
              <Tooltip
                contentStyle={{ backgroundColor: '#18181b', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px' }}
                labelStyle={{ color: '#fff' }}
                itemStyle={{ color: '#a5b4fc' }}
              />
              <Bar dataKey="orders" fill="#6366f1" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
};