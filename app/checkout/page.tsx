"use client";
import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { withAuth } from '../components/withAuth';
import { useAuth } from '../hooks/useAuth';
import { getStorageItem, removeStorageItem } from '../../lib/storage';
import { submitOrder, validateDiscount, DiscountValidation } from '../../lib/apiClient';
import { shippingFee as SHIPPING_BASE } from '../../lib/constants';
import { reviveIdForm } from '@/lib/resellerPortalStorage';
import {
    calcOrderPricing,
    effectivePerIdPrice,
    resolvePricingMode,
} from '@/lib/pricing';
import {
    createPaymentIntent,
    cryptoPaymentMethodLabel,
    MANUAL_PAYMENT_METHODS,
} from '@/lib/payments';
import type { CryptoAssetId } from '@/lib/paymentConstants';
import { IdFormData } from '../../lib/types';
import { useCryptoPaymentMethods } from '../hooks/useCryptoPaymentMethods';
import { CryptoPaymentSection, CRYPTO_PAYMENT_PARENT_ID } from './components/CryptoPaymentSection';
import { PaymentMethodLogo } from '../components/payments/PaymentMethodLogo';
import { EditIcon } from '../components/icons';
import { Footer } from '../components/ui';
import { Spinner } from '../components/ui/Spinner';

const inputClasses =
    'w-full rounded-xl px-4 py-3 text-sm [color-scheme:dark] bg-white/[0.06] border border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:ring-2 focus:ring-[var(--accent)]/35 focus:border-[var(--accent)]/50 focus:outline-none transition-all';

function CheckoutPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [orderItems, setOrderItems] = useState<IdFormData[]>([]);
    const [deliveryMethod, setDeliveryMethod] = useState<'local' | 'shipping'>('shipping');
    const [activePayment, setActivePayment] = useState<string>(MANUAL_PAYMENT_METHODS[0].name);
    const { methods: cryptoMethods } = useCryptoPaymentMethods();
    const [selectedCryptoAsset, setSelectedCryptoAsset] = useState<CryptoAssetId | null>(null);
    const [cryptoExpanded, setCryptoExpanded] = useState(false);
    const [orderNotes, setOrderNotes] = useState('');
    const [shippingFullName, setShippingFullName] = useState('');
    const [shippingStreetAddress, setShippingStreetAddress] = useState('');
    const [shippingCity, setShippingCity] = useState('');
    const [shippingStateProvince, setShippingStateProvince] = useState('');
    const [shippingZipCode, setShippingZipCode] = useState('');
    const [orderStatus, setOrderStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
    const [orderMessage, setOrderMessage] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(false);
    const [discountCode, setDiscountCode] = useState('');
    const [discountResult, setDiscountResult] = useState<DiscountValidation | null>(null);
    const [discountLoading, setDiscountLoading] = useState(false);
    const [discountError, setDiscountError] = useState<string | null>(null);
    const [showDiscountInput, setShowDiscountInput] = useState(false);

    useEffect(() => {
        if (!showModal) return;
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && !loading) setShowModal(false);
        };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, [showModal, loading]);

    const SHIPPING_FEE = deliveryMethod === 'shipping' ? SHIPPING_BASE : 0;
    const pricingMode = resolvePricingMode(user?.isReseller ?? false);

    const orderPricing = useMemo(
        () =>
            calcOrderPricing({
                ids: orderItems.map((item) => ({
                    productId: item.productId,
                    state: item.state,
                })),
                shippingIsDelivery: deliveryMethod === 'shipping',
                pricingMode,
                discount: discountResult
                    ? {
                          amount: discountResult.discountAmount,
                          scope: discountResult.scope,
                          appliedTo: discountResult.appliedTo,
                      }
                    : undefined,
            }),
        [orderItems, deliveryMethod, pricingMode, discountResult],
    );

    const preDiscountTotal =
        orderPricing.idSubtotal + orderPricing.handling + orderPricing.shipping;
    const total = orderPricing.total;

    useEffect(() => {
        const storedForms = getStorageItem('idPirateOrderForms');
        if (storedForms) {
            try {
                const parsed = JSON.parse(storedForms) as IdFormData[];
                setOrderItems(parsed.map((item) => reviveIdForm(item)));
            } catch (error) { console.error('Failed to parse order forms:', error); }
        }
    }, []);

    const uploadsIncomplete =
        orderItems.length > 0 &&
        orderItems.some((item) => !item.photoKey || !item.signatureKey);

    const isCryptoPayment = activePayment === CRYPTO_PAYMENT_PARENT_ID;
    const cryptoReady = isCryptoPayment && selectedCryptoAsset !== null;
    const canSubmit = orderItems.length > 0 && !uploadsIncomplete && (!isCryptoPayment || cryptoReady);

    const handleApplyDiscount = async () => {
        if (!discountCode.trim()) return;
        setDiscountLoading(true);
        setDiscountError(null);
        setDiscountResult(null);
        try {
            // Build line items for per-line-item discount validation.
            // Aggregate by productId so the backend sees quantity × unitPrice.
            const itemsByPid = new Map<string, { productId: string; quantity: number; unitPrice: number }>();
            for (const item of orderItems) {
                const pid = item.productId || '';
                if (!pid) continue;
                const unitPrice = effectivePerIdPrice(pid, orderItems.length, pricingMode);
                const existing = itemsByPid.get(pid);
                if (existing) {
                    existing.quantity += 1;
                } else {
                    itemsByPid.set(pid, { productId: pid, quantity: 1, unitPrice });
                }
            }
            const items = Array.from(itemsByPid.values());

            const result = await validateDiscount(discountCode.trim(), preDiscountTotal, {
                items,
                username: user?.username,
            });
            setDiscountResult(result);
        } catch (err: any) {
            setDiscountError(err.message || 'Invalid code.');
        } finally {
            setDiscountLoading(false);
        }
    };

    const handleRemoveDiscount = () => {
        setDiscountResult(null);
        setDiscountCode('');
        setDiscountError(null);
    };

    const handleFinalOrderSubmit = async () => {
        if (!user) { setOrderStatus('error'); setOrderMessage('You must be logged in.'); setShowModal(true); return; }
        if (orderItems.length === 0) { setOrderStatus('error'); setOrderMessage('No items in order.'); setShowModal(true); return; }
        if (deliveryMethod === 'shipping' && (!shippingFullName.trim() || !shippingStreetAddress.trim() || !shippingCity.trim() || !shippingStateProvince.trim() || !shippingZipCode.trim())) {
            setOrderStatus('error'); setOrderMessage('Please fill in all shipping address details.'); setShowModal(true); return;
        }

        const missingAssets = orderItems.findIndex((item) => !item.photoKey || !item.signatureKey);
        if (missingAssets !== -1) {
            setOrderStatus('error');
            setOrderMessage(`ID #${missingAssets + 1} is missing photo or signature. Use Edit Order to upload.`);
            setShowModal(true);
            return;
        }

        const willUseCrypto = activePayment === CRYPTO_PAYMENT_PARENT_ID && selectedCryptoAsset !== null;
        setLoading(true);
        setOrderStatus('processing');
        setOrderMessage(
            willUseCrypto ? 'Creating your order and payment invoice…' : 'Submitting your order...'
        );
        setShowModal(true);

        const fullShippingAddress = deliveryMethod === 'shipping' ? `${shippingFullName}, ${shippingStreetAddress}, ${shippingCity}, ${shippingStateProvince}, ${shippingZipCode}, USA` : "Local Delivery";

        const idsPayload = orderItems.map(({ id, photo, signature, ...rest }) => ({
            ...rest,
            dob: `${rest.dobYear}-${rest.dobMonth}-${rest.dobDay}`,
            issueDate: `${rest.issueYear}-${rest.issueMonth}-${rest.issueDay}`,
        }));

        const paymentMethodLabel = isCryptoPayment && selectedCryptoAsset
            ? cryptoPaymentMethodLabel(selectedCryptoAsset)
            : activePayment;

        const orderPayload = {
            userId: user.userId,
            shipping: fullShippingAddress,
            paymentMethod: paymentMethodLabel,
            notes: orderNotes,
            price: {
                subtotal: orderPricing.idSubtotal,
                total: orderPricing.total,
            },
            discountCode: discountResult?.code || undefined,
            ids: idsPayload,
        };

        try {
            const data = await submitOrder(orderPayload);
            removeStorageItem('idPirateOrderForms');

            if (willUseCrypto && selectedCryptoAsset) {
                try {
                    await createPaymentIntent(data.orderId, selectedCryptoAsset);
                } catch (intentErr: unknown) {
                    setOrderStatus('error');
                    setOrderMessage(
                        intentErr instanceof Error
                            ? intentErr.message
                            : 'Failed to create payment invoice. Your order was created — open My Orders to try again.'
                    );
                    setLoading(false);
                    return;
                }
                setShowModal(false);
                router.push(`/orders?pay=${data.orderId}`);
                return;
            }

            setOrderStatus('success');
            setOrderMessage(`Order placed! ID: ${data.orderId}`);
        } catch (error: any) {
            setOrderStatus('error');
            setOrderMessage(`Error: ${error.message || 'Failed to submit.'}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col">
            <div className="max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-12 flex-grow">
                <header className="mb-10">
                    <h1 className="text-3xl sm:text-4xl font-bold text-[var(--text-primary)] tracking-tight animate-fade-up">
                        Checkout
                    </h1>
                    <p className="mt-2 text-sm text-[var(--text-secondary)] animate-fade-up delay-1">Review your order and submit.</p>
                </header>

                <div className="flex flex-col lg:flex-row gap-6">
                    {/* Left Column */}
                    <div className="w-full lg:w-2/3 space-y-6">
                        {/* Order Items */}
                        <div className="glass p-5 sm:p-6 animate-fade-up delay-1">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-bold text-[var(--text-primary)]">Order Summary</h2>
                                {user?.isReseller && (
                                    <span className="text-xs font-medium px-2 py-0.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-300">
                                        Wholesale
                                    </span>
                                )}
                            </div>
                            {orderItems.length > 0 ? (
                                <div className="space-y-3">
                                    {orderItems.map((item, index) => (
                                        <div key={item.id || index} className="flex justify-between items-center bg-white/[0.04] p-4 rounded-xl border border-[var(--border)]">
                                            <div>
                                                <p className="font-semibold text-[var(--text-primary)]">{item.state} ID</p>
                                                <p className="text-xs text-[var(--text-secondary)]">{item.firstName || 'N/A'} {item.lastName || 'N/A'}</p>
                                            </div>
                                            <p className="text-price font-bold">
                                                ${effectivePerIdPrice(item.productId ?? item.state, orderItems.length, pricingMode).toFixed(2)}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-[var(--text-secondary)] text-center py-4 text-sm">No IDs added to your order.</p>
                            )}
                            <Link href="/order/new" className="inline-flex items-center gap-2 text-[var(--accent)] hover:text-[var(--accent-hover)] mt-4 text-sm font-medium transition-colors">
                                <EditIcon className="h-4 w-4" /> Edit Order
                            </Link>
                        </div>

                        {/* Order Notes */}
                        <div className="glass p-5 sm:p-6 animate-fade-up delay-2">
                            <label htmlFor="order-notes" className="text-label block mb-3">Order Notes</label>
                            <textarea
                                id="order-notes"
                                rows={3}
                                className={`${inputClasses} resize-none`}
                                placeholder="Any special instructions..."
                                value={orderNotes}
                                onChange={(e) => setOrderNotes(e.target.value)}
                            />
                        </div>

                        {/* Delivery Method */}
                        <div className="glass p-5 sm:p-6 animate-fade-up delay-3">
                            <h2 className="text-lg font-bold text-[var(--text-primary)] mb-4">Delivery</h2>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={() => setDeliveryMethod('local')}
                                    className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${deliveryMethod === 'local'
                                        ? 'border-[var(--accent)] bg-[var(--accent)]/10'
                                        : 'border-[var(--border)] hover:border-[var(--border-hover)]'
                                        }`}
                                >
                                    <h3 className="font-semibold text-sm text-[var(--text-primary)]">Local Pickup</h3>
                                    <p className="text-xs text-[var(--text-secondary)] mt-1">Free</p>
                                </button>
                                <button
                                    onClick={() => setDeliveryMethod('shipping')}
                                    className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${deliveryMethod === 'shipping'
                                        ? 'border-[var(--accent)] bg-[var(--accent)]/10'
                                        : 'border-[var(--border)] hover:border-[var(--border-hover)]'
                                        }`}
                                >
                                    <h3 className="font-semibold text-sm text-[var(--text-primary)]">Shipping</h3>
                                    <p className="text-xs text-[var(--text-secondary)] mt-1">${SHIPPING_FEE.toFixed(2)}</p>
                                </button>
                            </div>
                            {deliveryMethod === 'shipping' && (
                                <div className="mt-5 border-t border-[var(--border)] pt-5 space-y-3">
                                    <h3 className="text-label mb-2">Shipping Address</h3>
                                    <input type="text" aria-label="Full name" placeholder="Full Name" className={inputClasses} value={shippingFullName} onChange={(e) => setShippingFullName(e.target.value)} />
                                    <input type="text" aria-label="Street address" placeholder="Street Address" className={inputClasses} value={shippingStreetAddress} onChange={(e) => setShippingStreetAddress(e.target.value)} />
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                        <input type="text" aria-label="City" placeholder="City" className={inputClasses} value={shippingCity} onChange={(e) => setShippingCity(e.target.value)} />
                                        <input type="text" aria-label="State" placeholder="State" className={inputClasses} value={shippingStateProvince} onChange={(e) => setShippingStateProvince(e.target.value)} />
                                        <input type="text" aria-label="ZIP code" placeholder="ZIP Code" className={inputClasses} value={shippingZipCode} onChange={(e) => setShippingZipCode(e.target.value)} />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column — Sticky Sidebar */}
                    <div className="w-full lg:w-1/3">
                        <div className="lg:sticky top-20 glass p-5 sm:p-6 space-y-6 animate-fade-up delay-2">
                            {/* Cost Breakdown */}
                            <div>
                                <h2 className="text-lg font-bold text-[var(--text-primary)] mb-4">Total</h2>
                                <div className="space-y-2 text-sm">
                                    {orderPricing.volumeSavings > 0 && (
                                        <div className="flex justify-between text-[var(--text-tertiary)]">
                                            <span>List subtotal ({orderItems.length} IDs)</span>
                                            <span className="line-through">${orderPricing.listSubtotal.toFixed(2)}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between text-[var(--text-secondary)]">
                                        <span>
                                            {pricingMode === 'reseller_wholesale'
                                                ? `Wholesale subtotal (${orderItems.length} IDs)`
                                                : `Subtotal (${orderItems.length} IDs)`}
                                        </span>
                                        <span>${orderPricing.idSubtotal.toFixed(2)}</span>
                                    </div>
                                    {orderPricing.volumeSavings > 0 && (
                                        <div className="flex justify-between text-emerald-400">
                                            <span>Volume savings</span>
                                            <span>−${orderPricing.volumeSavings.toFixed(2)}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between text-[var(--text-secondary)]">
                                        <span>Processing</span>
                                        <span>${orderPricing.handling.toFixed(2)}</span>
                                    </div>
                                    {deliveryMethod === 'shipping' && (
                                        <div className="flex justify-between text-[var(--text-secondary)]">
                                            <span>Shipping</span>
                                            <span>${orderPricing.shipping.toFixed(2)}</span>
                                        </div>
                                    )}
                                    {discountResult && (
                                        <div className="space-y-1">
                                            <div className="flex justify-between text-emerald-400">
                                                <span>
                                                    Discount ({discountResult.code})
                                                    {discountResult.scope === 'line_item' && (
                                                        <span className="text-emerald-400/70 text-xs ml-1">
                                                            · per-ID
                                                        </span>
                                                    )}
                                                </span>
                                                <span>−${discountResult.discountAmount.toFixed(2)}</span>
                                            </div>
                                            {discountResult.appliedTo && discountResult.appliedTo.length > 0 && (
                                                <div className="pl-3 space-y-0.5 border-l border-emerald-500/30 ml-1">
                                                    {discountResult.appliedTo.map((line, idx) => (
                                                        <div key={idx} className="flex justify-between text-xs text-emerald-400/80">
                                                            <span>
                                                                {line.productId} ×{line.quantity}
                                                                <span className="text-emerald-400/50 ml-1">
                                                                    @{line.perUnitDiscount.toFixed(2)}/unit
                                                                </span>
                                                            </span>
                                                            <span>−${line.lineDiscount.toFixed(2)}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                    <div className="border-t border-[var(--border)] my-3" />
                                    <div className="flex justify-between text-[var(--text-primary)] font-bold text-xl">
                                        <span>Total</span>
                                        <span className="text-price">${total.toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Discount Code */}
                            <div>
                                {discountResult ? (
                                    /* Applied state */
                                    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm font-bold text-emerald-400 flex items-center gap-1">
                                                    ✅ {discountResult.code}
                                                </p>
                                                <p className="text-xs text-emerald-400/90 mt-0.5">
                                                    {discountResult.scope === 'line_item'
                                                        ? `${discountResult.value}${discountResult.discountType === 'percentage' ? '%' : '$'} off each matching ID — saving $${discountResult.discountAmount.toFixed(2)}`
                                                        : discountResult.discountType === 'percentage'
                                                            ? `${discountResult.value}% off — saving $${discountResult.discountAmount.toFixed(2)}`
                                                            : `$${discountResult.value.toFixed(2)} off applied`}
                                                </p>
                                            </div>
                                            <button
                                                onClick={handleRemoveDiscount}
                                                className="text-xs text-emerald-400 hover:text-red-400 font-medium transition-colors"
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    </div>
                                ) : showDiscountInput ? (
                                    /* Input state */
                                    <div>
                                        <h2 className="text-label mb-3">Discount Code</h2>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                aria-label="Discount code"
                                                placeholder="Enter code..."
                                                className={inputClasses}
                                                value={discountCode}
                                                onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
                                                onKeyDown={(e) => e.key === 'Enter' && handleApplyDiscount()}
                                                autoFocus
                                            />
                                            <button
                                                onClick={handleApplyDiscount}
                                                disabled={discountLoading || !discountCode.trim()}
                                                className="btn btn-primary px-4 py-2.5 text-sm flex-shrink-0"
                                            >
                                                {discountLoading ? <Spinner size="sm" /> : 'Apply'}
                                            </button>
                                        </div>
                                        {discountError && (
                                            <p className="text-red-400 text-xs mt-2">{discountError}</p>
                                        )}
                                        <button
                                            onClick={() => { setShowDiscountInput(false); setDiscountError(null); setDiscountCode(''); }}
                                            className="text-xs text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] mt-2 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                ) : (
                                    /* Collapsed state */
                                    <button
                                        onClick={() => setShowDiscountInput(true)}
                                        className="text-sm text-[var(--accent)] hover:text-[var(--accent-hover)] font-medium transition-colors"
                                    >
                                        🏷️ Have a discount code?
                                    </button>
                                )}
                            </div>

                            {/* Payment */}
                            <div>
                                <h2 className="text-label mb-3">Payment Method</h2>
                                <div className="space-y-2">
                                    <CryptoPaymentSection
                                        methods={cryptoMethods}
                                        isActive={isCryptoPayment}
                                        expanded={cryptoExpanded}
                                        selectedAsset={selectedCryptoAsset}
                                        onSelectParent={() => {
                                            setActivePayment(CRYPTO_PAYMENT_PARENT_ID);
                                            setCryptoExpanded(true);
                                        }}
                                        onSelectAsset={setSelectedCryptoAsset}
                                    />
                                    {MANUAL_PAYMENT_METHODS.map(method => (
                                        <button
                                            key={method.name}
                                            type="button"
                                            onClick={() => {
                                                setActivePayment(method.name);
                                                setSelectedCryptoAsset(null);
                                                setCryptoExpanded(false);
                                            }}
                                            className={`w-full flex items-center p-3 rounded-xl border transition-all cursor-pointer ${activePayment === method.name
                                                ? 'border-[var(--accent)] bg-[var(--accent)]/10'
                                                : 'border-[var(--border)] hover:border-[var(--border-hover)]'
                                                }`}
                                        >
                                            <span className="flex items-center justify-center h-7 min-w-7 px-1 rounded-lg bg-white/[0.06] border border-[var(--border)] mr-3 shrink-0">
                                                <PaymentMethodLogo manualMethod={method.name} size="sm" />
                                            </span>
                                            <span className="text-sm font-medium text-[var(--text-primary)]">{method.name}</span>
                                        </button>
                                    ))}
                                </div>
                                {isCryptoPayment && !selectedCryptoAsset && (
                                    <p className="text-xs text-amber-400/90 mt-2">Select a crypto asset to continue.</p>
                                )}
                            </div>

                            {/* Submit */}
                            <button
                                onClick={handleFinalOrderSubmit}
                                className="btn btn-primary w-full py-3.5 text-base"
                                disabled={loading || !canSubmit}
                                title={uploadsIncomplete ? 'Upload photo and signature for each ID on the order form' : undefined}
                            >
                                {loading ? (
                                    <><Spinner size="sm" className="text-white" /> Processing...</>
                                ) : 'Submit Order'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <Footer />

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div
                        className={`glass rounded-2xl border shadow-xl p-8 max-w-sm w-full ${orderStatus === 'success' ? 'border-emerald-500/30' :
                            orderStatus === 'error' ? 'border-red-500/30' : 'border-[var(--accent)]/30'
                            } animate-fade-up`}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="checkout-processing-modal-title"
                    >
                        <h3
                            id="checkout-processing-modal-title"
                            className={`text-xl font-bold mb-3 text-center ${orderStatus === 'success' ? 'text-emerald-400' :
                            orderStatus === 'error' ? 'text-red-400' : 'text-[var(--accent)]'
                            }`}
                        >
                            {orderStatus === 'processing' ? 'Processing...' : orderStatus === 'success' ? 'Order Placed!' : 'Error'}
                        </h3>
                        <p className="text-sm text-[var(--text-secondary)] text-center mb-6">{orderMessage}</p>
                        {!loading && (
                            <button
                                onClick={() => {
                                    setShowModal(false);
                                    if (orderStatus === 'success') {
                                        router.push('/dashboard');
                                    }
                                }}
                                className="btn btn-primary w-full"
                            >
                                {orderStatus === 'success' ? 'Go to Dashboard' : 'Close'}
                            </button>
                        )}
                        {loading && (
                            <div className="flex justify-center">
                                <Spinner size="md" className="text-[var(--accent)]" />
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default withAuth(CheckoutPage);