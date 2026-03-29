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
  const changeColor = changeType === 'increase' ? 'var(--success)' : 'var(--error)';

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>{title}</p>
        <div style={{ color: 'var(--accent)' }}>{icon}</div>
      </div>
      <div className="mt-2">
        <h3 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{value}</h3>
        {change && (
          <p className="text-xs mt-1" style={{ color: changeColor }}>
            {change} vs last month
          </p>
        )}
      </div>
    </div>
  );
};