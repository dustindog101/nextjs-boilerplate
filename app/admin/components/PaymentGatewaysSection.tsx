"use client";

import React, { useCallback, useEffect, useState } from 'react';
import { Save, RefreshCw } from 'lucide-react';
import {
  adminGetPaymentSettings,
  adminUpdatePaymentSettings,
  PAYMENT_RAILS,
} from '@/lib/payments';
import { CRYPTO_ASSETS, DEFAULT_PAYMENT_INTENT_TTL_HOURS } from '@/lib/paymentConstants';
import type { PaymentGateways, SitePaymentSettings } from '@/lib/paymentTypes';
import { Spinner } from '../../components/ui/Spinner';

function defaultGateways(): PaymentGateways {
  return Object.fromEntries(
    CRYPTO_ASSETS.map((a) => [
      a.id,
      { enabled: false, address: '', minConfirmations: a.id.startsWith('usdc') ? 12 : 1 },
    ])
  ) as PaymentGateways;
}

export const PaymentGatewaysSection = () => {
  const [gateways, setGateways] = useState<PaymentGateways>(defaultGateways());
  const [ttlHours, setTtlHours] = useState(DEFAULT_PAYMENT_INTENT_TTL_HOURS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [gatewayUnavailable, setGatewayUnavailable] = useState(false);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data: SitePaymentSettings = await adminGetPaymentSettings();
      if (data.paymentGateways) {
        const merged = defaultGateways();
        for (const a of CRYPTO_ASSETS) {
          if (data.paymentGateways[a.id]) {
            merged[a.id] = { ...merged[a.id], ...data.paymentGateways[a.id] };
          }
        }
        setGateways(merged);
      }
      setTtlHours(data.paymentIntentTtlHours ?? DEFAULT_PAYMENT_INTENT_TTL_HOURS);
      setGatewayUnavailable(false);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to load settings';
      if (/not deployed|503/i.test(msg)) {
        setGatewayUnavailable(true);
      }
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const updateGateway = (id: keyof PaymentGateways, patch: Partial<PaymentGateways[keyof PaymentGateways]>) => {
    setGateways((prev) => ({
      ...prev,
      [id]: { ...prev[id], ...patch },
    }));
  };

  const handleSave = async () => {
    for (const a of CRYPTO_ASSETS) {
      const g = gateways[a.id];
      if (g.enabled && !g.address.trim()) {
        showToast(`${a.label}: address required when enabled`, 'error');
        return;
      }
    }
    setSaving(true);
    try {
      await adminUpdatePaymentSettings(gateways, ttlHours);
      showToast('Payment settings saved');
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Save failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size="lg" className="text-[var(--accent)]" />
      </div>
    );
  }

  if (gatewayUnavailable) {
    return (
      <div className="glass p-6 text-sm text-[var(--text-secondary)]">
        <p className="mb-2">The crypto payment gateway is not available on this environment.</p>
        <p>The rest of the site (manual checkout, orders, admin) is unaffected.</p>
        <p className="mt-3 text-xs text-[var(--text-tertiary)]">
          See <code className="font-mono">integration/payments/CRYPTO_PAYMENTS.md</code> for deploy steps.
        </p>
      </div>
    );
  }

  const futureRails = PAYMENT_RAILS.filter((r) => r.availability === 'coming_soon');

  return (
    <div className="space-y-6">
      <div className="glass p-5 sm:p-6">
        <label className="text-label block mb-2">Payment invoice expiry (hours)</label>
        <input
          type="number"
          min={1}
          max={168}
          value={ttlHours}
          onChange={(e) => setTtlHours(Number(e.target.value))}
          className="w-full max-w-xs bg-white/[0.04] border border-[var(--border)] rounded-xl px-4 py-3 text-sm text-white focus:ring-2 focus:ring-indigo-500/40 focus:outline-none"
        />
        <p className="text-xs text-[var(--text-tertiary)] mt-2">
          Default 48h. Unpaid invoices expire and can be regenerated.
        </p>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-3">Crypto</h2>
        <div className="space-y-4">
          {CRYPTO_ASSETS.map((asset) => {
            const g = gateways[asset.id];
            return (
              <div key={asset.id} className="glass p-5 sm:p-6">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-[var(--text-primary)]">{asset.label}</h3>
                    <p className="text-xs text-[var(--text-tertiary)]">{asset.symbol}</p>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <span className="text-sm text-[var(--text-secondary)]">Enabled</span>
                    <input
                      type="checkbox"
                      checked={g.enabled}
                      onChange={(e) => updateGateway(asset.id, { enabled: e.target.checked })}
                      className="rounded border-[var(--border)] bg-white/[0.04] focus:ring-indigo-500/40"
                    />
                  </label>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-label block mb-2">Deposit address</label>
                    <input
                      type="text"
                      value={g.address}
                      onChange={(e) => updateGateway(asset.id, { address: e.target.value })}
                      placeholder={g.enabled ? 'Required when enabled' : '—'}
                      disabled={!g.enabled}
                      className="w-full bg-white/[0.04] border border-[var(--border)] rounded-xl px-4 py-3 text-sm font-mono text-white placeholder-zinc-600 focus:ring-2 focus:ring-indigo-500/40 focus:outline-none disabled:opacity-50"
                    />
                  </div>
                  <div>
                    <label className="text-label block mb-2">Min confirmations</label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={g.minConfirmations}
                      onChange={(e) => updateGateway(asset.id, { minConfirmations: Number(e.target.value) })}
                      disabled={!g.enabled}
                      className="w-full bg-white/[0.04] border border-[var(--border)] rounded-xl px-4 py-3 text-sm text-white focus:ring-2 focus:ring-indigo-500/40 focus:outline-none disabled:opacity-50"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {futureRails.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-3">Other rails</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {futureRails.map((rail) => (
              <div key={rail.id} className="glass p-5 opacity-60">
                <h3 className="text-base font-semibold text-[var(--text-primary)]">{rail.label}</h3>
                <p className="text-xs text-[var(--text-tertiary)] mt-1">{rail.description}</p>
                <span className="inline-block mt-3 text-xs font-medium px-2 py-1 rounded-lg bg-white/[0.06] text-[var(--text-secondary)]">
                  Self-hosted — coming soon
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <button type="button" onClick={handleSave} disabled={saving} className="btn btn-primary">
          {saving ? <Spinner size="sm" /> : <><Save size={16} /> Save settings</>}
        </button>
        <button type="button" onClick={load} disabled={loading || saving} className="btn btn-outline">
          <RefreshCw size={16} /> Reload
        </button>
      </div>

      {toast && (
        <div
          role="status"
          aria-live="polite"
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl text-sm font-medium shadow-lg animate-fade-in ${
            toast.type === 'error'
              ? 'bg-red-500/10 border border-red-500/20 text-red-400'
              : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
          }`}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
};
