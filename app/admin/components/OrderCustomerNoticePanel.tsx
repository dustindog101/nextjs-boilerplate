"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { Megaphone, X } from 'lucide-react';
import { adminUpdateOrder } from '@/lib/apiClient';
import { Spinner } from '../../components/ui';

interface OrderCustomerNoticePanelProps {
  orders: { orderId?: string; customerNotice?: string }[];
  selectedOrderIds: Set<string>;
  onClearSelection: () => void;
  onSaved: () => Promise<void>;
}

export function OrderCustomerNoticePanel({
  orders,
  selectedOrderIds,
  onClearSelection,
  onSaved,
}: OrderCustomerNoticePanelProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [notice, setNotice] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedOrders = useMemo(
    () => orders.filter((order) => order.orderId && selectedOrderIds.has(String(order.orderId))),
    [orders, selectedOrderIds]
  );

  if (selectedOrders.length === 0) return null;

  const openModal = () => {
    const shared =
      selectedOrders.length === 1
        ? String(selectedOrders[0].customerNotice ?? '')
        : selectedOrders.every(
              (o) => String(o.customerNotice ?? '') === String(selectedOrders[0].customerNotice ?? '')
            )
          ? String(selectedOrders[0].customerNotice ?? '')
          : '';
    setNotice(shared);
    setError(null);
    setModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;
    setModalOpen(false);
    setError(null);
  };

  useEffect(() => {
    if (!modalOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !saving) closeModal();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [modalOpen, saving]);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const value = notice.trim();
      await Promise.all(
        selectedOrders.map((order) =>
          adminUpdateOrder(String(order.orderId), { customerNotice: value || '' })
        )
      );
      await onSaved();
      setModalOpen(false);
      onClearSelection();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save customer message.');
    } finally {
      setSaving(false);
    }
  };

  const handleClear = async () => {
    setSaving(true);
    setError(null);
    try {
      await Promise.all(
        selectedOrders.map((order) =>
          adminUpdateOrder(String(order.orderId), { customerNotice: '' })
        )
      );
      await onSaved();
      setModalOpen(false);
      onClearSelection();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to clear customer message.');
    } finally {
      setSaving(false);
    }
  };

  const withNotice = selectedOrders.filter((o) => String(o.customerNotice ?? '').trim()).length;

  return (
    <>
      <div
        className="flex flex-wrap items-center gap-3 px-4 py-3 rounded-xl animate-fade-up mt-3"
        style={{
          background: 'rgba(245,158,11,0.08)',
          border: '1px solid rgba(245,158,11,0.22)',
        }}
      >
        <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
          Customer message
          <span className="font-normal" style={{ color: 'var(--text-tertiary)' }}>
            {' '}
            · {selectedOrders.length} selected
            {withNotice > 0 ? ` · ${withNotice} with message` : ''}
          </span>
        </p>

        <div className="flex items-center gap-2 ml-auto">
          <button
            type="button"
            onClick={openModal}
            className="btn btn-primary px-3 py-1.5 text-xs inline-flex items-center gap-1.5"
          >
            <Megaphone size={14} />
            {withNotice > 0 ? 'Edit message' : 'Add message'}
          </button>
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div
            className="rounded-2xl shadow-xl p-6 w-full max-w-lg relative animate-fade-up"
            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="order-customer-notice-modal-title"
          >
            <button
              type="button"
              onClick={closeModal}
              aria-label="Close dialog"
              className="absolute top-4 right-4 transition-colors"
              style={{ color: 'var(--text-tertiary)' }}
              disabled={saving}
            >
              <X size={20} />
            </button>

            <h3 id="order-customer-notice-modal-title" className="text-lg font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
              Customer message
            </h3>
            <p className="text-sm mb-5" style={{ color: 'var(--text-tertiary)' }}>
              Shown as a banner when customers track or view{' '}
              {selectedOrders.length === 1 ? 'this order' : `these ${selectedOrders.length} orders`}.
            </p>

            <div className="space-y-4">
              <div>
                <label className="text-label mb-1 block">Message</label>
                <textarea
                  rows={4}
                  value={notice}
                  onChange={(e) => setNotice(e.target.value)}
                  className="w-full rounded-lg px-4 py-2.5 text-sm outline-none resize-none"
                  style={{
                    background: 'var(--bg-primary)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-primary)',
                  }}
                  placeholder="e.g. Your order is delayed due to a state template update. We expect to ship by Friday."
                  disabled={saving}
                />
              </div>

              <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                Leave blank and save to remove the banner from customer-facing pages.
              </p>

              {error && (
                <p
                  className="text-red-400 text-sm p-2 rounded-lg"
                  style={{ background: 'rgba(239,68,68,0.1)' }}
                >
                  {error}
                </p>
              )}
            </div>

            <div className="flex flex-wrap justify-end gap-3 pt-6 mt-2 border-t" style={{ borderColor: 'var(--border)' }}>
              {withNotice > 0 && (
                <button
                  type="button"
                  onClick={() => void handleClear()}
                  className="btn btn-outline px-4 py-2 text-sm text-red-400 border-red-500/30 mr-auto"
                  disabled={saving}
                >
                  Clear all
                </button>
              )}
              <button
                type="button"
                onClick={closeModal}
                className="btn btn-outline px-4 py-2 text-sm"
                disabled={saving}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleSave()}
                className="btn btn-primary px-4 py-2 text-sm inline-flex items-center gap-2"
                disabled={saving}
              >
                {saving ? (
                  <>
                    <Spinner size="sm" />
                    Saving…
                  </>
                ) : (
                  'Save message'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
