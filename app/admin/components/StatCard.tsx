"use client";
import React, { ReactNode } from 'react';

interface StatCardProps {
  title: string;
  value: string;
  icon: ReactNode;
  change?: string;
  changeType?: 'increase' | 'decrease';
}

export const StatCard: React.FC<StatCardProps> = ({ title, value, icon, change, changeType }) => {
  const changeColor = changeType === 'increase' ? 'text-emerald-600' : 'text-red-500';

  return (
    <div className="glass p-5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">{title}</p>
        <div className="text-slate-400">{icon}</div>
      </div>
      <div className="mt-2">
        <h3 className="text-2xl font-bold text-slate-900">{value}</h3>
        {change && (
          <p className={`text-xs mt-1 ${changeColor}`}>
            {change} vs last month
          </p>
        )}
      </div>
    </div>
  );
};