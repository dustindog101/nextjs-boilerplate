"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, Download, FileJson, FileSpreadsheet, Package, X } from 'lucide-react';
import { adminPresignGetUrl } from '@/lib/apiClient';
import {
  countExportIdRows,
  runAdminOrderExport,
  type AdminOrderExportFormat,
  type AdminOrderRecord,
} from '@/lib/adminOrderExport';
import { Spinner } from '../../components/ui';

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
    description: 'Full order payload for backups or integrations',
    icon: FileJson,
  },
  {
    id: 'xlsx',
    label: 'Spreadsheet',
    description: 'Flat Excel workbook with all order and ID fields',
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
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const selectedOrders = useMemo(
    () => orders.filter((order) => order.orderId && selectedOrderIds.has(String(order.orderId))),
    [orders, selectedOrderIds]
  );

  const idRowCount = useMemo(() => countExportIdRows(selectedOrders), [selectedOrders]);

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
    setError(null);
  };

  const closeModal = () => {
    if (exporting) return;
    resetModal();
  };

  const handlePickFormat = (format: AdminOrderExportFormat) => {
    setMenuOpen(false);
    setError(null);
    if (format === 'json') {
      void runExport(format, '');
      return;
    }
    setModalFormat(format);
  };

  const runExport = useCallback(
    async (format: AdminOrderExportFormat, note: string) => {
      if (selectedOrders.length === 0) return;
      setExporting(true);
      setError(null);
      try {
        await runAdminOrderExport(format, selectedOrders, {
          exportNote: note.trim() || undefined,
          resolveAssetUrl: adminPresignGetUrl,
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
        : 'Export orders';

  return (
    <>
      <div
        className="flex flex-wrap items-center gap-3 px-4 py-3 rounded-xl animate-fade-up"
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
              Export
              <ChevronDown size={14} />
            </button>

            {menuOpen && (
              <div
                className="absolute right-0 mt-2 w-72 rounded-xl shadow-xl z-20 overflow-hidden animate-fade-in"
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
            className="rounded-2xl shadow-xl p-6 w-full max-w-lg relative animate-fade-up"
            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
          >
            <button
              type="button"
              onClick={closeModal}
              className="absolute top-4 right-4 transition-colors"
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
              {modalFormat !== 'json' ? ' · presigned photo/signature links included when available' : ''}
            </p>

            <div className="space-y-4">
              <div>
                <label className="text-label mb-1 block">Export note</label>
                <textarea
                  rows={3}
                  value={exportNote}
                  onChange={(e) => setExportNote(e.target.value)}
                  className="w-full rounded-lg px-4 py-2.5 text-sm outline-none resize-none"
                  style={{
                    background: 'var(--bg-primary)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-primary)',
                  }}
                  placeholder="Optional note added to each exported row"
                  disabled={exporting}
                />
              </div>

              <div
                className="rounded-xl px-4 py-3 text-xs"
                style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)' }}
              >
                <p style={{ color: 'var(--text-secondary)' }}>
                  <span className="text-label">Account</span> is filled from the order&apos;s customer /
                  user ID. Existing order notes are merged with your export note for vendor rows.
                </p>
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
                onClick={() => modalFormat && void runExport(modalFormat, exportNote)}
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
