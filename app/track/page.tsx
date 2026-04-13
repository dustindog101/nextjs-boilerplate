"use client";
import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  SearchIcon,
  OrderCreatedIcon,
  ProcessingIcon,
  ShippedIcon,
  DeliveredIcon,
} from '../components/icons';
import { Footer } from '../components/ui';
import { Spinner } from '../components/ui/Spinner';
import { OrderDetails, TRACKING_STAGES } from '../../lib/types';
import { trackOrder } from '../../lib/apiClient';

// --- Payment Method Icons ---
const getPaymentMethodIcon = (method: string) => {
  switch (method.toLowerCase()) {
    case 'bitcoin': return '₿';
    case 'zelle': return 'Z';
    case 'apple pay': return '';
    case 'cash app': return '$';
    case 'venmo': return 'V';
    default: return '';
  }
};

function TrackPageContent() {
  const searchParams = useSearchParams();
  const initialOrderId = searchParams.get('orderId') || '';

  const [orderNumber, setOrderNumber] = useState(initialOrderId);
  const [isLoading, setIsLoading] = useState(false);
  const [orderData, setOrderData] = useState<OrderDetails | null>(null);
  const [displayError, setDisplayError] = useState<string | null>(null);

  const handleTrackOrder = useCallback(async (idToTrack?: string) => {
    const orderId = idToTrack || orderNumber;
    setOrderData(null);
    setDisplayError(null);

    if (!orderId.trim()) {
      setDisplayError('Please enter an order number.');
      return;
    }

    setIsLoading(true);

    try {
      const data = await trackOrder(orderId);
      if (data) {
        setOrderData(data);
        setDisplayError(null);
      } else {
        setDisplayError('Order data is empty. Please check the order number.');
      }
    } catch (error: any) {
      setDisplayError(`Error: ${error.message || 'An unexpected error occurred.'}`);
    } finally {
      setIsLoading(false);
    }
  }, [orderNumber]);

  // Auto-trigger search if orderId is provided in URL params
  useEffect(() => {
    if (initialOrderId) {
      handleTrackOrder(initialOrderId);
    }
    // Only run on mount — initialOrderId is stable from searchParams
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getStageIcon = (stageKey: string) => {
    const cls = "h-5 w-5";
    switch (stageKey) {
      case 'pending': return <OrderCreatedIcon className={cls} />;
      case 'processing': return <ProcessingIcon className={`${cls} animate-spin`} />;
      case 'shipped': return <ShippedIcon className={cls} />;
      case 'delivered': return <DeliveredIcon className={cls} />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-grow flex flex-col items-center justify-center px-4 sm:px-6 py-12 sm:py-20">
        <main className="w-full max-w-md animate-fade-up">
          <h1 className="text-3xl sm:text-4xl font-bold text-[var(--text-primary)] text-center mb-2">
            Track Your Order
          </h1>
          <p className="text-sm text-[var(--text-secondary)] text-center mb-8">
            Enter your order number to check the latest status.
          </p>

          {/* Search */}
          <div className="glass p-5 sm:p-6">
            <div className="flex flex-col gap-3">
              <input
                type="text"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleTrackOrder()}
                placeholder="Enter order number..."
                className="w-full rounded-xl px-4 py-3 text-sm [color-scheme:dark] bg-white/[0.06] border border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:ring-2 focus:ring-[var(--accent)]/35 focus:border-[var(--accent)]/50 focus:outline-none transition"
              />
              <button
                onClick={() => handleTrackOrder()}
                disabled={isLoading}
                className="btn btn-primary w-full py-3"
              >
                {isLoading ? (
                  <><Spinner size="sm" className="text-white" /> Searching...</>
                ) : (
                  <><SearchIcon className="h-4 w-4" /> Track Order</>
                )}
              </button>
            </div>
          </div>
        </main>

        {/* Loading State */}
        {isLoading && (
          <div className="mt-8 glass p-6 animate-fade-in w-full max-w-md">
            <p className="text-center text-[var(--accent)] text-sm font-medium flex items-center justify-center gap-2">
              <Spinner size="sm" className="text-[var(--accent)]" />
              Loading order details...
            </p>
          </div>
        )}

        {/* Error State */}
        {displayError && !isLoading && (
          <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl animate-fade-in w-full max-w-md">
            <p className="text-sm text-red-400 text-center">{displayError}</p>
          </div>
        )}

        {/* Order Results */}
        {orderData && !isLoading && !displayError && (
          <div className="mt-8 glass p-6 sm:p-8 animate-fade-up w-full max-w-lg md:max-w-2xl">
            <h2 className="text-xl font-bold text-[var(--text-primary)] mb-5">Order Details</h2>

            {/* Order Info Grid */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <p className="text-label mb-1">Order ID</p>
                <p className="text-sm text-[var(--text-primary)] font-mono">{orderData.orderId}</p>
              </div>
              <div>
                <p className="text-label mb-1">Date</p>
                <p className="text-sm text-[var(--text-primary)]">{new Date(orderData.createdAt).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-label mb-1">Items</p>
                <p className="text-sm text-[var(--text-primary)]">{orderData.numberOfIds ?? orderData.ids?.length ?? 0}</p>
              </div>
              <div>
                <p className="text-label mb-1">Total</p>
                <p className="text-price text-lg">${orderData.price?.total ? orderData.price.total.toFixed(2) : 'N/A'}</p>
              </div>
            </div>

            {/* Payment Info */}
            <div className="bg-white/[0.04] border border-[var(--border)] rounded-xl p-4 mb-6 flex items-center justify-between">
              <div>
                <p className="text-label mb-1">Payment</p>
                <span className={`text-sm font-medium ${orderData.paymentStatus === 'Paid' ? 'text-emerald-400' : 'text-red-400'}`}>
                  {orderData.paymentStatus || 'N/A'}
                </span>
              </div>
              <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                <span className="text-lg text-[var(--accent)]">{getPaymentMethodIcon(orderData.paymentMethod || '')}</span>
                <span className="text-sm font-medium text-[var(--text-primary)]">{orderData.paymentMethod || 'N/A'}</span>
              </div>
            </div>

            {/* Progress Tracker */}
            <div className="relative flex justify-between items-start pt-2 pb-4 px-2">
              {/* Background line */}
              <div className="absolute top-6 left-6 right-6 h-0.5 bg-white/10" />
              {/* Active line */}
              <div
                className="absolute top-6 left-6 h-0.5 bg-[var(--accent)] transition-all duration-500"
                style={{
                  width: `${(TRACKING_STAGES.findIndex(s => s.key === orderData.status) / (TRACKING_STAGES.length - 1)) * (100 - 10)}%`
                }}
              />

              {TRACKING_STAGES.map((stage, index) => {
                const currentStageIndex = TRACKING_STAGES.findIndex(s => s.key === orderData.status);
                const isCompleted = index <= currentStageIndex;
                const isCurrent = index === currentStageIndex;

                return (
                  <div key={stage.key} className="relative z-10 flex flex-col items-center flex-1">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300
                      ${isCompleted ? 'bg-[var(--accent)] text-white' : 'bg-white/[0.06] border border-[var(--border)] text-[var(--text-tertiary)]'}
                      ${isCurrent ? 'ring-4 ring-[var(--accent)]/30' : ''}
                    `}>
                      {isCurrent ? getStageIcon(stage.key) : (
                        isCompleted ? (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <div className="w-2 h-2 rounded-full bg-[var(--text-tertiary)]" />
                        )
                      )}
                    </div>
                    <p className={`mt-2 text-xs text-center font-medium ${isCompleted ? 'text-[var(--text-primary)]' : 'text-[var(--text-tertiary)]'}`}>
                      {stage.label}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}

// Wrap in Suspense because useSearchParams() requires it in Next.js App Router
export default function TrackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    }>
      <TrackPageContent />
    </Suspense>
  );
}
