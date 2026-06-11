"use client";

import React, { useState } from 'react';
import { Wallet, Activity } from 'lucide-react';
import { PaymentActivitySection } from './PaymentActivitySection';
import { PaymentGatewaysSection } from './PaymentGatewaysSection';

type PaymentsTab = 'activity' | 'gateways';

interface PaymentsHubSectionProps {
  onOpenOrder?: (orderId: string) => void;
}

export const PaymentsHubSection: React.FC<PaymentsHubSectionProps> = ({ onOpenOrder }) => {
  const [tab, setTab] = useState<PaymentsTab>('activity');

  const tabBtn = (id: PaymentsTab, label: string, Icon: typeof Activity) => (
    <button
      type="button"
      onClick={() => setTab(id)}
      className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors"
      style={{
        background: tab === id ? 'rgba(99,102,241,0.15)' : 'transparent',
        color: tab === id ? 'var(--accent)' : 'var(--text-secondary)',
        border: tab === id ? '1px solid rgba(99,102,241,0.3)' : '1px solid transparent',
      }}
    >
      <Icon size={16} />
      {label}
    </button>
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl">
      <header className="mb-6 animate-fade-up">
        <div className="flex items-center gap-3 mb-2">
          <Wallet className="text-[var(--accent)]" size={28} />
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)]">Payments</h1>
        </div>
        <p className="text-sm text-[var(--text-secondary)]">
          Invoice activity from the crypto watcher and gateway configuration for all payment rails.
        </p>
      </header>

      <div className="flex flex-wrap gap-2 mb-6 animate-fade-up delay-1">
        {tabBtn('activity', 'Activity', Activity)}
        {tabBtn('gateways', 'Gateways', Wallet)}
      </div>

      <div className="animate-fade-up delay-2">
        {tab === 'activity' ? (
          <PaymentActivitySection onOpenOrder={onOpenOrder} isVisible />
        ) : (
          <PaymentGatewaysSection />
        )}
      </div>
    </div>
  );
};
