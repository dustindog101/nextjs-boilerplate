// --- START OF FILE app/admin-dashboard/ChartCard.tsx ---
import React, { ReactNode } from 'react';

interface ChartCardProps {
  title: string;
  children: ReactNode;
}

export const ChartCard: React.FC<ChartCardProps> = ({ title, children }) => (
  <div className="bg-gray-800 p-4 sm:p-6 rounded-lg border border-gray-700">
    <h3 className="text-lg font-semibold text-white mb-4">{title}</h3>
    <div className="h-72 w-full">
      {children}
    </div>
  </div>
);
// --- END OF FILE app/admin-dashboard/ChartCard.tsx ---