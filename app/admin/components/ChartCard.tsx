"use client";
import React, { ReactNode } from 'react';

interface ChartCardProps {
  title: string;
  children: ReactNode;
}

export const ChartCard: React.FC<ChartCardProps> = ({ title, children }) => (
  <div className="glass p-4 sm:p-6">
    <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-4">{title}</h3>
    <div className="h-72 w-full">
      {children}
    </div>
  </div>
);