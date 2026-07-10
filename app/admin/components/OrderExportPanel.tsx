"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, Download, FileJson, FileSpreadsheet, Package, X } from 'lucide-react';
import { adminPresignGetUrl } from '@/lib/apiClient';
import { PRESIGN_GET_TTL_OPTIONS } from '@/lib/r2';
import {
  countExportIdRows,
  runAdminOrderExport,
  type AdminOrderExportFormat,
  type AdminOrderRecord,
} from '@/lib/adminOrderExport';
import { Spinner } from '../../components/ui';

/** Default link lifetime for exported photo/signature URLs (24 hours). */
const DEFAULT_LINK_TTL_SECONDS = PRESIGN_GET_TTL_OPTIONS[2].value;

interface OrderExportPanelProps {
  orders: AdminOrderRecord[];
  selectedOrderIds: Set<string>;
  onClearSelection: () => void;
}

const formatOptions: {
  id: AdminOrderExportFormat;
  label: string;
  description: string;
  icon: typeof FileJson;
}[] = [
  {
    id: 'json',
    label: 'JSON',
    description: 'Vendor-safe order + ID data for API submission',
    icon: FileJson,
  },
  {
    id: 'xlsx',
    label: 'Spreadsheet',
    description: 'Flat Excel workbook, one row per ID',
    icon: FileSpreadsheet,
  },
  {
    id: 'vendor',
    label: 'Vendor order',
    description: 'IDGod template with photo/signature links',
    icon: Package,
  },
];

