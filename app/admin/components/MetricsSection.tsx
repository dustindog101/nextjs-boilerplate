"use client";
import React from 'react';
import { LineChart, BarChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { StatCard } from './StatCard';
import { ChartCard } from './ChartCard';
import { DollarSign, ShoppingCart, Users, Activity } from 'lucide-react';

const revenueData = [
  { name: 'Jan', revenue: 4000 }, { name: 'Feb', revenue: 3000 },
  { name: 'Mar', revenue: 5000 }, { name: 'Apr', revenue: 4500 },
  { name: 'May', revenue: 6000 }, { name: 'Jun', revenue: 5500 },
];
const ordersData = [
  { name: 'Mon', orders: 12 }, { name: 'Tue', orders: 19 },
  { name: 'Wed', orders: 8 }, { name: 'Thu', orders: 15 },
  { name: 'Fri', orders: 22 }, { name: 'Sat', orders: 30 },
  { name: 'Sun', orders: 25 },
];

export const MetricsSection = () => (
  <div className="p-4 sm:p-6 space-y-6">
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard title="Total Revenue" value="$45,231" icon={<DollarSign size={20} />} change="+12.5%" changeType="increase" />
      <StatCard title="New Orders" value="2,350" icon={<ShoppingCart size={20} />} change="+5.2%" changeType="increase" />
      <StatCard title="New Users" value="1,210" icon={<Users size={20} />} change="-2.1%" changeType="decrease" />
      <StatCard title="Avg. Order Value" value="$19.25" icon={<Activity size={20} />} change="+1.8%" changeType="increase" />
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <ChartCard title="Revenue Over Time">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={revenueData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis dataKey="name" stroke="#71717A" fontSize={12} />
            <YAxis stroke="#71717A" fontSize={12} />
            <Tooltip contentStyle={{ backgroundColor: 'rgba(9,9,11,0.9)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px' }} />
            <Legend />
            <Line type="monotone" dataKey="revenue" stroke="#6366F1" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 6 }} />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>
      <ChartCard title="Orders This Week">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={ordersData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis dataKey="name" stroke="#71717A" fontSize={12} />
            <YAxis stroke="#71717A" fontSize={12} />
            <Tooltip contentStyle={{ backgroundColor: 'rgba(9,9,11,0.9)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px' }} />
            <Legend />
            <Bar dataKey="orders" fill="#6366F1" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  </div>
);