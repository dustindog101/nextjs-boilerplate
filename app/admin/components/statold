// --- START OF FILE app/admin-dashboard/components/StatCard.tsx ---
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
  const changeColor = changeType === 'increase' ? 'text-green-400' : 'text-red-400';

  return (
    <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-gray-400">{title}</p>
        <div className="text-gray-500">{icon}</div>
      </div>
      <div className="mt-2">
        <h3 className="text-3xl font-bold text-white">{value}</h3>
        {change && (
          <p className={`text-sm mt-1 ${changeColor}`}>
            {change} vs last month
          </p>
        )}
      </div>
    </div>
  );
};
// --- END OF FILE app/admin-dashboard/components/StatCard.tsx ---