export function OrderExportPanel({
  orders,
  selectedOrderIds,
  onClearSelection,
}: OrderExportPanelProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [modalFormat, setModalFormat] = useState<AdminOrderExportFormat | null>(null);
  const [exportNote, setExportNote] = useState('');
  const [linkTtlSeconds, setLinkTtlSeconds] = useState<number>(DEFAULT_LINK_TTL_SECONDS);
  const [shippingMode, setShippingMode] = useState<'per-order' | 'override'>('per-order');
  const [shippingOverride, setShippingOverride] = useState('');
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const selectedOrders = useMemo(
    () => orders.filter((order) => order.orderId && selectedOrderIds.has(String(order.orderId))),
    [orders, selectedOrderIds]
  );

  const idRowCount = useMemo(() => countExportIdRows(selectedOrders), [selectedOrders]);

  // Detect whether multiple distinct shipping addresses exist among the selected
  // orders. The shipping override UI only appears when there's more than one
  // unique address — otherwise asking would be pointless.
  const distinctAddresses = useMemo(() => {
    const addrs = new Set(
      selectedOrders
        .map((o) => (typeof o.shipping === 'string' ? o.shipping.trim() : ''))
        .filter((a) => a.length > 0)
    );
    return Array.from(addrs);
  }, [selectedOrders]);
  const hasMultipleAddresses = distinctAddresses.length > 1;

  useEffect(() => {
    if (!menuOpen) return;
    const handleClick = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [menuOpen]);

  const resetModal = () => {
    setModalFormat(null);
    setExportNote('');
    setLinkTtlSeconds(DEFAULT_LINK_TTL_SECONDS);
    setShippingMode('per-order');
    setShippingOverride('');
    setError(null);
  };

  const closeModal = () => {
    if (exporting) return;
    resetModal();
  };

  const handlePickFormat = (format: AdminOrderExportFormat) => {
    setMenuOpen(false);
    setError(null);
    setModalFormat(format);
  };

  const runExport = useCallback(
    async (
      format: AdminOrderExportFormat,
      note: string,
      ttlSeconds: number,
      shipMode: 'per-order' | 'override',
      shipOverride: string
    ) => {
      if (selectedOrders.length === 0) return;
      setExporting(true);
      setError(null);
      try {
        const resolveAssetUrl = (objectKey: string) =>
          adminPresignGetUrl(objectKey, { expiresInSeconds: ttlSeconds });
        await runAdminOrderExport(format, selectedOrders, {
          exportNote: note.trim() || undefined,
          resolveAssetUrl,
          shippingOverride: shipMode === 'override' && shipOverride.trim() ? shipOverride.trim() : undefined,
        });
        resetModal();
        onClearSelection();
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Export failed.');
      } finally {
        setExporting(false);
      }
    },
    [onClearSelection, selectedOrders]
  );

  if (selectedOrders.length === 0) return null;

  const modalTitle =
    modalFormat === 'vendor'
      ? 'Export vendor order'
      : modalFormat === 'xlsx'
        ? 'Export spreadsheet'
        : modalFormat === 'json'
          ? 'Export JSON'
          : 'Export orders';

  // Shipping override UI only applies to JSON + spreadsheet (not vendor template)
  // AND only when multiple distinct shipping addresses are detected.
  const showShippingOverride =
    (modalFormat === 'json' || modalFormat === 'xlsx') && hasMultipleAddresses;

  return (
    <>
      {/* relative + z-30 keeps the dropdown menu above the customer-notice bar below */}
      <div
        className="relative z-30 flex flex-wrap items-center gap-3 px-4 py-3 rounded-xl animate-fade-up"
        style={{
          background: 'rgba(99,102,241,0.08)',
          border: '1px solid rgba(99,102,241,0.22)',
        }}
      >
        <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
          {selectedOrders.length} order{selectedOrders.length === 1 ? '' : 's'} selected
          <span className="font-normal" style={{ color: 'var(--text-tertiary)' }}>
            {' '}
            · {idRowCount} ID{idRowCount === 1 ? '' : 's'}
          </span>
        </p>

        <div className="flex items-center gap-2 ml-auto">
          <button
            type="button"
            onClick={onClearSelection}
            className="btn btn-outline px-3 py-1.5 text-xs"
            disabled={exporting}
          >
            Clear
          </button>

          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              className="btn btn-primary px-3 py-1.5 text-xs inline-flex items-center gap-1.5"
              disabled={exporting}
            >
              <Download size={14} />
              {exporting ? <Spinner size="sm" /> : null}
              Export
              <ChevronDown size={14} />
            </button>

            {menuOpen && (
              <div
                className="absolute right-0 mt-2 w-72 rounded-xl shadow-xl z-40 overflow-hidden animate-fade-in"
                style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
              >
                {formatOptions.map((option) => {
                  const Icon = option.icon;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => handlePickFormat(option.id)}
                      className="w-full text-left px-4 py-3 transition-colors"
                      style={{ color: 'var(--text-primary)' }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'var(--bg-hover)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = '';
                      }}
                    >
                      <span className="flex items-start gap-3">
                        <Icon size={16} className="mt-0.5 shrink-0" style={{ color: 'var(--accent)' }} />
                        <span>
                          <span className="block text-sm font-semibold">{option.label}</span>
                          <span className="block text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                            {option.description}
                          </span>
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {modalFormat && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div
            className="rounded-2xl shadow-xl p-6 w-full max-w-lg relative animate-fade-up max-h-[90vh] overflow-y-auto"
            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
          >
            <button
              type="button"
              onClick={closeModal}
              className="absolute top-4 right-4 transition-colors z-10"
              style={{ color: 'var(--text-tertiary)' }}
              disabled={exporting}
            >
              <X size={20} />
            </button>

            <h3 className="text-lg font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
              {modalTitle}
            </h3>
            <p className="text-sm mb-5" style={{ color: 'var(--text-tertiary)' }}>
              {selectedOrders.length} order{selectedOrders.length === 1 ? '' : 's'} · {idRowCount} ID
              row{idRowCount === 1 ? '' : 's'}
              {modalFormat !== 'json' ? ' · presigned photo/signature links included when available' : ' · photo/signature links included when available'}
            </p>

            <div className="space-y-4">
              <div>
                <label className="text-label mb-1 block">Export note</label>
                <textarea
                  rows={2}
                  value={exportNote}
                  onChange={(e) => setExportNote(e.target.value)}
                  className="w-full rounded-lg px-4 py-2.5 text-sm outline-none resize-none"
                  style={{
                    background: 'var(--bg-primary)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-primary)',
                  }}
                  placeholder="Optional note added to each exported order"
                  disabled={exporting}
                />
              </div>

              {showShippingOverride && (
                <div>
                  <label className="text-label mb-1 block">
                    Shipping address{' '}
                    <span className="font-normal text-xs" style={{ color: 'var(--text-tertiary)' }}>
                      ({distinctAddresses.length} different addresses detected)
                    </span>
                  </label>
                  <div className="flex flex-col gap-2 mb-2">
                    <label className="flex items-center gap-2 cursor-pointer text-sm" style={{ color: 'var(--text-primary)' }}>
                      <input
                        type="radio"
                        name="shippingMode"
                        checked={shippingMode === 'per-order'}
                        onChange={() => setShippingMode('per-order')}
                        disabled={exporting}
                        style={{ accentColor: 'var(--accent)' }}
                      />
                      Use each order&apos;s own shipping address
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-sm" style={{ color: 'var(--text-primary)' }}>
                      <input
                        type="radio"
                        name="shippingMode"
                        checked={shippingMode === 'override'}
                        onChange={() => setShippingMode('override')}
                        disabled={exporting}
                        style={{ accentColor: 'var(--accent)' }}
                      />
                      Use one address for all selected orders
                    </label>
                  </div>
                  {shippingMode === 'override' && (
                    <textarea
                      rows={2}
                      value={shippingOverride}
                      onChange={(e) => setShippingOverride(e.target.value)}
                      className="w-full rounded-lg px-4 py-2.5 text-sm outline-none resize-none"
                      style={{
                        background: 'var(--bg-primary)',
                        border: '1px solid var(--border)',
                        color: 'var(--text-primary)',
                      }}
                      placeholder="Full Name, Street Address, City, State, ZIP, USA"
                      disabled={exporting}
                    />
                  )}
                </div>
              )}

              <div>
                <label className="text-label mb-1 block">Link expiry</label>
                <div className="flex items-center gap-3">
                  <select
                    value={linkTtlSeconds}
                    onChange={(e) => setLinkTtlSeconds(Number(e.target.value))}
                    className="rounded-lg px-4 py-2.5 text-sm outline-none cursor-pointer"
                    style={{
                      background: 'var(--bg-primary)',
                      border: '1px solid var(--border)',
                      color: 'var(--text-primary)',
                    }}
                    disabled={exporting}
                  >
                    {PRESIGN_GET_TTL_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                    How long photo / signature links stay valid.
                  </span>
                </div>
              </div>

              {error && (
                <p
                  className="text-red-400 text-sm p-2 rounded-lg"
                  style={{ background: 'rgba(239,68,68,0.1)' }}
                >
                  {error}
                </p>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-6 mt-2 border-t" style={{ borderColor: 'var(--border)' }}>
              <button
                type="button"
                onClick={closeModal}
                className="btn btn-outline px-4 py-2 text-sm"
                disabled={exporting}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() =>
                  modalFormat &&
                  void runExport(modalFormat, exportNote, linkTtlSeconds, shippingMode, shippingOverride)
                }
                className="btn btn-primary px-4 py-2 text-sm inline-flex items-center gap-2"
                disabled={exporting}
              >
                {exporting ? (
                  <>
                    <Spinner size="sm" />
                    Exporting…
                  </>
                ) : (
                  <>
                    <Download size={14} />
                    Download
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
