"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { withAuth } from '../components/withAuth';
import { useAuth } from '../hooks/useAuth';
import { getStorageItem, removeStorageItem } from '../../lib/storage';
import { submitOrder, validateDiscount, DiscountValidation } from '../../lib/apiClient';
import { statePrices, defaultIdPrice, handlingFee as HANDLING_FEE, shippingFee as SHIPPING_BASE } from '../../lib/constants';
import { IdFormData } from '../../lib/types';
import { EditIcon } from '../components/icons';
import { Footer } from '../components/ui';
import { Spinner } from '../components/ui/Spinner';

// --- Component Data ---
const paymentMethods = [
    { name: 'Bitcoin', icon: '₿' },
    { name: 'Zelle', icon: 'Z' },
    { name: 'Apple Pay', icon: '' },
    { name: 'Cash App', icon: '$' },
    { name: 'Venmo', icon: 'V' },
];

const inputClasses = "w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-white text-sm placeholder-zinc-500 focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/60 focus:outline-none transition";

function CheckoutPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [orderItems, setOrderItems] = useState<IdFormData[]>([]);
    const [deliveryMethod, setDeliveryMethod] = useState<'local' | 'shipping'>('shipping');
    const [activePayment, setActivePayment] = useState<string>(paymentMethods[0].name);
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

    const SHIPPING_FEE = deliveryMethod === 'shipping' ? SHIPPING_BASE : 0;

    useEffect(() => {
        const storedForms = getStorageItem('idPirateOrderForms');
        if (storedForms) {
            try {
                setOrderItems(JSON.parse(storedForms));
            } catch (error) { console.error('Failed to parse order forms:', error); }
        }
    }, []);

    const subtotal = orderItems.reduce((acc, item) => acc + (statePrices[item.state] ?? defaultIdPrice), 0);
    const discountAmount = discountResult?.discountAmount ?? 0;
    const total = subtotal + HANDLING_FEE + SHIPPING_FEE - discountAmount;

    const handleApplyDiscount = async () => {
        if (!discountCode.trim()) return;
        setDiscountLoading(true);
        setDiscountError(null);
        setDiscountResult(null);
        try {
            const result = await validateDiscount(discountCode.trim(), subtotal + HANDLING_FEE + SHIPPING_FEE);
            setDiscountResult(result);
        } catch (err: any) {
            setDiscountError(err.message || 'Invalid code.');
        } finally {
            setDiscountLoading(false);
        }
    };

    const handleFinalOrderSubmit = async () => {
        if (!user) { setOrderStatus('error'); setOrderMessage('You must be logged in.'); setShowModal(true); return; }
        if (orderItems.length === 0) { setOrderStatus('error'); setOrderMessage('No items in order.'); setShowModal(true); return; }
        if (deliveryMethod === 'shipping' && (!shippingFullName.trim() || !shippingStreetAddress.trim() || !shippingCity.trim() || !shippingStateProvince.trim() || !shippingZipCode.trim())) {
            setOrderStatus('error'); setOrderMessage('Please fill in all shipping address details.'); setShowModal(true); return;
        }

        setLoading(true); setOrderStatus('processing'); setOrderMessage('Submitting your order...'); setShowModal(true);

        const fullShippingAddress = deliveryMethod === 'shipping' ? `${shippingFullName}, ${shippingStreetAddress}, ${shippingCity}, ${shippingStateProvince}, ${shippingZipCode}, USA` : "Local Delivery";

        const idsPayload = orderItems.map(({ id, photo, signature, ...rest }) => ({
            ...rest,
            dob: `${rest.dobYear}-${rest.dobMonth}-${rest.dobDay}`,
            issueDate: `${rest.issueYear}-${rest.issueMonth}-${rest.issueDay}`,
        }));

        const orderPayload = {
            userId: user.userId,
            shipping: fullShippingAddress,
            paymentMethod: activePayment,
            notes: orderNotes,
            price: { subtotal, total },
            discountCode: discountResult?.code || undefined,
            ids: idsPayload,
        };

        try {
            const data = await submitOrder(orderPayload);
            setOrderStatus('success');
            setOrderMessage(`Order placed! ID: ${data.orderId}`);
            removeStorageItem('idPirateOrderForms');
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
                    <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight animate-fade-up">
                        Checkout
                    </h1>
                    <p className="mt-2 text-sm text-zinc-400 animate-fade-up delay-1">Review your order and submit.</p>
                </header>

                <div className="flex flex-col lg:flex-row gap-6">
                    {/* Left Column */}
                    <div className="w-full lg:w-2/3 space-y-6">
                        {/* Order Items */}
                        <div className="glass p-5 sm:p-6 animate-fade-up delay-1">
                            <h2 className="text-lg font-bold text-white mb-4">Order Summary</h2>
                            {orderItems.length > 0 ? (
                                <div className="space-y-3">
                                    {orderItems.map((item, index) => (
                                        <div key={item.id || index} className="flex justify-between items-center bg-white/[0.04] p-4 rounded-xl">
                                            <div>
                                                <p className="font-semibold text-white">{item.state} ID</p>
                                                <p className="text-xs text-zinc-500">{item.firstName || 'N/A'} {item.lastName || 'N/A'}</p>
                                            </div>
                                            <p className="text-price">${(statePrices[item.state] ?? defaultIdPrice).toFixed(2)}</p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-zinc-500 text-center py-4 text-sm">No IDs added to your order.</p>
                            )}
                            <Link href="/order/new" className="inline-flex items-center gap-2 text-indigo-400 hover:text-indigo-300 mt-4 text-sm font-medium transition-colors">
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
                            <h2 className="text-lg font-bold text-white mb-4">Delivery</h2>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={() => setDeliveryMethod('local')}
                                    className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${deliveryMethod === 'local'
                                        ? 'border-indigo-500 bg-indigo-500/10'
                                        : 'border-white/[0.08] hover:border-white/[0.16]'
                                        }`}
                                >
                                    <h3 className="font-semibold text-sm text-white">Local Pickup</h3>
                                    <p className="text-xs text-zinc-500 mt-1">Free</p>
                                </button>
                                <button
                                    onClick={() => setDeliveryMethod('shipping')}
                                    className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${deliveryMethod === 'shipping'
                                        ? 'border-indigo-500 bg-indigo-500/10'
                                        : 'border-white/[0.08] hover:border-white/[0.16]'
                                        }`}
                                >
                                    <h3 className="font-semibold text-sm text-white">Shipping</h3>
                                    <p className="text-xs text-zinc-500 mt-1">${SHIPPING_FEE.toFixed(2)}</p>
                                </button>
                            </div>
                            {deliveryMethod === 'shipping' && (
                                <div className="mt-5 border-t border-white/[0.06] pt-5 space-y-3">
                                    <h3 className="text-label mb-2">Shipping Address</h3>
                                    <input type="text" placeholder="Full Name" className={inputClasses} value={shippingFullName} onChange={(e) => setShippingFullName(e.target.value)} />
                                    <input type="text" placeholder="Street Address" className={inputClasses} value={shippingStreetAddress} onChange={(e) => setShippingStreetAddress(e.target.value)} />
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                        <input type="text" placeholder="City" className={inputClasses} value={shippingCity} onChange={(e) => setShippingCity(e.target.value)} />
                                        <input type="text" placeholder="State" className={inputClasses} value={shippingStateProvince} onChange={(e) => setShippingStateProvince(e.target.value)} />
                                        <input type="text" placeholder="ZIP Code" className={inputClasses} value={shippingZipCode} onChange={(e) => setShippingZipCode(e.target.value)} />
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
                                <h2 className="text-lg font-bold text-white mb-4">Total</h2>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between text-zinc-400">
                                        <span>Subtotal ({orderItems.length} IDs)</span>
                                        <span>${subtotal.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-zinc-400">
                                        <span>Processing</span>
                                        <span>${HANDLING_FEE.toFixed(2)}</span>
                                    </div>
                                    {deliveryMethod === 'shipping' && (
                                        <div className="flex justify-between text-zinc-400">
                                            <span>Shipping</span>
                                            <span>${SHIPPING_FEE.toFixed(2)}</span>
                                        </div>
                                    )}
                                    {discountResult && (
                                        <div className="flex justify-between text-emerald-400">
                                            <span>Discount ({discountResult.code})</span>
                                            <span>-${discountResult.discountAmount.toFixed(2)}</span>
                                        </div>
                                    )}
                                    <div className="border-t border-white/[0.08] my-3" />
                                    <div className="flex justify-between text-white font-bold text-xl">
                                        <span>Total</span>
                                        <span className="text-price">${total.toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Discount Code */}
                            <div>
                                <h2 className="text-label mb-3">Discount Code</h2>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        placeholder="Enter code..."
                                        className={inputClasses}
                                        value={discountCode}
                                        onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
                                        onKeyDown={(e) => e.key === 'Enter' && handleApplyDiscount()}
                                    />
                                    <button
                                        onClick={handleApplyDiscount}
                                        disabled={discountLoading || !discountCode.trim()}
                                        className="btn btn-outline px-4 py-2.5 text-sm flex-shrink-0"
                                    >
                                        {discountLoading ? <Spinner size="sm" /> : 'Apply'}
                                    </button>
                                </div>
                                {discountError && (
                                    <p className="text-red-400 text-xs mt-2">{discountError}</p>
                                )}
                                {discountResult && (
                                    <p className="text-emerald-400 text-xs mt-2">
                                        {discountResult.discountType === 'percentage'
                                            ? `${discountResult.value}% off applied!`
                                            : `$${discountResult.value.toFixed(2)} off applied!`}
                                    </p>
                                )}
                            </div>

                            {/* Payment */}
                            <div>
                                <h2 className="text-label mb-3">Payment Method</h2>
                                <div className="space-y-2">
                                    {paymentMethods.map(method => (
                                        <button
                                            key={method.name}
                                            onClick={() => setActivePayment(method.name)}
                                            className={`w-full flex items-center p-3 rounded-xl border transition-all cursor-pointer ${activePayment === method.name
                                                ? 'border-indigo-500 bg-indigo-500/10'
                                                : 'border-white/[0.08] hover:border-white/[0.16]'
                                                }`}
                                        >
                                            <span className="flex items-center justify-center h-7 w-7 rounded-lg bg-white/[0.08] mr-3 text-sm font-bold text-zinc-300">{method.icon}</span>
                                            <span className="text-sm font-medium text-white">{method.name}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Submit */}
                            <button
                                onClick={handleFinalOrderSubmit}
                                className="btn btn-primary w-full py-3.5 text-base"
                                disabled={loading || orderItems.length === 0}
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
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className={`glass p-8 max-w-sm w-full border ${orderStatus === 'success' ? 'border-emerald-500/30' :
                        orderStatus === 'error' ? 'border-red-500/30' : 'border-indigo-500/30'
                        } animate-fade-up`}>
                        <h3 className={`text-xl font-bold mb-3 text-center ${orderStatus === 'success' ? 'text-emerald-400' :
                            orderStatus === 'error' ? 'text-red-400' : 'text-indigo-400'
                            }`}>
                            {orderStatus === 'processing' ? 'Processing...' : orderStatus === 'success' ? 'Order Placed!' : 'Error'}
                        </h3>
                        <p className="text-sm text-zinc-300 text-center mb-6">{orderMessage}</p>
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
                                <Spinner size="md" className="text-indigo-400" />
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default withAuth(CheckoutPage);